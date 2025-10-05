"use client";

import React, { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

/* --- Utilities --- */
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
function safeString(v: any) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

/* --- Input validation / SSRF-lite checks --- */
function isPrivateIPorLocal(hostname: string) {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) return true;
  const ipv4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const parts = ipv4.slice(1).map((n) => parseInt(n, 10));
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

/* --- Status badge renderer --- */
function renderStatusBadge(status: "ok" | "warn" | "inconclusive" | "fail" | undefined) {
  if (!status) return null;
  const map = {
    ok: { text: "OK", classes: "bg-emerald-600 text-white", Icon: CheckCircle },
    warn: { text: "Warning", classes: "bg-yellow-500 text-black", Icon: AlertTriangle },
    inconclusive: { text: "Inconclusive", classes: "bg-slate-600 text-white", Icon: RefreshCw },
    fail: { text: "Fail", classes: "bg-red-600 text-white", Icon: XCircle },
  } as const;
  const m = map[status];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${m.classes}`}>
      <Icon size={14} /> {m.text}
    </span>
  );
}

/* --- Main Component --- */
export default function HeadersClientOnly() {
  const [target, setTarget] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // results: rawHeaders (if readable), and test outcomes (inference)
  const [rawHeaders, setRawHeaders] = useState<Record<string, string> | null>(null);
  const [tests, setTests] = useState<{
    cors?: { status: "ok" | "warn" | "inconclusive" | "fail"; notes: string[]; details?: any };
    preflight?: { status: "ok" | "warn" | "inconclusive" | "fail"; notes: string[]; details?: any };
    credentials?: { status: "ok" | "warn" | "inconclusive" | "fail"; notes: string[]; details?: any };
    csp?: { status: "ok" | "warn" | "inconclusive" | "fail"; notes: string[]; details?: any };
    hsts?: { status: "ok" | "warn" | "inconclusive" | "fail"; notes: string[]; details?: any };
  } | null>(null);

  /* --- Client-only test runner --- */
  async function runClientTests() {
    setError(null);
    setRawHeaders(null);
    setTests(null);
    setLoading(true);

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(target.trim());
    } catch {
      setError("Please enter a valid absolute URL (include https://).");
      setLoading(false);
      return;
    }
    if (!/^https:/i.test(parsed.protocol)) {
      setError("Only HTTPS URLs are allowed for secure analysis in this client-only tool.");
      setLoading(false);
      return;
    }
    if (isPrivateIPorLocal(parsed.hostname)) {
      setError("Blocked target: localhost / .local or private IP ranges are not allowed.");
      setLoading(false);
      return;
    }

    const baseUrl = parsed.href.replace(/\/$/, "");
    const results: any = {};

    /* 1) Basic GET (cors) - try to read headers */
    try {
      // Attempt a simple fetch with CORS mode; if server allows CORS and exposes headers we'll get them.
      const res = await fetch(baseUrl, { method: "GET", mode: "cors", cache: "no-store" });
      // If fetch succeeds but headers are opaque, reading certain headers may still be blocked by CORS.
      const readableHeaders: Record<string, string> = {};
      try {
        // iterate response.headers (may be empty or limited)
        res.headers.forEach((v, k) => {
          readableHeaders[k.toLowerCase()] = v;
        });
      } catch (e) {
        // some browsers won't throw, but headers may be empty
      }
      results.get = {
        succeeded: true,
        status: res.status,
        statusText: res.statusText,
        readableHeaders,
      };
      if (Object.keys(readableHeaders).length) {
        setRawHeaders(readableHeaders);
      }
    } catch (err: any) {
      // fetch failed — usually indicates CORS blocking (TypeError) or network problem
      results.get = { succeeded: false, error: safeString(err?.message ?? err) };
    }

    /* 2) GET with credentials (include) - detect ACAO vs credentials behavior */
    try {
      const resCred = await fetch(baseUrl, {
        method: "GET",
        mode: "cors",
        credentials: "include",
        cache: "no-store",
      });
      const credHeaders: Record<string, string> = {};
      try {
        resCred.headers.forEach((v, k) => {
          credHeaders[k.toLowerCase()] = v;
        });
      } catch {}
      results.getWithCreds = {
        succeeded: true,
        status: resCred.status,
        statusText: resCred.statusText,
        readableHeaders: credHeaders,
      };
    } catch (err: any) {
      results.getWithCreds = { succeeded: false, error: safeString(err?.message ?? err) };
    }

    /* 3) Force a preflight by sending a custom header on a GET (will provably trigger preflight) */
    try {
      const resPre = await fetch(baseUrl, {
        method: "GET",
        mode: "cors",
        headers: { "x-client-test": "1" }, // custom header => browser will preflight
        cache: "no-store",
      });
      const ph: Record<string, string> = {};
      try {
        resPre.headers.forEach((v, k) => (ph[k.toLowerCase()] = v));
      } catch {}
      results.preflightAttempt = { succeeded: true, status: resPre.status, readableHeaders: ph };
    } catch (err: any) {
      // If preflight blocked by server, fetch throws - TypeError
      results.preflightAttempt = { succeeded: false, error: safeString(err?.message ?? err) };
    }

    /* 4) CSP inference: attempt to load the target as <script> via dynamic tag and detect blocking.
       NOTE: This is heuristic — target's CSP affects its own page, not our page; but some responses may set CSP on resource responses or block cross-origin script loads.
    */
    async function testCSPbyScriptLoad(url: string) {
      return new Promise<{ loaded: boolean; error?: string }>((resolve) => {
        const script = document.createElement("script");
        // Point to an innocuous resource — try /favicon.ico first as cross-origin script usually fails
        script.src = url; // load the page (may return HTML) — script tag will try to execute; more likely will error
        script.async = true;
        let done = false;
        const clear = () => {
          if (!done) {
            done = true;
            script.remove();
            resolve({ loaded: false });
          }
        };
        script.onload = () => {
          if (!done) {
            done = true;
            script.remove();
            resolve({ loaded: true });
          }
        };
        script.onerror = () => {
          if (!done) {
            done = true;
            script.remove();
            resolve({ loaded: false, error: "error" });
          }
        };
        // set a timeout in 3s
        setTimeout(() => {
          if (!done) {
            done = true;
            script.remove();
            resolve({ loaded: false, error: "timeout" });
          }
        }, 3000);
        // append to body
        document.body.appendChild(script);
      });
    }

    let cspResult: any = { notes: [] };
    try {
      // We'll try to load a small cross-origin resource that should succeed if remote server allows script loads.
      // This is a weak heuristic — many servers will fail because resource isn't JS; we only use it to detect blocking.
      const tryUrl = baseUrl; // using page root
      const r = await testCSPbyScriptLoad(tryUrl);
      if (r.loaded) {
        cspResult.status = "ok";
        cspResult.notes.push("Loaded via script tag — target doesn't block cross-origin script inclusion via response behavior (heuristic).");
      } else {
        cspResult.status = "inconclusive";
        cspResult.notes.push("Script tag load failed or timed out — could be normal (not JS) or blocked by CSP. Result inconclusive.");
      }
    } catch (e) {
      cspResult.status = "inconclusive";
      cspResult.notes.push("CSP heuristic failed to produce a conclusive result.");
    }
    results.cspHeuristic = cspResult;

    /* 5) HSTS inference:
        - If current page is HTTPS, attempting to fetch http://target will be blocked as mixed-content by modern browsers.
        - If this client is loaded over HTTP (rare), we can attempt an HTTP fetch and observe redirect to HTTPS (HSTS) or not.
       So we provide a heuristic and clear explanation.
    */
    let hstsResult: any = { notes: [] };
    try {
      if (location.protocol === "https:") {
        hstsResult.status = "inconclusive";
        hstsResult.notes.push("Cannot test HSTS from an HTTPS page due to mixed-content rules in browsers. Use an external tool or a server-side check for definitive HSTS detection.");
      } else {
        // If page served over HTTP (rare), attempt HTTP fetch and see if browser upgrades or server redirects
        const httpUrl = baseUrl.replace(/^https:/i, "http:");
        try {
          const r = await fetch(httpUrl, { method: "GET", mode: "no-cors", cache: "no-store" });
          // mode no-cors returns opaque response; cannot inspect, but a failure might indicate upgrade behavior.
          hstsResult.status = "inconclusive";
          hstsResult.notes.push("Performed HTTP fetch in no-cors mode; result opaque. This is still heuristic — for reliable HSTS detection use server-side checks or curl.");
        } catch (e) {
          hstsResult.status = "inconclusive";
          hstsResult.notes.push("HTTP fetch failed — could be blocked by the browser or network. HSTS detection inconclusive in client-only context.");
        }
      }
    } catch (e) {
      hstsResult.status = "inconclusive";
      hstsResult.notes.push("HSTS heuristic error.");
    }
    results.hstsHeuristic = hstsResult;

    /* --- Aggregate analysis / produce friendly summary --- */
    const corsSummary = { status: "inconclusive", notes: [] as string[], details: {} as any } as any;
    // If readable headers exist and include access-control-allow-origin, we can be confident about some things
    const rh = results.get?.readableHeaders ?? results.getWithCreds?.readableHeaders ?? results.preflightAttempt?.readableHeaders;
    if (rh && Object.keys(rh).length) {
      const acao = rh["access-control-allow-origin"];
      const acac = rh["access-control-allow-credentials"];
      corsSummary.details = rh;
      if (!acao) {
        corsSummary.status = "warn";
        corsSummary.notes.push("No Access-Control-Allow-Origin header visible — cross-origin reads likely disallowed (or header not exposed).");
      } else {
        if (acao.trim() === "*") {
          if (acac && acac.toLowerCase() === "true") {
            corsSummary.status = "fail";
            corsSummary.notes.push("Access-Control-Allow-Origin = '*' and Access-Control-Allow-Credentials = true — browser will reject credentials.");
          } else {
            corsSummary.status = "warn";
            corsSummary.notes.push("Access-Control-Allow-Origin = '*' — allows any origin (read-only if credentials not allowed).");
          }
        } else {
          corsSummary.status = "ok";
          corsSummary.notes.push(`Access-Control-Allow-Origin = ${acao} — read access allowed for that origin.`);
          if (!/vary/i.test(rh["vary"] ?? "")) {
            corsSummary.notes.push("Consider 'Vary: Origin' if your server echoes the Origin dynamically.");
          }
        }
      }
    } else {
      // No readable headers - infer from fetch success/failure
      if (results.get && results.get.succeeded) {
        corsSummary.status = "ok";
        corsSummary.notes.push("Fetch succeeded but headers were not exposed to JS (common if server didn't set Access-Control-Expose-Headers).");
      } else if (results.get && !results.get.succeeded) {
        corsSummary.status = "inconclusive";
        corsSummary.notes.push("Fetch failed from browser — likely due to CORS blocking. Headers not readable from client-only context.");
      } else {
        corsSummary.status = "inconclusive";
        corsSummary.notes.push("No conclusive evidence for CORS. Try running from a server-side tool for definitive header inspection.");
      }
    }

    const preflightSummary = { status: "inconclusive", notes: [], details: results.preflightAttempt } as any;
    if (results.preflightAttempt && results.preflightAttempt.succeeded) {
      preflightSummary.status = "ok";
      preflightSummary.notes.push("Preflight attempt succeeded (server accepted preflight or did not block it).");
    } else if (results.preflightAttempt && !results.preflightAttempt.succeeded) {
      preflightSummary.status = "warn";
      preflightSummary.notes.push("Preflight attempt failed in browser — likely blocked by server or not allowed for cross-origin requests.");
    }

    const credentialsSummary = { status: "inconclusive", notes: [], details: results.getWithCreds } as any;
    if (results.getWithCreds && results.getWithCreds.succeeded) {
      // if request with credentials succeeded and headers readable
      const ch = results.getWithCreds.readableHeaders ?? {};
      const acac = ch["access-control-allow-credentials"];
      const acao = ch["access-control-allow-origin"];
      if (acac && acac.toLowerCase() === "true") {
        credentialsSummary.status = "ok";
        credentialsSummary.notes.push("Server sets Access-Control-Allow-Credentials: true — credentials allowed for permitted origins.");
        if (acao === "*") {
          credentialsSummary.status = "fail";
          credentialsSummary.notes.push("But Access-Control-Allow-Origin is '*' — browsers will reject credentials; misconfiguration.");
        }
      } else {
        credentialsSummary.status = "warn";
        credentialsSummary.notes.push("Credentials fetch succeeded but server did not explicitly expose Access-Control-Allow-Credentials: true — behavior may vary by browser.");
      }
    } else if (results.getWithCreds && !results.getWithCreds.succeeded) {
      credentialsSummary.status = "inconclusive";
      credentialsSummary.notes.push("Credentials fetch blocked or failed — likely CORS credential restrictions.");
    }

    // CSP and HSTS already added as heuristics
    const cspSummary = {
      status: results.cspHeuristic.status ?? "inconclusive",
      notes: results.cspHeuristic.notes ?? [],
      details: results.cspHeuristic,
    };

    const hstsSummaryFinal = {
      status: results.hstsHeuristic.status ?? "inconclusive",
      notes: results.hstsHeuristic.notes ?? [],
      details: results.hstsHeuristic,
    };

    setTests({ cors: corsSummary, preflight: preflightSummary, credentials: credentialsSummary, csp: cspSummary, hsts: hstsSummaryFinal });
    setLoading(false);
  }

  function exportJSON() {
    const payload = { url: target, headers: rawHeaders, tests, generatedAt: new Date().toISOString() };
    downloadBlob(JSON.stringify(payload, null, 2), "client-header-audit.json", "application/json");
  }

  return (
    <div className="space-y-8">
      <Section title="Client-only HTTP Analyzer" subtitle="Browser-only inference for CORS, CSP, and HSTS (no backend)">
        <p className="text-sm text-muted-foreground mb-3">
          Enter a website URL below to fetch its HTTP response headers. This helps security testers and developers verify configurations like CORS, CSP, and HSTS.
          This tool runs in your browser only. Because of browser security (CORS, mixed-content), results may be **inconclusive** for some targets — the UI will explain when that happens.
        </p>

        <div className="flex gap-2">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex-1 bg-white border border-slate-300 rounded p-2 text-sm"
            placeholder="https://example.com"
            aria-label="Target URL"
          />
          <button
            onClick={runClientTests}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing…" : "Run Client Tests"}
          </button>
        </div>

        {error && <div className="text-red-500 text-sm mt-2">⚠ {error}</div>}

        {tests && (
          <>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copyText(JSON.stringify({ url: target, tests }, null, 2))} className="flex items-center gap-1 px-3 py-1 border rounded text-sm"><Copy size={14} /> Copy JSON</button>
              <button onClick={exportJSON} className="flex items-center gap-1 px-3 py-1 border rounded text-sm"><Download size={14} /> Export JSON</button>
              <button onClick={() => { setRawHeaders(null); setTests(null); setTarget("https://example.com"); }} className="flex items-center gap-1 px-3 py-1 border rounded text-sm"><Trash2 size={14} /> Clear</button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 rounded border bg-slate-900 text-slate-50">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold">CORS</h3>
                    {renderStatusBadge(tests.cors?.status)}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    {(tests.cors?.notes || []).map((n: string, i: number) => <div key={i} className="mb-1">- {n}</div>)}
                  </div>
                  <details className="mt-2 text-xs text-slate-400">
                    <summary>Details</summary>
                    <pre className="mt-2 text-xs bg-slate-800 rounded p-2 overflow-auto">{JSON.stringify(tests.cors?.details ?? {}, null, 2)}</pre>
                  </details>
                </div>

                <div className="p-3 rounded border bg-slate-900 text-slate-50">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold">Preflight (heuristic)</h3>
                    {renderStatusBadge(tests.preflight?.status)}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    {(tests.preflight?.notes || []).map((n: string, i: number) => <div key={i} className="mb-1">- {n}</div>)}
                  </div>
                  <details className="mt-2 text-xs text-slate-400">
                    <summary>Attempt result</summary>
                    <pre className="mt-2 text-xs bg-slate-800 rounded p-2 overflow-auto">{JSON.stringify(tests.preflight?.details ?? {}, null, 2)}</pre>
                  </details>
                </div>

                <div className="p-3 rounded border bg-slate-900 text-slate-50">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold">Credentials (heuristic)</h3>
                    {renderStatusBadge(tests.credentials?.status)}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    {(tests.credentials?.notes || []).map((n: string, i: number) => <div key={i} className="mb-1">- {n}</div>)}
                  </div>
                  <details className="mt-2 text-xs text-slate-400">
                    <summary>Attempt result</summary>
                    <pre className="mt-2 text-xs bg-slate-800 rounded p-2 overflow-auto">{JSON.stringify(tests.credentials?.details ?? {}, null, 2)}</pre>
                  </details>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded border bg-slate-900 text-slate-50">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold">CSP (heuristic)</h3>
                    {renderStatusBadge(tests.csp?.status)}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    {(tests.csp?.notes || []).map((n: string, i: number) => <div key={i} className="mb-1">- {n}</div>)}
                    <div className="mt-2 text-xs text-slate-400">Note: client-only CSP checks are heuristic and may be inconclusive. For full CSP header inspection use a server-side fetch (or curl).</div>
                  </div>
                  <details className="mt-2 text-xs text-slate-400">
                    <summary>Heuristic details</summary>
                    <pre className="mt-2 text-xs bg-slate-800 rounded p-2 overflow-auto">{JSON.stringify(tests.csp?.details ?? {}, null, 2)}</pre>
                  </details>
                </div>

                <div className="p-3 rounded border bg-slate-900 text-slate-50">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold">HSTS (heuristic)</h3>
                    {renderStatusBadge(tests.hsts?.status)}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    {(tests.hsts?.notes || []).map((n: string, i: number) => <div key={i} className="mb-1">- {n}</div>)}
                    <div className="mt-2 text-xs text-slate-400">Note: HSTS cannot be reliably detected from an HTTPS client page due to browser mixed-content protections.</div>
                  </div>
                  <details className="mt-2 text-xs text-slate-400">
                    <summary>Heuristic details</summary>
                    <pre className="mt-2 text-xs bg-slate-800 rounded p-2 overflow-auto">{JSON.stringify(tests.hsts?.details ?? {}, null, 2)}</pre>
                  </details>
                </div>
              </div>

              {/* Raw headers if available */}
              {rawHeaders && (
                <div className="rounded border bg-slate-900 text-slate-50 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="text-left px-3 py-2">Header</th>
                        <th className="text-left px-3 py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(rawHeaders).map(([key, val]) => (
                        <tr key={key} className="border-t border-slate-700">
                          <td className="px-3 py-1 text-slate-200 font-medium">{key}</td>
                          <td className="px-3 py-1 text-slate-300 break-all">{safeString(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </>
        )}
      </Section>
    </div>
  );
}
