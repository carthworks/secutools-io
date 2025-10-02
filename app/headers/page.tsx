"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, Trash2, RefreshCw } from "lucide-react";

/* utils */
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

export default function HeadersPage() {
  const [target, setTarget] = useState("https://example.com");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchHeaders() {
    setError(null);
    setLoading(true);
    try {
      if (!/^https?:\/\//i.test(target)) {
        setError("Please enter a valid http(s) URL");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/headers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setData(await res.json());
    } catch (err: any) {
      setError("Failed to fetch headers: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function exportTXT() {
    if (!data) return;
    const txt = Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    downloadBlob(txt, "headers.txt", "text/plain");
  }
  function exportMD() {
    if (!data) return;
    const md =
      `# HTTP Headers for ${target}\n\n` +
      Object.entries(data)
        .map(([k, v]) => `- **${k}:** ${v}`)
        .join("\n");
    downloadBlob(md, "headers.md", "text/markdown");
  }
  function printPDF() {
    if (!data) return;
    const win = window.open("", "_blank", "noopener");
    if (!win) return;
    win.document.write(
      `<pre>${JSON.stringify(data, null, 2)}</pre>`
    );
    win.document.close();
    win.print();
  }
  async function share() {
    if (!data) return;
    const text = `HTTP Headers for ${target}\n\n${JSON.stringify(data, null, 2)}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "HTTP Headers", text });
      } catch {
        // fallback
        await copyText(text);
      }
    } else {
      await copyText(text);
    }
  }

  /* highlight security headers */
  function highlightHeader(name: string) {
    const secHeaders = ["content-security-policy", "x-frame-options", "strict-transport-security", "access-control-allow-origin"];
    return secHeaders.includes(name.toLowerCase())
      ? "text-green-400 font-medium"
      : "text-slate-200";
  }

  return (
    <div className="space-y-8">
      <Section
        title="HTTP Headers Analyzer"
        subtitle="Check and highlight important security headers (CORS, CSP, HSTS)"
      >
        <p className="text-sm text-muted-foreground mb-3">
          Enter a website URL below to fetch its HTTP response headers.
          This helps security testers and developers verify configurations like
          CORS, CSP, and HSTS. Data is fetched via a server-side API proxy for security.
        </p>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex-1 bg-white border border-slate-300 rounded p-2 text-sm"
            placeholder="https://example.com"
          />
          <button
            onClick={fetchHeaders}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Fetching…" : "Fetch"}
          </button>
        </div>

        {/* Feedback */}
        {error && <div className="text-red-500 text-sm mt-2">⚠ {error}</div>}

        {/* Actions */}
        {data && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => copyText(JSON.stringify(data, null, 2))}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm"
            >
              <Copy size={14} /> Copy JSON
            </button>
            <button
              onClick={exportTXT}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm"
            >
              <Download size={14} /> Export TXT
            </button>
            <button
              onClick={exportMD}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm"
            >
              <Download size={14} /> Export MD
            </button>
            <button
              onClick={printPDF}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm"
            >
              <Download size={14} /> Print/PDF
            </button>
            <button
              onClick={share}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm"
            >
              <Share2 size={14} /> Share
            </button>
            <button
              onClick={() => {
                setData(null);
                setTarget("https://example.com");
              }}
              className="flex items-center gap-1 px-3 py-1 border rounded text-sm"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="mt-5">
            <div className="rounded border bg-slate-900 text-slate-50 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left px-3 py-2">Header</th>
                    <th className="text-left px-3 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data).map(([key, val]) => (
                    <tr key={key} className="border-t border-slate-700">
                      <td className={`px-3 py-1 ${highlightHeader(key)}`}>
                        {key}
                      </td>
                      <td className="px-3 py-1 text-slate-300 break-all">
                        {String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* JSON raw preview */}
            <pre className="mt-4 text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2 text-black-200">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </Section>
    </div>
  );
}
