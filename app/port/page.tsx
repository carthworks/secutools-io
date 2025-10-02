"use client";
import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, ExternalLink } from "lucide-react";

export default function PortPage() {
  const [host, setHost] = useState("example.com");
  const [ports, setPorts] = useState("80,443");
  const [results, setResults] = useState<{ port: string; url: string; status: string }[]>([]);

  function parsePorts(input: string): string[] {
    return input
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  async function checkPorts() {
    const list = parsePorts(ports);
    const res: { port: string; url: string; status: string }[] = [];

    for (const port of list) {
      const url = `https://${host}:${port}`;
      try {
        // Try fetch - will often fail due to CORS
        const r = await fetch(url, { mode: "no-cors" });
        res.push({ port, url, status: r ? "Possibly Open (check manually)" : "Unknown" });
      } catch {
        res.push({ port, url, status: "Blocked by Browser (CORS)" });
      }
    }

    setResults(res);
  }

  function copyResults() {
    if (!results.length) return;
    navigator.clipboard.writeText(
      results.map((r) => `${r.port}: ${r.status} (${r.url})`).join("\n")
    );
    alert("Copied results to clipboard");
  }

  function exportResults() {
    if (!results.length) return;
    const blob = new Blob(
      [results.map((r) => `${r.port}: ${r.status} (${r.url})`).join("\n")],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${host}-ports.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <Section
        title="Port Check Helper (Client-Only)"
        subtitle="Generate URLs to test ports manually. Note: Full port scanning requires a server."
      >
        <div className="flex gap-2 mb-3">
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="example.com"
            className="flex-1 border rounded p-2"
          />
          <input
            value={ports}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="80,443"
            className="w-40 border rounded p-2"
          />
          <button
            onClick={checkPorts}
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Check
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={copyResults} className="px-3 py-1 border rounded flex items-center gap-1">
                <Copy size={14} /> Copy
              </button>
              <button onClick={exportResults} className="px-3 py-1 border rounded flex items-center gap-1">
                <Download size={14} /> Export
              </button>
            </div>

            <ul className="space-y-2 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex items-center justify-between border rounded p-2 bg-slate-50">
                  <span>
                    <strong>{r.port}</strong> — {r.status}
                  </span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary flex items-center gap-1"
                  >
                    Test <ExternalLink size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}
