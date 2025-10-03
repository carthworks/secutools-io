// File: components/ASNLookup.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  Share2,
  FileText,
  File,
  Search as IconSearch,
  CheckCircle,
  XCircle,
  Upload,
  Clock,
  Trash2,
  Info,
} from "lucide-react";

/**
 * ASNLookup component
 *
 * Features:
 * - Offline dataset (sample built-in + CSV upload to extend)
 * - IPv4/IPv6 validation (IPv6 best-effort)
 * - CIDR-aware longest-prefix match lookup
 * - One-click copy, export (text/markdown/json), print-as-pdf, share
 * - Simple syntax highlighting for result output (no external libs)
 * - Real-time preview (debounced), error detection & suggestions
 * - Accessible controls and responsive layout
 */

/* ---------------------------
   Types & sample dataset
   --------------------------- */

type ASNRecord = {
  asn: string; // e.g. "AS15169"
  cidr: string; // e.g. "8.8.8.0/24"
  isp: string;
  country?: string;
  notes?: string;
};

const SAMPLE_DATA: ASNRecord[] = [
  { asn: "AS15169", cidr: "8.8.8.0/24", isp: "Google LLC", country: "US", notes: "Public DNS" },
  { asn: "AS16509", cidr: "52.95.110.0/24", isp: "Amazon.com, Inc.", country: "US" },
  { asn: "AS13335", cidr: "104.16.0.0/12", isp: "Cloudflare, Inc.", country: "US" },
  { asn: "AS32934", cidr: "185.60.216.0/22", isp: "Facebook, Inc.", country: "US" },
  { asn: "AS3595", cidr: "193.0.0.0/8", isp: "RIPE-NCC Example", country: "EU" },
];

/* ---------------------------
   Helpers: IP utilities
   --------------------------- */

/* IPv4 regex (strict-ish) */
const IPV4_RE =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

/* Basic IPv6 presence checks (full validation is complex; we do simple detection) */
const IPV6_RE = /:/;

/* Convert IPv4 dotted quad to 32-bit integer */
function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/* Given cidr 'a.b.c.d/n', check if ip inside (IPv4 only) */
function cidrContains(cidr: string, ip: string): boolean {
  try {
    if (!IPV4_RE.test(ip)) return false; // we only do CIDR checks for IPv4 here
    const [net, bitsStr] = cidr.split("/");
    const bits = parseInt(bitsStr || "32", 10);
    const ipInt = ipv4ToInt(ip);
    const netInt = ipv4ToInt(net);
    const mask = bits === 0 ? 0 : 0xffffffff << (32 - bits);
    return (ipInt & mask) === (netInt & mask);
  } catch {
    return false;
  }
}

/* Longest-prefix match: prefer larger prefix length */
function prefixLength(cidr: string): number {
  const parts = cidr.split("/");
  return parseInt(parts[1] || "0", 10);
}

/* Validate IP (IPv4 strict, IPv6 best-effort) */
function isValidIP(ip: string) {
  const v4 = IPV4_RE.test(ip);
  const v6 = IPV6_RE.test(ip) && ip.split("::").length <= 2; // very light check
  return v4 || v6;
}

/* ---------------------------
   Export / copy helpers
   --------------------------- */

