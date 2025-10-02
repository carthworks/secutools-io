"use client";

import React, { useMemo, useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, Trash2, Link as LinkIcon } from "lucide-react";

/**
 * Security Headers Checker - client-only component
 *
 * Notes:
 * - This component attempts to fetch headers from a server-side proxy at /api/headers
 *   to avoid CORS problems. If you don't have that endpoint, the "Paste Raw Headers"
 *   tab lets users paste headers manually.
 *
 * - The analysis function focuses on common security headers and provides
 *   concise suggestions and a grade.
 */

type HeadersMap = Record<string, string | string[]>;

function normalizeHeaders(obj: any): HeadersMap {
  // Accept various shapes: array of [k,v], plain object, Fetch Headers
  const out: HeadersMap = {};
  if (!obj) return out;
  if (typeof obj.forEach === "function") {
    // Headers object
    (obj as Headers).forEach((v, k) => (out[k] = v));
    return out;
  }
  if (Array.isArray(obj)) {
    for (const [k, v] of obj) out[String(k).toLowerCase()] = String(v);
    return out;
  }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      const lk = k.toLowerCase();
      out[lk] = obj[k];
    }
    return out;
  }
  return out;
}

/* Basic scoring logic:
   For a simple "grade" we give + points for presence of strong headers and - points for risky headers.
*/
function analyzeHeaders(headers: HeadersMap) {
  const suggestions: string[] = [];
  let score = 50; // base 50/100

  const get = (name: string) => {
    const v = headers[name.toLowerCase()];
    if (!v) return null;
    return Array.isArray(v) ? v.join(", ") : String(v);
  };

  // Strict-Transport-Security (HSTS)
  const hsts = get("strict-transport-security");
  if (hsts) {
    // check max-age and includeSubDomains
    const m = /max-age=(\d+)/i.exec(hsts);
    if (!m) {
      suggestions.push("HSTS present but missing max-age. Use at least 6 months (e.g., max-age=15768000).");
      score += 5;
    } else {
      const maxAge = Number(m[1]);
      if (maxAge >= 31536000) score += 12; // 1 year +
      else if (maxAge >= 15768000) score += 8; // 6 months
      else score += 4;
    }
    if (/includesubdomains/i.test(hsts)) score += 5;
    if (/preload/i.test(hsts)) score += 3;
  } else {
    suggestions.push("Add Strict-Transport-Security (HSTS) to improve HTTPS enforcement.");
    score -= 12;
  }

  // Content-Security-Policy
  const csp = get("content-security-policy");
  if (csp) {
    // quick checks: presence of 'unsafe-inline' or '*'
    if (/unsafe-inline|unsafe-eval/i.test(csp)) {
      suggestions.push("CSP contains 'unsafe-inline' or 'unsafe-eval' — consider removing inline script allowances.");
      score -= 8;
    } else {
      score += 12;
    }
    if (/script-src/i.test(csp) || /default-src/i.test(csp)) {
      score += 4;
    }
  } else {
    suggestions.push("Add Content-Security-Policy (CSP) to reduce XSS attack surface.");
    score -= 14;
  }

  // X-Frame-Options or frame-ancestors in CSP
  const xfo = get("x-frame-options");
  if (xfo) {
    if (/deny/i.test(xfo) || /sameorigin/i.test(xfo)) score += 8;
    else suggestions.push("X-Frame-Options present but value is weak. Prefer DENY or SAMEORIGIN.");
  } else {
    // check frame-ancestors in CSP
    if (csp && /frame-ancestors\s+'?none'?/i.test(csp)) score += 8;
    else {
      suggestions.push("Add X-Frame-Options or frame-ancestors in CSP to prevent clickjacking.");
      score -= 6;
    }
  }

  // X-Content-Type-Options
  const xcto = get("x-content-type-options");
  if (xcto && /nosniff/i.test(xcto)) score += 8;
  else {
    suggestions.push("Add X-Content-Type-Options: nosniff to reduce MIME type confusion.");
    score -= 6;
  }

  // Referrer-Policy
  const refpol = get("referrer-policy");
  if (refpol) {
    if (/no-referrer|strict-origin-when-cross-origin|same-origin/i.test(refpol)) score += 6;
    else suggestions.push("Consider a stricter Referrer-Policy (e.g., no-referrer or strict-origin-when-cross-origin).");
  } else {
    suggestions.push("Add a Referrer-Policy to limit sensitive URL leakage.");
    score -= 4;
  }

  // Feature-Policy / Permissions-Policy
  const perm = get("permissions-policy") || get("feature-policy");
  if (perm) score += 4;
  else suggestions.push("Consider adding Permissions-Policy to restrict powerful browser features.");

  // Access-Control-Allow-Origin (CORS)
  const acao = get("access-control-allow-origin");
  if (acao) {
    if (acao.trim() === "*") {
      suggestions.push("Access-Control-Allow-Origin is '*': consider restricting to trusted origins.");
      score -= 6;
    } else score += 4;
  }

  // X-XSS-Protection (legacy)
  const xxss = get("x-xss-protection");
  if (xxss) {
    // modern browsers ignore; still warn
    suggestions.push("X-XSS-Protection is legacy; prefer a strong Content-Security-Policy.");
  }

  // Server header exposure
  const server = get("server");
  if (server) {
    suggestions.push("Server header reveals server software — consider minimizing disclosure.");
    score -= 2;
  }

  // Normalize score bounds
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // severity
  let grade = "B";
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B+";
  else if (score >= 60) grade = "B";
  else if (score >= 50) grade = "C";
  else if (score >= 30) grade = "D";
  else grade = "F";

  return { score, grade, suggestions };
}

