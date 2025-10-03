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

/* ---------------------------
   Types & sample dataset
   --------------------------- */

type ASNRecord = {
  asn: string;
  cidr: string;
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
   Helpers: IP utilities (defensive)
   --------------------------- */

/* IPv4 regex (strict-ish) */
const IPV4_RE =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

/* Basic IPv6 presence checks (very light) */
const IPV6_RE = /:/;

/* Convert IPv4 dotted quad to 32-bit integer (safe) */
function ipv4ToInt(ip: string): number | null {
  if (!ip || typeof ip !== "string") return null;
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const n = Number(p);
    if (Number.isNaN(n) || n < 0 || n > 255) return null;
    acc = (acc << 8) + n;
    // keep unsigned 32-bit
    acc = acc >>> 0;
  }
  return acc >>> 0;
}

/* Create mask for n bits (0..32) in unsigned 32-bit */
function maskFromBits(bits: number): number {
  const b = Math.max(0, Math.min(32, Number(bits) || 0));
  if (b === 0) return 0;
  // e.g., b=24 -> mask = 0xFFFFFF00
  return ((0xffffffff >>> 0) << (32 - b)) >>> 0;
}

/* Given cidr 'a.b.c.d/n', check if ip inside (IPv4 only). Defensive: returns false for invalid inputs */
function cidrContains(cidr: string | undefined, ip: string | undefined): boolean {
  try {
    if (!cidr || !ip || typeof cidr !== "string" || typeof ip !== "string") return false;
    if (!IPV4_RE.test(ip)) return false; // only checking IPv4 here
    const parts = cidr.split("/");
    if (parts.length !== 2) return false;
    const net = parts[0];
    const bitsStr = parts[1];
    if (!IPV4_RE.test(net)) return false;
    const bits = parseInt(bitsStr || "32", 10);
    if (Number.isNaN(bits) || bits < 0 || bits > 32) return false;
    const ipInt = ipv4ToInt(ip);
    const netInt = ipv4ToInt(net);
    if (ipInt === null || netInt === null) return false;
    const mask = maskFromBits(bits);
    return ((ipInt & mask) >>> 0) === ((netInt & mask) >>> 0);
  } catch {
    return false;
  }
}

/* Longest-prefix match length (defensive) */
function prefixLength(cidr: string | undefined): number {
  try {
    if (!cidr || typeof cidr !== "string") return 0;
    const parts = cidr.split("/");
    if (parts.length !== 2) return 0;
    const v = parseInt(parts[1] || "0", 10);
    if (Number.isNaN(v) || v < 0 || v > 32) return 0;
    return v;
  } catch {
    return 0;
  }
}

/* Validate IP (IPv4 strict, IPv6 best-effort) */
function isValidIP(ip: string | undefined): boolean {
  if (!ip || typeof ip !== "string") return false;
  const v4 = IPV4_RE.test(ip.trim());
  const v6 = IPV6_RE.test(ip) && ip.split("::").length <= 2;
  return v4 || v6;
}

/* ---------------------------
   Export / copy helpers (defensive)
   --------------------------- */

function downloadBlob(filename: string, content: string, mime = "text/plain") {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    // swallow; UI shows action result
    // console.error("download error", e);
  }
}

