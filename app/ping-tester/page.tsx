import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PingTester (TypeScript + React + Framer Motion + Tailwind)
 *
 * Goal: "Copilot-compliant" refactor of the previous Ping Tester component.
 * Rationale for Copilot compliance:
 * - Strong TypeScript types and small, well-named helper functions help Copilot suggest correct completions.
 * - Clear JSDoc comments for all top-level functions and complex logic lines up with Copilot's token patterns.
 * - Modular, pure helper functions (easy to test and autocomplete).
 * - Accessible HTML (labels, aria-*), predictable props/state shape.
 * - Small surface API that Copilot can extend (hooks, utils) when asked.
 *
 * Usage:
 * - Drop this file into a Next.js project (app or pages) with Tailwind + framer-motion installed.
 * - This file intentionally avoids heavy 3rd-party libraries so Copilot can suggest integrations easily.
 */

type Protocol = "http" | "icmp";

type Result =
  | { ok: true; rtt: number; attempt: number; timestamp: string; simulated?: boolean }
  | { ok: false; error: string; attempt: number; timestamp: string };

/**
 * Lightweight, deterministic helper: format results into plain text or markdown.
 * Copilot-friendly: simple params and pure return value.
 */
function formatResults(target: string, protocol: Protocol, results: Result[], md = false): string {
  const header = md
    ? `# Ping Tester results for ${target} (${protocol.toUpperCase()})

`
    : `Ping Tester results for ${target} (${protocol.toUpperCase()})
`;

  const lines = results.map((r) => {
    if (r.ok) return `Attempt ${r.attempt}: ${r.rtt} ms${r.simulated ? " (simulated)" : ""}`;
    return `Attempt ${r.attempt}: ERROR (${r.error})`;
  });
  return header + lines.join("");
}

/**
 * Very small, testable abstraction for measuring HTTP RTT with fetch and AbortController.
 * Returns either {ok:true, rtt} or {ok:false, error}.
 */
async function measureHttpOnce(url: string, timeoutMs: number): Promise<{ ok: true; rtt: number } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    // Use `no-store` to minimize caching effects. Mode 'cors' can fail for cross-origin sites.
    await fetch(url, { method: "GET", cache: "no-store", signal: controller.signal });
    const rtt = Math.round(performance.now() - start);
    clearTimeout(timer);
    return { ok: true, rtt };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") return { ok: false, error: "timeout" };
    return { ok: false, error: err?.message ?? "network error" };
  }
}

/**
 * Simulated ICMP probe (browser can't do raw ICMP) — deterministic-ish for UI demos.
 */
async function simulateIcmpOnce(): Promise<{ ok: true; rtt: number; simulated: true }> {
  // Use a small predictable random seed (not cryptographic)
  const base = 30 + Math.floor(Math.random() * 120);
  await new Promise((res) => setTimeout(res, Math.min(base, 300)));
  return { ok: true, rtt: base, simulated: true };
}