/* Helpers: copy + download */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
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

/* Minimal pretty header renderer (no dependencies) */
function HeaderRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex gap-3 items-start py-2 border-b border-slate-100">
      <div className="w-44 text-xs text-slate-600 font-mono">{name}</div>
      <div className="flex-1 text-sm break-words">
        <code className="text-sm whitespace-pre-wrap">{value}</code>
      </div>
      <div className="ml-4">
        <button
          aria-label={`Copy ${name}`}
          onClick={async () => {
            await copyText(`${name}: ${value}`);
            // small visual feedback via alert is simple and reliable across browsers
            // Could be replaced with a toast in a production app
            alert("Copied header to clipboard");
          }}
          className="p-1 rounded border text-xs"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SecurityHeadersChecker() {
  const [url, setUrl] = useState<string>("https://example.com");
  const [rawHeaders, setRawHeaders] = useState<string>("");
  const [headers, setHeaders] = useState<HeadersMap | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"fetch" | "paste">("fetch");
  const [error, setError] = useState<string | null>(null);

  async function fetchHeaders() {
    setError(null);
    setLoading(true);
    setHeaders(null);
    setAnalysis(null);

    if (!/^https?:\/\//i.test(url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      setLoading(false);
      return;
    }

    try {
      // Try server-side proxy first
      const res = await fetch("/api/headers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        // if proxy unavailable, show clear message
        const txt = await res.text().catch(() => "");
        throw new Error(`Proxy error: ${res.status} ${txt}`);
      }
      const json = await res.json();
      const norm = normalizeHeaders(json.headers ?? json);
      setHeaders(norm);
      const an = analyzeHeaders(norm);
      setAnalysis(an);
      setTab("fetch");
    } catch (err: any) {
      // fall back to instructing user: CORS prevents direct client fetch in many cases
      setError(
        `Failed to fetch via /api/headers: ${String(err.message || err)}. ` +
          `If you don't have a proxy, switch to "Paste" tab and paste Response headers.`
      );
    } finally {
      setLoading(false);
    }
  }

  function onPasteParse() {
    setError(null);
    const txt = rawHeaders.trim();
    if (!txt) {
      setError("Paste or type raw response headers first.");
      return;
    }
    // parse lines like "Header-Name: value"
    const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const map: HeadersMap = {};
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx === -1) {
        // tolerate lines without colon
        continue;
      }
      const name = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      if (!map[name]) map[name] = value;
      else {
        const cur = map[name];
        if (Array.isArray(cur)) cur.push(value);
        else map[name] = [cur, value];
      }
    }
    setHeaders(map);
    setAnalysis(analyzeHeaders(map));
    setTab("paste");
  }

  const headerList = useMemo(() => {
    if (!headers) return [];
    return Object.entries(headers).map(([k, v]) => ({ name: k, value: Array.isArray(v) ? v.join(", ") : String(v) }));
  }, [headers]);

  function exportAll(type: "json" | "txt" | "md") {
    if (!headers) return;
    const filenameBase = "security-headers";
    if (type === "json") {
      downloadBlob(JSON.stringify({ url, headers, analysis }, null, 2), `${filenameBase}.json`, "application/json");
    } else if (type === "txt") {
      const txt =
        `URL: ${url}\n\n` +
        Object.entries(headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n") +
        `\n\nAnalysis Score: ${analysis?.score ?? "N/A"} - Grade: ${analysis?.grade ?? "N/A"}\n` +
        (analysis?.suggestions && analysis.suggestions.length ? `Suggestions:\n- ${analysis.suggestions.join("\n- ")}` : "");
      downloadBlob(txt, `${filenameBase}.txt`, "text/plain");
    } else {
      // markdown
      const md =
        `# Security Headers — ${url}\n\n` +
        Object.entries(headers)
          .map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n") +
        `\n\n**Score:** ${analysis?.score ?? "N/A"}  \n**Grade:** ${analysis?.grade ?? "N/A"}\n\n` +
        (analysis?.suggestions && analysis.suggestions.length ? `### Suggestions\n- ${analysis.suggestions.join("\n- ")}` : "");
      downloadBlob(md, `${filenameBase}.md`, "text/markdown");
    }
  }

  async function doShare() {
    if (!headers) return;
    const txt = `Security Headers for ${url}\nScore: ${analysis?.score ?? "N/A"} Grade: ${analysis?.grade ?? "N/A"}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: `Security Headers — ${url}`, text: txt });
      } catch {
        alert("Share cancelled.");
      }
    } else {
      await copyText(txt);
      alert("Share not supported — summary copied to clipboard.");
    }
  }

  return (
    <div className="space-y-8">
      <Section title="Security Headers Checker" subtitle="Inspect response headers and get security suggestions">
        <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
          Enter a site URL and press <strong>Fetch</strong> (server proxy required at <code>/api/headers</code>),
          or switch to <strong>Paste</strong> to paste raw response headers. The tool analyzes common security headers
          (CSP, HSTS, X-Frame-Options, etc.) and provides suggestions and a simple grade.
        </p>

        {/* input row + tabs */}
        <div className="bg-slate-50 border rounded p-3">
          <div className="flex gap-2 items-center">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="https://example.com"
                  aria-label="Target URL"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchHeaders}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Fetching…" : "Fetch"}
                </button>
                <button
                  onClick={() => {
                    setUrl("https://example.com");
                    setHeaders(null);
                    setAnalysis(null);
                    setRawHeaders("");
                    setError(null);
                  }}
                  className="px-3 py-2 border rounded flex items-center gap-2"
                  aria-label="Clear all"
                  title="Reset"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2 items-center">
            <button
              onClick={() => setTab("fetch")}
              className={`px-3 py-1 rounded ${tab === "fetch" ? "bg-slate-200" : "hover:bg-slate-100"}`}
            >
              Fetch
            </button>
            <button
              onClick={() => setTab("paste")}
              className={`px-3 py-1 rounded ${tab === "paste" ? "bg-slate-200" : "hover:bg-slate-100"}`}
            >
              Paste
            </button>
            <div className="ml-auto text-xs text-slate-500">Proxy path: <code className="bg-white px-1 rounded">/api/headers</code></div>
          </div>

          {/* Paste tab */}
          {tab === "paste" && (
            <div className="mt-3">
              <label className="text-xs text-slate-600">Paste raw response headers (one per line)</label>
              <textarea
                value={rawHeaders}
                onChange={(e) => setRawHeaders(e.target.value)}
                className="w-full mt-1 border rounded p-2 min-h-[120px] font-mono text-sm"
                placeholder={`Content-Security-Policy: default-src 'self';\nStrict-Transport-Security: max-age=31536000; includeSubDomains\nX-Frame-Options: DENY`}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={onPasteParse} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Parse</button>
                <button onClick={() => { setRawHeaders(""); setHeaders(null); setAnalysis(null); }} className="px-3 py-2 border rounded">Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* error */}
        {error && <div className="text-sm text-amber-500 mt-2">⚠ {error}</div>}

        {/* analysis summary */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded border bg-white">
              <div className="text-xs text-slate-500">Score</div>
              <div className="text-xl font-semibold">{analysis.score}</div>
            </div>
            <div className="p-3 rounded border bg-white">
              <div className="text-xs text-slate-500">Grade</div>
              <div className="text-xl font-semibold">{analysis.grade}</div>
            </div>
            <div className="p-3 rounded border bg-white md:col-span-2">
              <div className="text-xs text-slate-500">Top suggestions</div>
              <ul className="list-disc pl-4 mt-2 text-sm">
                {analysis.suggestions && analysis.suggestions.length ? (
                  analysis.suggestions.slice(0, 5).map((s: string, i: number) => <li key={i}>{s}</li>)
                ) : (
                  <li className="text-slate-400">No suggestions — basic protections present</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* actions */}
        <div className="mt-4 flex gap-2 items-center">
          <button
            onClick={async () => {
              if (!headers) return;
              const ok = await copyText(JSON.stringify({ url, headers, analysis }, null, 2));
              alert(ok ? "Copied JSON to clipboard" : "Copy failed");
            }}
            className="flex items-center gap-2 px-3 py-2 border rounded"
          >
            <Copy size={14} /> Copy JSON
          </button>

          <button onClick={() => exportAll("txt")} className="flex items-center gap-2 px-3 py-2 border rounded">
            <Download size={14} /> Export TXT
          </button>
          <button onClick={() => exportAll("md")} className="flex items-center gap-2 px-3 py-2 border rounded">
            <Download size={14} /> Export MD
          </button>
          <button onClick={doShare} className="flex items-center gap-2 px-3 py-2 border rounded ml-auto">
            <Share2 size={14} /> Share
          </button>
        </div>

        {/* headers listing */}
        <div className="mt-4 rounded border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center gap-4">
            <div className="text-sm font-medium">Headers</div>
            <div className="text-xs text-slate-400">({headerList.length})</div>
            <div className="ml-auto text-xs text-slate-400">Preview</div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {headerList.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No headers to show. Fetch or paste headers first.</div>
            ) : (
              headerList.map((h) => <div key={h.name} className="px-4 py-3"><HeaderRow name={h.name} value={h.value} /></div>)
            )}
          </div>
        </div>

        {/* raw JSON */}
        {headers && (
          <div className="mt-4">
            <div className="text-sm text-slate-500 mb-2">Raw JSON</div>
            <pre className="bg-slate-900 text-white p-3 rounded text-xs overflow-auto whitespace-pre-wrap">
              {JSON.stringify({ url, headers, analysis }, null, 2)}
            </pre>
          </div>
        )}
      </Section>
    </div>
  );
}