async function tryWebShare(data: { title?: string; text?: string; url?: string }) {
  try {
    if ((navigator as any).share) {
      await (navigator as any).share(data);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/* ---------------------------
   Syntax highlight (defensive)
   --------------------------- */

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/* Very small highlighter; safe for null/undefined */
function highlightJSON(obj: any) {
  try {
    const json = obj == null ? JSON.stringify(obj) : typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    return escapeHtml(json).replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\b-?\d+(\.\d+)?([eE][+\-]?\d+)?\b)/g,
      (match) => {
        let cls = "text-blue-600";
        if (/^"/.test(match)) {
          cls = /:\s*$/.test(match) ? "text-slate-700 font-semibold" : "text-emerald-700";
        } else if (/true|false/.test(match)) cls = "text-rose-600";
        else if (/null/.test(match)) cls = "text-slate-500 italic";
        else cls = "text-orange-600";
        return `<span class="${cls}">${match}</span>`;
      }
    );
  } catch {
    return `<span class="text-slate-600">Unable to render result</span>`;
  }
}

/* ---------------------------
   Component
   --------------------------- */

export default function ASNLookup() {
  const [dataset, setDataset] = useState<ASNRecord[]>(() => Array.isArray(SAMPLE_DATA) ? SAMPLE_DATA.slice() : []);
  const [ipInput, setIpInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ found?: ASNRecord; suggestion?: ASNRecord; message?: string } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // debounce lookup (defensive: skip if input empty)
  useEffect(() => {
    const val = (ipInput || "").trim();
    if (val === "") {
      setError(null);
      setResult(null);
      return;
    }
    const t = setTimeout(() => {
      handleLookup(val);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipInput]);

  // core lookup logic with defensive guards
  function handleLookup(ipRaw: string) {
    const ip = String(ipRaw || "").trim();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!isValidIP(ip)) {
        setError("Invalid IP address. Use IPv4 like 8.8.8.8 or IPv6 like 2001:4860:4860::8888.");
        setLoading(false);
        return;
      }

      // ensure dataset is array
      const safeDataset = Array.isArray(dataset) ? dataset : [];

      // match by CIDR (IPv4 only)
      const matches = safeDataset.filter((r) => {
        try {
          return cidrContains(r?.cidr, ip);
        } catch {
          return false;
        }
      });

      if (matches.length > 0) {
        // sort by longest prefix (safe prefixLength)
        matches.sort((a, b) => prefixLength(b?.cidr) - prefixLength(a?.cidr));
        const found = matches[0];
        setResult({ found, message: "Exact/Longest-prefix match found." });
        setHistory((h) => {
          const entry = `${new Date().toISOString()} — ${ip} → ${found?.asn ?? "N/A"} (${found?.isp ?? "N/A"})`;
          return [entry, ...h].slice(0, 30);
        });
        setLoading(false);
        return;
      }

      // no exact match -> suggestion heuristic for IPv4
      if (IPV4_RE.test(ip)) {
        const octets = ip.split(".");
        const candidates = safeDataset
          .map((r) => ({ r, len: prefixLength(r?.cidr) }))
          .sort((a, b) => b.len - a.len)
          .map((x) => x.r);

        let best: ASNRecord | null = null;
        for (const r of candidates) {
          try {
            const net = (r?.cidr || "").split("/")[0];
            if (!net) continue;
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
          } catch {
            continue;
          }
        }

        setResult({ suggestion: best ?? undefined, message: "No exact match — showing nearest suggestion." });
        setHistory((h) => [`${new Date().toISOString()} — ${ip} → no exact match`, ...h].slice(0, 30));
        setLoading(false);
        return;
      }

      // IPv6 fallback
      setResult({ message: "No offline IPv6 mapping available. Try WHOIS or online sources." });
      setHistory((h) => [`${new Date().toISOString()} — ${ip} → ipv6 (no offline match)`, ...h].slice(0, 30));
      setLoading(false);
    } catch (e) {
      // catch-all for unexpected errors
      setError("Unexpected error during lookup. Please try again.");
      setLoading(false);
      // eslint-disable-next-line no-console
      console.error("lookup error", e);
    }
  }

  // copy result text (defensive: navigator.clipboard may be unavailable)
  async function copyResult() {
    const text = formatTextResult();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setLastAction("Copied to clipboard");
      } else {
        // fallback using textarea
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setLastAction("Copied (fallback)");
      }
    } catch {
      setLastAction("Copy failed");
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  function formatTextResult(): string {
    if (!result) return "No result";
    if (result.found) {
      const f = result.found;
      return `ASN: ${f.asn ?? "N/A"}\nISP: ${f.isp ?? "N/A"}\nCIDR: ${f.cidr ?? "N/A"}\nCountry: ${f.country ?? "N/A"}\nNotes: ${f.notes ?? ""}`;
    }
    if (result.suggestion) {
      const s = result.suggestion;
      return `No exact match. Nearest suggestion:\nASN: ${s.asn ?? "N/A"}\nISP: ${s.isp ?? "N/A"}\nCIDR: ${s.cidr ?? "N/A"}`;
    }
    return result.message ?? "No result";
  }

  // export handlers
  function exportText() {
    try {
      downloadBlob("asn-result.txt", formatTextResult(), "text/plain;charset=utf-8");
      setLastAction("Exported .txt");
    } catch {
      setLastAction("Export failed");
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }
  function exportJSON() {
    try {
      const payload = result?.found ?? result?.suggestion ?? { message: result?.message ?? "no result" };
      downloadBlob("asn-result.json", JSON.stringify(payload ?? {}, null, 2), "application/json");
      setLastAction("Exported .json");
    } catch {
      setLastAction("Export failed");
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }
  function exportMarkdown() {
    try {
      const md = `# ASN Lookup Result\n\n${formatTextResult().replace(/\n/g, "\n\n")}\n`;
      downloadBlob("asn-result.md", md, "text/markdown");
      setLastAction("Exported .md");
    } catch {
      setLastAction("Export failed");
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  function exportPrintPDF() {
    try {
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
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // ignore
        }
      }, 300);
      setLastAction("Opened print dialog");
    } catch {
      setLastAction("Print failed");
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  // share (with fallback)
  async function shareResult() {
    const text = formatTextResult();
    try {
      const shared = await tryWebShare({ title: "ASN Lookup Result", text });
      if (!shared) {
        // fallback: copy
        await copyResult();
        setLastAction("Copied result to clipboard (share fallback)");
      } else {
        setLastAction("Shared via Web Share");
      }
    } catch {
      setLastAction("Share failed");
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  // CSV upload: defensive parsing
  async function handleCSVUpload(file: File | null) {
    if (!file) {
      setLastAction("No file selected");
      setTimeout(() => setLastAction(null), 1200);
      return;
    }
    try {
      const txt = await file.text();
      const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const newRows: ASNRecord[] = [];
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) continue;
        const asn = parts[0] || "AS_UNKNOWN";
        const cidr = parts[1] || "";
        const isp = parts[2] || "Unknown ISP";
        const country = parts[3] || "";
        const notes = parts[4] || "";
        // basic validation: CIDR must include "/" and have valid IPv4 network
        if (!cidr.includes("/") || !IPV4_RE.test(cidr.split("/")[0])) continue;
        newRows.push({ asn, cidr, isp, country, notes });
      }
      if (newRows.length === 0) {
        setLastAction("No valid rows found in CSV");
        setTimeout(() => setLastAction(null), 1800);
        return;
      }
      setDataset((d) => [...newRows, ...(Array.isArray(d) ? d : [])]);
      setLastAction(`Loaded ${newRows.length} rows`);
    } catch (e) {
      setLastAction("CSV parse failed");
      // eslint-disable-next-line no-console
      console.error("csv parse error", e);
    } finally {
      setTimeout(() => setLastAction(null), 1800);
    }
  }

  function clearHistory() {
    setHistory([]);
    setLastAction("History cleared");
    setTimeout(() => setLastAction(null), 1200);
  }

  // derived highlighted safe HTML
  const highlighted = useMemo(() => {
    try {
      if (!result) return `<span class="text-slate-600">No result</span>`;
      if (result.found) return highlightJSON(result.found);
      if (result.suggestion) return highlightJSON({ suggestion: result.suggestion, note: result.message ?? "" });
      return `<span class="text-slate-600">${escapeHtml(result.message ?? "No result")}</span>`;
    } catch {
      return `<span class="text-slate-600">Unable to render</span>`;
    }
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
              onChange={(e) => setIpInput(String(e.target.value || ""))}
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
                try {
                  const csv = (Array.isArray(dataset) ? dataset : []).map((r) =>
                    [r?.asn ?? "", r?.cidr ?? "", r?.isp ?? "", r?.country ?? "", r?.notes ?? ""].join(",")
                  ).join("\n");
                  downloadBlob("asn-dataset-sample.csv", csv, "text/csv");
                  setLastAction("Dataset downloaded");
                } catch {
                  setLastAction("Download failed");
                } finally {
                  setTimeout(() => setLastAction(null), 1200);
                }
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
                    try {
                      const txt = (history || []).join("\n");
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(txt);
                        setLastAction("History copied");
                      } else {
                        const ta = document.createElement("textarea");
                        ta.value = txt;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand("copy");
                        ta.remove();
                        setLastAction("History copied (fallback)");
                      }
                    } catch {
                      setLastAction("Copy failed");
                    } finally {
                      setTimeout(() => setLastAction(null), 1200);
                    }
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
              {(history || []).length === 0 ? <div className="text-slate-400">No lookups yet</div> : (history || []).map((h, i) => <div key={i} className="py-0.5">{String(h)}</div>)}
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
                    {result?.found ? (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://whois.arin.net/rest/ip/${String(result.found.cidr || "").split("/")[0]}`}
                        className="text-xs px-2 py-1 rounded border"
                      >
                        Lookup WHOIS
                      </a>
                    ) : null}
                    {result?.suggestion ? (
                      <div className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-800">
                        Suggestion: {result.suggestion.asn ?? "N/A"} — {result.suggestion.isp ?? "N/A"}
                      </div>
                    ) : null}
                    {!result?.found && !result?.suggestion && result?.message ? (
                      <div className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-800">{result.message}</div>
                    ) : null}

                    {/* allow adding custom override: quick add */}
                    <button
                      onClick={() => {
                        try {
                          if (!ipInput || !isValidIP(ipInput)) {
                            setLastAction("Provide a valid IP to create mapping");
                            setTimeout(() => setLastAction(null), 1200);
                            return;
                          }
                          const guess: ASNRecord = { asn: "AS_CUSTOM", cidr: `${ipInput}/32`, isp: "Manual entry", country: "", notes: "Added by user" };
                          setDataset((d) => [guess, ...(Array.isArray(d) ? d : [])]);
                          setLastAction("Added manual mapping to dataset");
                        } catch {
                          setLastAction("Add mapping failed");
                        } finally {
                          setTimeout(() => setLastAction(null), 1200);
                        }
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
          <div className="text-xs text-slate-500">Rows: {(Array.isArray(dataset) ? dataset.length : 0)}</div>
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
              {(Array.isArray(dataset) ? dataset.slice(0, 12) : []).map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-3">{r?.asn ?? ""}</td>
                  <td className="py-1 pr-3">{r?.cidr ?? ""}</td>
                  <td className="py-1 pr-3">{r?.isp ?? ""}</td>
                  <td className="py-1 pr-3">{r?.country ?? ""}</td>
                  <td className="py-1 pr-3">{r?.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(Array.isArray(dataset) && dataset.length > 12) && <div className="mt-2 text-xs text-slate-500">Showing first 12 rows</div>}
        </div>
      </div>
    </div>
  );
}
