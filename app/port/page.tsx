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
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="example.com"
            className="flex-1 min-w-[200px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={ports}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="80,443"
            className="w-36 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={checkPorts}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            Check
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={copyResults} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition">
                <Copy size={13} /> Copy
              </button>
              <button onClick={exportResults} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition">
                <Download size={13} /> Export
              </button>
            </div>

            <ul className="space-y-2 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 shadow-sm">
                  <span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{r.port}</strong> — <span className="text-slate-600 dark:text-slate-300">{r.status}</span>
                  </span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-xs font-semibold"
                  >
                    Test <ExternalLink size={13} />
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
