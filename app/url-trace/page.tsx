"use client";

import React, { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, RefreshCw, Share2, Trash2, Link as LinkIcon } from "lucide-react";

type Hop = {
  url: string;
  status: number;
  location?: string;
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

export default function UrlTracer() {
  const [url, setUrl] = useState("https://bit.ly/3xyz");
  const [hops, setHops] = useState<Hop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trace() {
    setError(null);
    setLoading(true);
    setHops([]);
    try {
      if (!/^https?:\/\//i.test(url)) {
        setError("Please enter a valid URL starting with http:// or https://");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setHops(json.hops || []);
    } catch (err: any) {
      setError("Failed to trace: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  function exportFile(type: "json" | "txt" | "md") {
    if (!hops.length) return;
    if (type === "json") {
      downloadBlob(JSON.stringify({ url, hops }, null, 2), "redirect-trace.json", "application/json");
    } else if (type === "txt") {
      const txt = hops.map((h, i) => `${i + 1}. [${h.status}] ${h.url}${h.location ? " → " + h.location : ""}`).join("\n");
      downloadBlob(txt, "redirect-trace.txt");
    } else {
      const md = `# Redirect Trace for ${url}\n\n${hops
        .map((h, i) => `- **${i + 1}. [${h.status}]** ${h.url}${h.location ? " → ${h.location}" : ""}`)
        .join("\n")}`;
      downloadBlob(md, "redirect-trace.md", "text/markdown");
    }
  }

  async function share() {
    if (!hops.length) return;
    const text = `Redirect trace for ${url}\n${hops
      .map((h, i) => `${i + 1}. [${h.status}] ${h.url}${h.location ? " → " + h.location : ""}`)
      .join("\n")}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Redirect Trace", text });
      } catch {
        alert("Share cancelled");
      }
    } else {
      await copyText(text);
    }
  }

  return (
    <div className="space-y-8">
      <Section title="URL Unshortener & Redirect Tracer" subtitle="Expand shortened links and inspect redirect chains">
        <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
          This tool follows HTTP redirects (301, 302, etc.) from a given URL and displays the full redirect chain.
          Useful for analyzing shortened links, detecting suspicious redirects, and verifying final destinations.
        </p>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder="https://bit.ly/example"
          />
          <button
            onClick={trace}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Tracing…" : "Trace"}
          </button>
          <button
            onClick={() => {
              setUrl("https://bit.ly/3xyz");
              setHops([]);
              setError(null);
            }}
            className="px-3 py-2 border rounded flex items-center gap-2"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        {error && <div className="text-sm text-amber-500 mt-2">⚠ {error}</div>}

        {/* Results */}
        {hops.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copyText(JSON.stringify({ url, hops }, null, 2))} className="px-3 py-1 border rounded flex items-center gap-1">
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

            <div className="rounded border bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-4">
                <div className="text-sm font-medium">Redirect Chain</div>
                <div className="ml-auto text-xs text-slate-400">({hops.length} hops)</div>
              </div>
              <div>
                {hops.map((h, i) => (
                  <div key={i} className="px-4 py-3 border-b last:border-b-0 flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                    <div className="flex-shrink-0 w-16 text-slate-500">[{h.status}]</div>
                    <div className="flex-1 break-all">{h.url}</div>
                    {h.location && <div className="text-slate-400">→ {h.location}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}


// // app/api/trace/route.ts
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     const { url } = await req.json();
//     if (!url || !/^https?:\/\//i.test(url)) {
//       return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
//     }

//     const hops: { url: string; status: number; location?: string }[] = [];
//     let current = url;
//     let maxRedirects = 10;

//     while (maxRedirects-- > 0) {
//       const res = await fetch(current, { method: "GET", redirect: "manual" });
//       const status = res.status;
//       const location = res.headers.get("location") || undefined;
//       hops.push({ url: current, status, location });
//       if (!location || !(status >= 300 && status < 400)) break;
//       // Resolve relative redirects
//       try {
//         current = new URL(location, current).href;
//       } catch {
//         break;
//       }
//     }

//     return NextResponse.json({ hops });
//   } catch (err: any) {
//     return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
//   }
// }