export default function PingTester(): JSX.Element {
  const [target, setTarget] = useState<string>("");
  const [protocol, setProtocol] = useState<Protocol>("http");
  const [count, setCount] = useState<number>(4);
  const [timeoutMs, setTimeoutMs] = useState<number>(5000);
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // --- Validation ---
  const validateTarget = useCallback((val: string): { ok: true } | { ok: false; msg: string } => {
    if (!val || val.trim() === "") return { ok: false, msg: "Please enter a host or URL." };
    if (protocol === "http") {
      try {
        // ensure it parses as URL; allow missing protocol by prefilling later
        new URL(val);
      } catch (e) {
        // allow hostnames without protocol (we will prefix later) but warn user
        if (!/^[a-z0-9.-]+$/i.test(val)) return { ok: false, msg: "Invalid URL. Use https://example.com or a hostname." };
      }
    } else {
      // ICMP: allow hostnames / ip
      if (!/^[a-z0-9.-]+$/i.test(val)) return { ok: false, msg: "ICMP targets should be hostname or IP (no protocol)." };
    }
    return { ok: true };
  }, [protocol]);

  // Derived metrics
  const successful = useMemo(() => results.filter((r): r is Extract<Result, { ok: true }> => r.ok), [results]);
  const avg = useMemo(() => (successful.length ? Math.round(successful.reduce((s, r) => s + r.rtt, 0) / successful.length) : null), [successful]);
  const min = useMemo(() => (successful.length ? Math.min(...successful.map((r) => r.rtt)) : null), [successful]);
  const max = useMemo(() => (successful.length ? Math.max(...successful.map((r) => r.rtt)) : null), [successful]);

  // --- Actions ---
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatResults(target || "(no target)", protocol, results));
      // UI-level feedback could be added (toast). Keep function pure.
    } catch (e: any) {
      setError(e?.message ?? "copy failed");
    }
  }, [results, target, protocol]);

  const download = useCallback((ext: "txt" | "md") => {
    const content = formatResults(target || "(no target)", protocol, results, ext === "md");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ping-results-${(target || "unnamed").replace(/[^a-z0-9.-]/gi, "_")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [results, target, protocol]);

  const exportPDF = useCallback(() => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return setError("Unable to open print window");
    const html = `
      <html>
        <head>
          <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
          <title>Ping Results - ${escapeHtml(target || "(no target)")}</title>
          <style>body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; padding:20px; color:#111} pre{background:#f7fafc;padding:12px;border-radius:8px}</style>
        </head>
        <body>
          <h1>Ping Tester — Results for ${escapeHtml(target || "(no target)")}</h1>
          <pre>${escapeHtml(formatResults(target || "(no target)", protocol, results))}</pre>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [results, target, protocol]);

  const share = useCallback(async () => {
    if (!navigator.share) return setError("Web Share API not supported on this device/browser.");
    try {
      await navigator.share({ title: `Ping results — ${target}`, text: formatResults(target || "(no target)", protocol, results) });
    } catch (e: any) {
      setError(e?.message ?? "share failed");
    }
  }, [results, target, protocol]);

  // Main runner is intentionally sequential to keep resource usage low and make results predictable.
  const runTest = useCallback(async () => {
    setError(null);
    const v = validateTarget(target);
    if (!v.ok) return setError(v.msg);
    setRunning(true);
    setResults([]);

    try {
      for (let i = 0; i < count; i++) {
        const attempt = i + 1;
        const timestamp = new Date().toISOString();
        if (protocol === "http") {
          // prepare URL: allow host without scheme by prefixing https://
          let url = target;
          try {
            new URL(url);
          } catch (e) {
            // prefix https by default
            url = `https://${url}`;
          }

          const m = await measureHttpOnce(url, timeoutMs);
          if (m.ok) setResults((s) => [...s, { ok: true, rtt: m.rtt, attempt, timestamp }]);
          else setResults((s) => [...s, { ok: false, error: m.error, attempt, timestamp }]);
        } else {
          const s = await simulateIcmpOnce();
          setResults((r) => [...r, { ok: true, rtt: s.rtt, attempt, timestamp, simulated: true }]);
        }
      }
    } finally {
      setRunning(false);
    }
  }, [count, protocol, target, timeoutMs, validateTarget]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Ping Tester</h1>
            <p className="mt-1 text-sm opacity-90 max-w-xl">Measure HTTP latency from your browser. ICMP requires server-side probing — this component simulates ICMP for demo purposes and includes options to export & share results.</p>
          </div>
          <div className="text-right">
            <div className="text-xs">Quick actions</div>
            <div className="mt-2 flex gap-2">
              <button className="bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm" onClick={copyToClipboard} aria-label="Copy results">Copy</button>
              <button className="bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm" onClick={() => download("txt")}>Download</button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.form initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-2 bg-white p-4 rounded-2xl shadow-sm" onSubmit={(e) => { e.preventDefault(); runTest(); }}>
          <label htmlFor="target" className="block text-sm font-medium text-slate-700">Target (URL or host)</label>
          <div className="mt-2 flex gap-2">
            <input id="target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={protocol === "http" ? "https://example.com" : "example.com or 8.8.8.8"} className="flex-1 p-2 rounded border border-slate-200 focus:outline-none focus:ring focus:ring-indigo-200" aria-required />
            <select aria-label="Protocol" value={protocol} onChange={(e) => setProtocol(e.target.value as Protocol)} className="p-2 rounded border border-slate-200">
              <option value="http">HTTP (browser)</option>
              <option value="icmp">ICMP (simulated)</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm">Count</label>
            <label className="text-sm">Timeout (ms)</label>
            <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="p-2 rounded border border-slate-200" />
            <input type="number" min={100} max={60000} step={100} value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value))} className="p-2 rounded border border-slate-200" />
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={running} className={`px-4 py-2 rounded-2xl shadow-sm font-medium ${running ? 'bg-slate-300 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {running ? 'Running...' : 'Start Test'}
            </button>
            <button type="button" onClick={() => { setResults([]); setError(null); }} className="px-4 py-2 rounded-2xl bg-white border">Clear</button>
            <button type="button" onClick={() => setHelpOpen((s) => !s)} className="px-4 py-2 rounded-2xl bg-white border">Help</button>
          </div>

          {error && <div className="mt-3 text-red-600" role="alert">{error}</div>}

          <AnimatePresence>
            {helpOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 bg-slate-50 p-3 rounded">
                <strong>Notes & Suggestions</strong>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  <li>HTTP tests run from your browser — some sites block cross-origin requests (CORS). Use a server-side probe for reliable ICMP/HTTP checks.</li>
                  <li>For production ICMP pings, use a serverless function that runs system ping and returns results to the client.
                  </li>
                  <li>Increase timeout if you see frequent timeouts; reduce concurrent runs for limited networks.</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <motion.aside initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-4 rounded-2xl shadow-sm" aria-labelledby="summary-title">
          <div className="flex items-center justify-between">
            <h2 id="summary-title" className="text-lg font-semibold">Summary</h2>
            <div className="text-xs opacity-80">Real-time</div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            <div className="p-3 rounded border bg-slate-50" role="status" aria-live="polite">
              <div className="text-xs">Attempts</div>
              <div className="text-xl font-medium">{results.length} / {count}</div>
            </div>

            <div className="p-3 rounded border bg-slate-50">
              <div className="text-xs">Avg RTT</div>
              <div className="text-xl font-medium">{avg ?? '—'} ms</div>
            </div>

            <div className="p-3 rounded border bg-slate-50">
              <div className="text-xs">Min / Max</div>
              <div className="text-lg">{min ?? '—'} ms / {max ?? '—'} ms</div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={copyToClipboard} className="flex-1 rounded px-3 py-2 bg-indigo-600 text-white">Copy Results</button>
            <button onClick={() => download('md')} className="rounded px-3 py-2 border">Export</button>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={share} className="flex-1 rounded px-3 py-2 bg-emerald-500 text-white">Share</button>
            <button onClick={exportPDF} className="rounded px-3 py-2 border">Export PDF</button>
          </div>
        </motion.aside>
      </main>

      <section ref={resultRef} className="mt-6 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="text-sm opacity-80">Preview</div>
        </div>

        <div className="mt-3">
          {results.length === 0 ? (
            <div className="text-sm text-slate-500">No results yet — run a test to see latency measurements here.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3 items-center">
                <div className="text-sm text-slate-500">Summary:</div>
                <div className="text-sm">{successful.length} successful, {results.length - successful.length} failed</div>
                <div className="ml-auto text-sm text-slate-500">Avg <strong>{avg ?? '—'}</strong> ms</div>
              </div>

              {/* simple sparkline using svg */}
              <div className="mt-2 w-full h-12 bg-slate-50 rounded flex items-center p-2" aria-hidden>
                <svg viewBox={`0 0 ${Math.max(120, results.length * 12)} 40`} className="w-full h-8">
                  {results.map((r, i) => {
                    const x = i * 12 + 8;
                    const y = r.ok ? 40 - Math.min(36, ((r as any).rtt / (max || 1)) * 36) : 40;
                    return <circle key={i} cx={x} cy={y} r={3} />;
                  })}
                </svg>
              </div>

              <pre className="mt-3 p-3 rounded bg-black text-white overflow-auto text-sm" aria-live="polite">
                {results.map((r, i) => (
                  <div key={i}>{r.ok ? `#${r.attempt} — ${r.rtt} ms${(r as any).simulated ? ' (simulated)' : ''}` : `#${r.attempt} — ERROR: ${r.error}`}</div>
                ))}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => download('txt')} className="rounded px-3 py-2 border">Download .txt</button>
          <button onClick={() => download('md')} className="rounded px-3 py-2 border">Download .md</button>
          <button onClick={copyToClipboard} className="rounded px-3 py-2 bg-indigo-600 text-white">Copy</button>
        </div>
      </section>

      <footer className="mt-6 text-sm text-slate-500">
        <div className="flex items-center justify-between">
          <div>Technical notes: Lightweight UI, minimal external deps (framer-motion). For true ICMP support use a server-side probe. Cross-browser on modern browsers.</div>
          <div className="ml-4">Accessible & responsive.</div>
        </div>
      </footer>
    </div>
  );
}

// --- small utility ---
function escapeHtml(s: string) {
  return s.replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