function downloadBlob(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function tryWebShare(data: { title?: string; text?: string; url?: string }) {
  if ((navigator as any).share) {
    try {
      await (navigator as any).share(data);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/* ---------------------------
   Syntax highlight (very small)
   --------------------------- */

function highlightJSON(obj: any) {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  // naive tokenizer
  return json
    .replace(/(&)/g, "&amp;")
    .replace(/(>)/g, "&gt;")
    .replace(/(<)/g, "&lt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\b-?\d+(\.\d+)?([eE][+\-]?\d+)?\b)/g,
      (match) => {
        let cls = "text-blue-600"; // string
        if (/^"/.test(match)) {
          cls = /:\s*$/.test(match) ? "text-slate-700 font-semibold" : "text-emerald-700"; // key vs string
        } else if (/true|false/.test(match)) cls = "text-rose-600";
        else if (/null/.test(match)) cls = "text-slate-500 italic";
        else cls = "text-orange-600"; // number
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

/* ---------------------------
   Component
   --------------------------- */

export default function ASNLookup() {
  // data
  const [dataset, setDataset] = useState<ASNRecord[]>(() => SAMPLE_DATA.slice());
  const [ipInput, setIpInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found?: ASNRecord; suggestion?: ASNRecord; message?: string } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const resultRef = useRef<HTMLPreElement | null>(null);

  // debounce lookup
  useEffect(() => {
    if (ipInput.trim() === "") {
      setError(null);
      setResult(null);
      return;
    }
    const t = setTimeout(() => {
      handleLookup(ipInput.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipInput]);

  // core lookup logic
  function handleLookup(ip: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!isValidIP(ip)) {
      setError("Invalid IP address. Try IPv4 like 8.8.8.8 or IPv6 like 2001:4860:4860::8888.");
      setLoading(false);
      return;
    }

    // IPv4 exact CIDR or longest-prefix
    // 1) find exact CIDR that contains ip
    const matches = dataset.filter((r) => cidrContains(r.cidr, ip));
    if (matches.length > 0) {
      // pick longest prefix
      matches.sort((a, b) => prefixLength(b.cidr) - prefixLength(a.cidr));
      const found = matches[0];
      setResult({ found, message: "Exact/Longest-prefix match found." });
      setHistory((h) => [`${new Date().toISOString()} — ${ip} → ${found.asn} (${found.isp})`, ...h].slice(0, 30));
      setLoading(false);
      return;
    }

    // 2) no exact match: try best suggestion by longest common prefix heuristics (IPv4 only)
    // We'll try to find CIDR where network octets match progressively.
    if (IPV4_RE.test(ip)) {
      const octets = ip.split(".");
      // prefer /16 then /8 etc
      const candidates = dataset
        .map((r) => ({ r, len: prefixLength(r.cidr) }))
        .sort((a, b) => b.len - a.len)
        .map((x) => x.r);
      // check if first n octets match network
      let best: ASNRecord | null = null;
      for (const r of candidates) {
        const [net] = r.cidr.split("/");
        const netOctets = net.split(".");
        let common = 0;
        for (let i = 0; i < 4; i++) {
          if (netOctets[i] === octets[i]) common++;
          else break;
        }
        if (common > 0) {
          best = r;
          break;
        }
      }
      setResult({ suggestion: best ?? undefined, message: "No exact match — showing nearest suggestion." });
      setHistory((h) => [`${new Date().toISOString()} — ${ip} → no exact match`, ...h].slice(0, 30));
      setLoading(false);
      return;
    }

    // IPv6 fallback (no dataset)
    setResult({ message: "No offline IPv6 mapping available. Try WHOIS or online sources." });
    setHistory((h) => [`${new Date().toISOString()} — ${ip} → ipv6 (no offline match)`, ...h].slice(0, 30));
    setLoading(false);
  }

  // copy result text
  async function copyResult() {
    const text = formatTextResult();
    try {
      await navigator.clipboard.writeText(text);
      setLastAction("Copied to clipboard");
      setTimeout(() => setLastAction(null), 1800);
    } catch {
      setLastAction("Copy failed");
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  function formatTextResult(): string {
    if (!result) return "No result";
    if (result.found) {
      return `ASN: ${result.found.asn}\nISP: ${result.found.isp}\nCIDR: ${result.found.cidr}\nCountry: ${result.found.country || "N/A"}\nNotes: ${result.found.notes || ""}`;
    }
    if (result.suggestion) {
      return `No exact match. Nearest suggestion:\nASN: ${result.suggestion.asn}\nISP: ${result.suggestion.isp}\nCIDR: ${result.suggestion.cidr}`;
    }
    return result.message || "No result";
  }

  // export handlers
  function exportText() {
    downloadBlob("asn-result.txt", formatTextResult(), "text/plain;charset=utf-8");
    setLastAction("Exported .txt");
    setTimeout(() => setLastAction(null), 1800);
  }
  function exportJSON() {
    const payload = result?.found ?? result?.suggestion ?? { message: result?.message ?? "no result" };
    downloadBlob("asn-result.json", JSON.stringify(payload, null, 2), "application/json");
    setLastAction("Exported .json");
    setTimeout(() => setLastAction(null), 1800);
  }
  function exportMarkdown() {
    const md = `# ASN Lookup Result\n\n${formatTextResult().replace(/\n/g, "\n\n")}\n`;
    downloadBlob("asn-result.md", md, "text/markdown");
    setLastAction("Exported .md");
    setTimeout(() => setLastAction(null), 1800);
  }

  function exportPrintPDF() {
    // open printable page and call print — minimal deps
    const content = `
      <html>
      <head>
        <title>ASN Lookup Result</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:24px; color:#0f172a}
          pre{background:#f8fafc;padding:16px;border-radius:8px;overflow:auto}
          h1{font-size:18px;margin-bottom:8px}
          .meta{color:#64748b;font-size:13px;margin-bottom:12px}
        </style>
      </head>
      <body>
        <h1>ASN Lookup Result</h1>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
        <pre>${escapeHtml(formatTextResult())}</pre>
      </body>
      </html>
    `;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      setLastAction("Unable to open print window");
      setTimeout(() => setLastAction(null), 1800);
      return;
    }
    w.document.write(content);
    w.document.close();
    // give the browser a tick
    setTimeout(() => {
      w.focus();
      w.print();
    }, 300);
    setLastAction("Opened print dialog");
    setTimeout(() => setLastAction(null), 1800);
  }

  function escapeHtml(s: string) {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  // share action (Web Share API fallback)
  async function shareResult() {
    const text = formatTextResult();
    const shared = await tryWebShare({ title: "ASN Lookup Result", text });
    if (!shared) {
      // fallback: copy
      try {
        await navigator.clipboard.writeText(text);
        setLastAction("Copied result to clipboard (share fallback)");
      } catch {
        setLastAction("Share not available; copy failed");
      }
      setTimeout(() => setLastAction(null), 1800);
    } else {
      setLastAction("Shared via Web Share");
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  // CSV upload: expected columns: asn,cidr,isp,country,notes
  async function handleCSVUpload(file: File | null) {
    if (!file) return;
    const txt = await file.text();
    const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newRows: ASNRecord[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 3) continue; // need at least asn,cidr,isp
      newRows.push({ asn: parts[0], cidr: parts[1], isp: parts[2], country: parts[3], notes: parts[4] });
    }
    if (newRows.length === 0) {
      setLastAction("No valid rows found in CSV");
      setTimeout(() => setLastAction(null), 1800);
      return;
    }
    setDataset((d) => [...newRows, ...d]);
    setLastAction(`Loaded ${newRows.length} rows`);
    setTimeout(() => setLastAction(null), 1800);
  }

  // small UI actions
  function clearHistory() {
    setHistory([]);
    setLastAction("History cleared");
    setTimeout(() => setLastAction(null), 1200);
  }

  // small derived html highlight
  const highlighted = useMemo(() => {
    if (!result) return "";
    if (result.found) {
      return highlightJSON(result.found);
    }
    if (result.suggestion) return highlightJSON({ suggestion: result.suggestion, note: result.message });
    return `<span class="text-slate-600">${escapeHtml(result.message || "No result")}</span>`;
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">ASN Lookup — Offline</h2>
          <p className="text-sm text-slate-500 max-w-xl">
            Find ASN / ISP info for IPv4 addresses using an offline dataset. Upload your CSV to extend the dataset. Quick export,
            copy, and sharing included.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIpInput("8.8.8.8");
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-sm"
            title="Try example"
          >
            <Clock className="w-4 h-4 text-slate-600" /> Try example
          </button>
          <div className="text-xs text-slate-400">Built for students & pros</div>
        </div>
      </div>

      {/* main grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* left: input & controls */}
        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">IP address</label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              inputMode="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="e.g., 8.8.8.8 or 2001:4860:4860::8888"
              className="flex-1 px-3 py-2 rounded border bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="IP address input"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup(ipInput.trim());
              }}
            />
            <button
              onClick={() => handleLookup(ipInput.trim())}
              className="inline-flex items-center gap-2 px-3 rounded bg-indigo-600 text-white text-sm"
              aria-label="Lookup"
            >
              <IconSearch className="w-4 h-4" /> Lookup
            </button>
          </div>

          {error ? (
            <div className="mt-3 flex items-start gap-2 text-sm text-rose-700">
              <XCircle className="w-4 h-4" /> <div>{error}</div>
            </div>
          ) : null}

          <div className="mt-3 text-xs text-slate-500">Tips: paste IP and press Enter. Upload CSV to add mappings.</div>

          <div className="mt-4 flex gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded border bg-white text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleCSVUpload(e.target.files?.[0] ?? null)}
                className="hidden"
                aria-label="Upload CSV dataset"
              />
              Upload CSV
            </label>

            <button
              onClick={() => {
                // export current dataset sample
                const csv = dataset.map((r) => [r.asn, r.cidr, r.isp, r.country ?? "", r.notes ?? ""].join(",")).join("\n");
                downloadBlob("asn-dataset-sample.csv", csv, "text/csv");
                setLastAction("Dataset downloaded");
                setTimeout(() => setLastAction(null), 1200);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded border text-sm"
              aria-label="Download dataset"
              title="Download current dataset"
            >
              <Download className="w-4 h-4" /> Export dataset
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>History</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(history.join("\n")).then(() => {
                      setLastAction("History copied");
                      setTimeout(() => setLastAction(null), 1200);
                    });
                  }}
                  className="px-2 py-1 rounded text-xs border"
                >
                  Copy
                </button>
                <button onClick={clearHistory} className="px-2 py-1 rounded text-xs border">
                  Clear
                </button>
              </div>
            </div>
            <div className="mt-2 max-h-36 overflow-auto text-xs text-slate-700 dark:text-slate-200">
              {history.length === 0 ? <div className="text-slate-400">No lookups yet</div> : history.map((h, i) => <div key={i} className="py-0.5">{h}</div>)}
            </div>
          </div>
        </div>

        {/* middle/right: result and actions */}
        <div className="md:col-span-2 space-y-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">Result</h3>
                  {loading && <div className="text-sm text-slate-500 inline-flex items-center gap-1"><Clock className="w-4 h-4" /> Searching…</div>}
                </div>
                <div className="text-xs text-slate-500 mt-1">{result?.message ?? "Enter an IP to start."}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={copyResult} className="px-2 py-1 rounded border text-sm" aria-label="Copy result">
                  <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy</span>
                </button>
                <div className="relative">
                  <button className="px-2 py-1 rounded border text-sm" aria-label="Export options">
                    <File className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                  </button>
                  <div className="absolute right-0 mt-10 hidden group-hover:block"></div>
                </div>

                <button onClick={exportText} className="px-2 py-1 rounded border text-sm" aria-label="Export text">
                  <FileText className="w-4 h-4" /> TXT
                </button>
                <button onClick={exportJSON} className="px-2 py-1 rounded border text-sm" aria-label="Export JSON">
                  <File className="w-4 h-4" /> JSON
                </button>
                <button onClick={exportMarkdown} className="px-2 py-1 rounded border text-sm" aria-label="Export Markdown">
                  <FileText className="w-4 h-4" /> MD
                </button>
                <button onClick={exportPrintPDF} className="px-2 py-1 rounded border text-sm" aria-label="Print / Save as PDF">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button onClick={shareResult} className="px-2 py-1 rounded border text-sm" aria-label="Share result">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {/* result display */}
            <div className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* badges */}
                <div className="col-span-1 space-y-2">
                  <div className="text-xs text-slate-500">ASN</div>
                  <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {result?.found?.asn ?? result?.suggestion?.asn ?? "—"}
                  </div>

                  <div className="text-xs text-slate-500 mt-3">ISP</div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">{result?.found?.isp ?? result?.suggestion?.isp ?? "—"}</div>

                  <div className="flex gap-2 mt-3">
                    <div className="text-xs text-slate-500">CIDR</div>
                    <div className="text-xs text-slate-600">{result?.found?.cidr ?? result?.suggestion?.cidr ?? "—"}</div>
                  </div>
                </div>

                {/* highlighted JSON / preview */}
                <div className="md:col-span-2">
                  <div className="rounded border p-3 bg-slate-50 dark:bg-slate-900">
                    <div
                      ref={resultRef}
                      className="prose-pre max-h-72 overflow-auto text-sm"
                      aria-live="polite"
                      dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                  </div>

                  {/* suggestions & actions */}
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    {result?.found && (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://whois.arin.net/rest/ip/${result.found.cidr.split("/")[0]}`}
                        className="text-xs px-2 py-1 rounded border"
                      >
                        Lookup WHOIS
                      </a>
                    )}
                    {result?.suggestion && (
                      <div className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-800">
                        Suggestion: {result.suggestion.asn} — {result.suggestion.isp}
                      </div>
                    )}
                    {!result?.found && !result?.suggestion && result?.message && (
                      <div className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-800">{result.message}</div>
                    )}

                    {/* allow adding custom override: quick add */}
                    <button
                      onClick={() => {
                        if (!ipInput || !isValidIP(ipInput)) {
                          setLastAction("Provide a valid IP to create mapping");
                          setTimeout(() => setLastAction(null), 1200);
                          return;
                        }
                        const guess = { asn: "AS_CUSTOM", cidr: `${ipInput}/32`, isp: "Manual entry", country: "", notes: "Added by user" };
                        setDataset((d) => [guess, ...d]);
                        setLastAction("Added manual mapping to dataset");
                        setTimeout(() => setLastAction(null), 1200);
                      }}
                      className="px-2 py-1 rounded border text-sm"
                      aria-label="Add manual mapping"
                    >
                      <Info className="w-4 h-4 inline" /> Add mapping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* small footer actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Lightweight • Offline-first • No external requests</div>
            <div className="text-xs text-slate-400">{lastAction ?? "Ready"}</div>
          </div>
        </div>
      </div>

      {/* raw dataset preview */}
      <div className="mt-4 bg-white dark:bg-slate-800 p-4 rounded border">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Dataset (preview)</div>
          <div className="text-xs text-slate-500">Rows: {dataset.length}</div>
        </div>
        <div className="mt-2 text-xs overflow-auto max-h-40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr>
                <th className="py-1 pr-3">ASN</th>
                <th className="py-1 pr-3">CIDR</th>
                <th className="py-1 pr-3">ISP</th>
                <th className="py-1 pr-3">Country</th>
                <th className="py-1 pr-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {dataset.slice(0, 12).map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-3">{r.asn}</td>
                  <td className="py-1 pr-3">{r.cidr}</td>
                  <td className="py-1 pr-3">{r.isp}</td>
                  <td className="py-1 pr-3">{r.country}</td>
                  <td className="py-1 pr-3">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {dataset.length > 12 && <div className="mt-2 text-xs text-slate-500">Showing first 12 rows</div>}
        </div>
      </div>
    </div>
  );
}
