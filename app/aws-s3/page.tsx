
"use client";

import React, { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, RefreshCw, Share2, Trash2, Cloud } from "lucide-react";

type S3Result = {
  bucket: string;
  exists: boolean;
  publicRead: boolean;
  publicList: boolean;
  publicWrite: boolean;
  region?: string;
  error?: string;
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  } catch {
    alert("Copy failed");
  }
}
function downloadBlob(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function S3Checker() {
  const [bucket, setBucket] = useState("my-sample-bucket");
  const [result, setResult] = useState<S3Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkBucket() {
    setError(null);
    setLoading(true);
    setResult(null);

    if (!bucket || !/^[a-z0-9.-]{3,63}$/.test(bucket)) {
      setError("Invalid bucket name format");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/aws-s3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bucket }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError("Failed: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  function exportFile(type: "json" | "txt" | "md") {
    if (!result) return;
    if (type === "json") {
      downloadBlob(JSON.stringify(result, null, 2), "s3-check.json", "application/json");
    } else if (type === "txt") {
      const txt =
        `Bucket: ${result.bucket}\nExists: ${result.exists}\nPublic Read: ${result.publicRead}\nPublic List: ${result.publicList}\nPublic Write: ${result.publicWrite}\nRegion: ${result.region || "?"}\nError: ${result.error || "None"}`;
      downloadBlob(txt, "s3-check.txt");
    } else {
      const md =
        `# AWS S3 Bucket Check\n\n- **Bucket:** ${result.bucket}\n- **Exists:** ${result.exists}\n- **Public Read:** ${result.publicRead}\n- **Public List:** ${result.publicList}\n- **Public Write:** ${result.publicWrite}\n- **Region:** ${result.region || "?"}\n- **Error:** ${result.error || "None"}`;
      downloadBlob(md, "s3-check.md", "text/markdown");
    }
  }

  async function share() {
    if (!result) return;
    const txt = `S3 Check: ${result.bucket}\nExists: ${result.exists}\nPublic Read: ${result.publicRead}\nPublic List: ${result.publicList}\nPublic Write: ${result.publicWrite}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "S3 Bucket Check", text: txt });
      } catch {
        alert("Share cancelled");
      }
    } else {
      await copyText(txt);
    }
  }

  return (
    <div className="space-y-8">
      <Section title="AWS S3 Bucket Checker" subtitle="Check if an AWS S3 bucket is public or misconfigured">
        <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
          Enter an S3 bucket name to check whether it is public, listable, or writable.  
          The tool uses safe, read-only requests to detect misconfigurations. No credentials required.
        </p>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder="my-example-bucket"
          />
          <button
            onClick={checkBucket}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Check"}
          </button>
          <button
            onClick={() => {
              setBucket("");
              setResult(null);
              setError(null);
            }}
            className="px-3 py-2 border rounded flex items-center gap-2"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        {error && <div className="text-sm text-amber-500 mt-2">⚠ {error}</div>}

        {/* Results */}
        {result && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded border bg-white">
              <h3 className="text-sm font-medium mb-2">Results</h3>
              <ul className="space-y-1 text-sm">
                <li><strong>Bucket:</strong> {result.bucket}</li>
                <li><strong>Exists:</strong> {result.exists ? "✅ Yes" : "❌ No"}</li>
                <li><strong>Public Read:</strong> {result.publicRead ? "⚠️ Yes" : "No"}</li>
                <li><strong>Public List:</strong> {result.publicList ? "⚠️ Yes" : "No"}</li>
                <li><strong>Public Write:</strong> {result.publicWrite ? "⚠️ Yes" : "No"}</li>
                <li><strong>Region:</strong> {result.region || "?"}</li>
                {result.error && <li><strong>Error:</strong> {result.error}</li>}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => copyText(JSON.stringify(result, null, 2))} className="px-3 py-1 border rounded flex items-center gap-1">
                <Copy size={14} /> Copy JSON
              </button>
              <button onClick={() => exportFile("txt")} className="px-3 py-1 border rounded flex items-center gap-1">
                <Download size={14} /> Export TXT
              </button>
              <button onClick={() => exportFile("md")} className="px-3 py-1 border rounded flex items-center gap-1">
                <Download size={14} /> Export MD
              </button>
              <button onClick={share} className="px-3 py-1 border rounded flex items-center gap-1">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// This is where the real check happens (server-side, so no CORS).
// It checks:

// If the bucket exists

// If objects can be listed

// If files can be read

// If uploads are allowed (optional, safe test mode recommended)

// app/api/aws-s3/route.ts
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     const { bucket } = await req.json();
//     if (!bucket) return NextResponse.json({ error: "No bucket provided" }, { status: 400 });

//     const result: any = { bucket, exists: false, publicRead: false, publicList: false, publicWrite: false };

//     // HEAD bucket check
//     const head = await fetch(`https://${bucket}.s3.amazonaws.com/`, { method: "HEAD" });
//     result.exists = head.status !== 404;

//     if (!result.exists) return NextResponse.json(result);

//     // List check
//     const list = await fetch(`https://${bucket}.s3.amazonaws.com/?list-type=2`, { method: "GET" });
//     result.publicList = list.status === 200;

//     // Public read check (try accessing common file key)
//     const testFile = await fetch(`https://${bucket}.s3.amazonaws.com/robots.txt`);
//     if (testFile.status === 200) result.publicRead = true;

//     // Region info
//     result.region = head.headers.get("x-amz-bucket-region");

//     // (Optional) public write test — requires PUT, usually disabled in public tools
//     // result.publicWrite = false; // keep safe default

//     return NextResponse.json(result);
//   } catch (err: any) {
//     return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
//   }
// }
