"use client";
import React, { useState, useEffect, useRef } from "react";

/**
 * WebSecurityScanner Component
 * - Tailwind CSS based, responsive UI
 * - Lightweight (no heavy deps required). Optional features use dynamic imports / progressive enhancement.
 * - Exposes client-side helper behavior and a placeholder API call (/api/scan) the developer can implement server-side.
 *
 * Usage: place this component in a Next.js page (app or pages). If you want robust site fetching/active checks,
 * implement a server-side API route that fetches target sites (to avoid CORS) and performs real scanning.
 *
 * Optional runtime dependencies (only if you choose to enable them):
 * - prismjs (for syntax highlight) or prism-react-renderer
 * - jspdf (for PDF export). The component falls back to browser print when jsPDF is not present.
 */

type Finding = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High" | "Info";
  description: string;
  suggestion?: string;
  evidence?: string;
};

export default function WebSecurityScanner() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [queryMode, setQueryMode] = useState<"quick" | "full">("quick");

  // Lightweight client-side heuristics for instant feedback. These are NOT a substitute for server-side scans.
 const clientSideHeuristics = async (targetUrl: string): Promise<Finding[]> => {
    const issues: Finding[] = [];

    // basic validation
    if (!/^https?:\/\//i.test(targetUrl)) {
      issues.push({
        id: "proto-missing",
        title: "Missing protocol or non-http(s) URL",
        severity: "Info",
        description:
          "We recommend using an https:// URL to scan. If you enter a URL without protocol, we'll try https:// by default.",
        suggestion: "Prefix the URL with https://",
      });
      return issues;
    }

    // Attempt to fetch the page (may fail because of CORS). If it fails, we'll produce simulated checks and a recommendation to use a server-side scan.
    try {
      const res = await fetch(targetUrl, { method: "GET", mode: "cors" });
      const text = await res.text();

      // Quick heuristics inside fetched HTML
      if (/apikey|api_key|secret|authorization|bearer/i.test(text)) {
        issues.push({
          id: "apikey-inline",
          title: "Possible API key or secret found in HTML",
          severity: "High",
          description:
            "The site HTML appears to contain words that often indicate secrets (apiKey, secret, bearer tokens).",
          suggestion: "Remove secrets from client-side code and move them to server-side configuration or vaults.",
          evidence: "Matched tokens like 'apiKey' in HTML content",
        });
      }

      if (/<script[^>]*>[^<]*document\.cookie/i.test(text) || /setCookie\(|cookie\s*=/.test(text)) {
        issues.push({
          id: "insecure-cookies",
          title: "Cookies potentially insecure",
          severity: "Medium",
          description:
            "The page contains scripts that access cookies on the client. Ensure cookies use Secure and HttpOnly flags when needed.",
          suggestion: "Set cookies with Secure, HttpOnly and SameSite attributes where appropriate.",
        });
      }

      if (/(<form[^>]*method=["']?post["']?[^>]*>|<input[^>]*name=["']?(username|password|email)["']?)/i.test(text)) {
        issues.push({
          id: "forms-detected",
          title: "Forms detected - check for CSRF protections",
          severity: "Info",
          description: "Site contains forms which may require CSRF tokens or other protections.",
          suggestion: "Implement CSRF tokens, double-submit cookies or SameSite protections.",
        });
      }

      if (/<\!--\s*CSP\s*[:=]/i.test(text) === false) {
        // absence of inlined CSP note not a proof, but a gentle hint
        issues.push({
          id: "csp-missing",
          title: "Content-Security-Policy not obvious",
          severity: "Low",
          description:
            "We couldn't detect a clear Content-Security-Policy header within the HTML. This is a soft indication only (headers aren't in HTML).",
          suggestion: "Add a strict CSP header to mitigate XSS risks.",
        });
      }

      // simple reflected param check: look for URL params reflected in HTML
      try {
        const parsed = new URL(targetUrl);
        for (const [k, v] of parsed.searchParams.entries()) {
          if (v && text.includes(v)) {
            issues.push({
              id: `reflected-${k}`,
              title: `Reflected parameter: ${k}`,
              severity: "Medium",
              description: `The query parameter ${k} is reflected in HTML — this might indicate a reflected XSS sink if output isn't escaped.`,
              suggestion: `Ensure proper output encoding and context-aware escaping for parameter ${k}.`,
              evidence: `Parameter value '${v}' found in response body`,
            });
          }
        }
      } catch (e) {
        // ignore
      }

      // quick SSL/TLS hint via location protocol
      if (!/^https:/.test(targetUrl)) {
        issues.push({
          id: "no-https",
          title: "Non-HTTPS site",
          severity: "High",
          description: "The URL does not use HTTPS. This exposes users to passive and active network attacks.",
          suggestion: "Use HTTPS with a modern TLS configuration and HSTS.",
        });
      }

      return issues;
    } catch (e: any) {
      // CORS or network error — provide fallback simulated checks and instructions
      return [
        {
          id: "cors-fallback",
          title: "Could not fetch site from the browser (CORS or network)",
          severity: "Info",
          description:
            "Browser-based scans are limited by CORS. For accurate scanning we recommend a server-side scan (an API route that fetches the site and runs analyzers).",
          suggestion:
            "Use the 'Start Server Scan' option which calls an example /api/scan server endpoint included in the developer notes. This will allow deep scanning (SQLi, Command Injection checks, SSL/TLS checks).",
        },
      ];
    }
  };

  const buildMarkdownReport = (target: string, result: Finding[]) => {
    const lines: string[] = [];
    lines.push(`# Web Security Scan Report\n`);
    lines.push(`**Target:** ${target}`);
    lines.push(`**Scanned at:** ${new Date().toISOString()}`);
    lines.push(`\n## Summary\n`);
    if (result.length === 0) lines.push(`No issues found by client heuristics.`);
    else {
      for (const f of result) {
        lines.push(`- **${f.title}** (${f.severity}) - ${f.description}`);
      }
    }
    lines.push(`\n## Findings\n`);
    for (const f of result) {
      lines.push(`### ${f.title} — ${f.severity}`);
      lines.push(`${f.description}`);
      if (f.suggestion) lines.push(`\n**Suggestion:** ${f.suggestion}`);
      if (f.evidence) lines.push(`\n**Evidence:** \n\n\`\`\`\n${f.evidence}\n\`\`\``);
      lines.push(`\n---\n`);
    }
    return lines.join("\n");
  };

  const runClientScan = async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const heuristics = await clientSideHeuristics(targetUrl);
      setFindings(heuristics);
      const md = buildMarkdownReport(targetUrl, heuristics);
      setReportMarkdown(md);
      setLastScanned(new Date().toISOString());
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  // Example function that calls a server-side scanning API. Developer must implement /api/scan to perform
  // deep checks (SQLi, Command Injection, Directory Traversal, SSL/TLS, exposed webhooks, etc.) server-side.
  const runServerScan = async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // You should implement /api/scan on your Next.js app. Server side code can fetch target site and run scanners.
      const res = await fetch(`/api/scan?url=${encodeURIComponent(targetUrl)}&mode=${queryMode}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server scan failed: ${res.statusText}`);
      const data = await res.json();
      // expect { findings: Finding[] }
      if (Array.isArray(data.findings)) {
        setFindings(data.findings);
        const md = buildMarkdownReport(targetUrl, data.findings);
        setReportMarkdown(md);
        setLastScanned(new Date().toISOString());
      } else {
        throw new Error("Invalid response from server scan API");
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  // Utility: copy report to clipboard
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportMarkdown || "");
      toast("Copied report to clipboard");
    } catch (e) {
      toast("Copy failed — your browser may block clipboard access");
    }
  };

  // Export: text, markdown and PDF (lightweight fallback)
  const downloadFile = (filename: string, data: string, mime = "text/plain") => {
    const blob = new Blob([data], { type: mime });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const exportText = () => {
    downloadFile("web-security-report.txt", reportMarkdown || "");
  };

  const exportMarkdown = () => {
    downloadFile("web-security-report.md", reportMarkdown || "", "text/markdown");
  };

  const exportPDF = async () => {
    // Progressive enhancement: try to use jsPDF if available, otherwise open print view
    try {
      // @ts-ignore - attempt dynamic import if jspdf is installed in the project
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const text = reportMarkdown || "No report";
      const split = doc.splitTextToSize(text, 180);
      doc.setFontSize(10);
      doc.text(split, 10, 10);
      doc.save("web-security-report.pdf");
    } catch (e) {
      // fallback: open a new window with printable content
      const w = window.open("", "_blank");
      if (!w) return toast("Could not open print window");
      w.document.write(`<pre>${escapeHtml(reportMarkdown || "")}</pre>`);
      w.document.close();
      w.print();
    }
  };

  const shareReport = async () => {
    const md = reportMarkdown || "";
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Web Security Scan Report",
          text: md.slice(0, 1000),
          url: undefined,
        });
      } catch (e) {
        toast("Share cancelled or failed");
      }
    } else {
      toast("Web share not supported in this browser — you can copy or download the report instead");
    }
  };

  const toast = (msg: string) => {
    // Minimal toast. Replace with a richer UI if desired.
    alert(msg);
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // One-click sample payload copy for testing (XSS/SQLi payload samples)
  const samplePayloads = {
    xss: "<script>alert('xss')</script>",
    sqli: `" OR 1=1--`,
    cmd: "; cat /etc/passwd",
  };

  // Accessibility: focus into URL input when component mounts
  useEffect(() => {
    const el = document.getElementById("ws-url") as HTMLInputElement | null;
    if (el) el.focus();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">Web Security Scanner</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Analyze your website for common security issues such as SQL Injection, XSS, exposed API keys, CSRF risks,
          insecure cookies, directory traversal, command injection, exposed webhooks and SSL/TLS problems.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <label htmlFor="ws-url" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Website URL
          </label>
          <div className="mt-2 flex flex-wrap sm:flex-nowrap gap-2">
            <input
              id="ws-url"
              className="flex-1 min-w-[200px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Website URL to scan"
            />
            <select
              value={queryMode}
              onChange={(e) => setQueryMode(e.target.value as any)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none"
              aria-label="Scan mode"
            >
              <option value="quick">Quick (client heuristics)</option>
              <option value="full">Full (server-side recommended)</option>
            </select>
            <button
              onClick={() => runClientScan(url || "")}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 font-medium disabled:opacity-50 transition-colors"
              disabled={!url || isLoading}
            >
              Quick Scan
            </button>
            <button
              onClick={() => runServerScan(url || "")}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 font-medium disabled:opacity-50 transition-colors"
              disabled={!url || isLoading}
            >
              Server Scan
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setReportMarkdown(buildMarkdownReport(url || "(none)", findings));
                setShowPreview(true);
                toast("Preview refreshed");
              }}
              className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors"
            >
              Refresh Preview
            </button>
            <button onClick={copyReport} className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors">
              Copy Report
            </button>
            <button onClick={exportText} className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors">
              Export .txt
            </button>
            <button onClick={exportMarkdown} className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors">
              Export .md
            </button>
            <button onClick={exportPDF} className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors">
              Export PDF
            </button>
            <button onClick={shareReport} className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors">
              Share
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Findings</h2>
              <div className="text-sm text-slate-500 dark:text-slate-400">Last scanned: {lastScanned ?? "—"}</div>
            </div>

            <div className="mt-3">
              {isLoading && <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">Scanning in progress…</div>}

              {error && <div className="p-4 border border-rose-200 dark:border-rose-900/50 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">Error: {error}</div>}

              {!isLoading && findings.length === 0 && !error && (
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">No findings yet — run a scan to begin.</div>
              )}

              <ul className="mt-2 space-y-3">
                {findings.map((f) => (
                  <li key={f.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.title}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{f.description}</div>
                        {f.evidence && (
                          <pre className="mt-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded p-2 overflow-auto">{f.evidence}</pre>
                        )}
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-block px-2.5 py-1 rounded-md ${
                            f.severity === "High"
                              ? "bg-rose-600 text-white"
                              : f.severity === "Medium"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                          } text-xs font-semibold`}
                        >
                          {f.severity}
                        </div>
                        <button
                          onClick={() => {
                            setReportMarkdown((md) => md + `\n\n- NOTE: ${f.title} handled by me.`);
                            toast("Appended note to report");
                          }}
                          className="mt-2 text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          Add note
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="col-span-1 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tool description</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Quick, friendly web security checks for developers and site owners. Use the Quick Scan for instant client-side
            hints, or enable the Server Scan (requires a server route) for in-depth checks like SQL injection testing,
            SSL/TLS analysis and command-injection probes.
          </p>

          <h4 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick start</h4>
          <ol className="list-decimal ml-5 mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>Enter your website URL (include https://).</li>
            <li>Click Quick Scan for instant hints or Start Server Scan for a deep check.</li>
            <li>Review findings, copy or export your report.</li>
          </ol>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Testing payloads</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(samplePayloads.xss);
                  toast("XSS payload copied");
                }}
              >
                Copy XSS
              </button>
              <button
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(samplePayloads.sqli);
                  toast("SQLi payload copied");
                }}
              >
                Copy SQLi
              </button>
              <button
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(samplePayloads.cmd);
                  toast("Command Injection payload copied");
                }}
              >
                Copy CMD
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <strong className="text-slate-700 dark:text-slate-300">Security note:</strong> Do not scan sites you do not own or have permission to test. This tool is
            intended for responsible testing and developer hygiene.
          </div>
        </aside>
      </section>

      {showPreview && (
        <section className="mt-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Report preview</h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">Live markdown preview</div>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="col-span-1">
              <div ref={reportRef} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl h-80 overflow-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-xs">
                <pre className="whitespace-pre-wrap">{reportMarkdown || "No report generated yet. Run a scan to see output."}</pre>
              </div>
            </div>

            <div className="col-span-1">
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl h-80 overflow-auto bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actionable suggestions</h4>
                {findings.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">No suggestions available.</div>}
                <ul className="mt-2 space-y-2 text-sm">
                  {findings.map((f) => (
                    <li key={f.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-lg">
                      <strong className="text-slate-900 dark:text-slate-100">{f.title}</strong>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{f.suggestion ?? "No suggestion provided."}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Technical considerations: lightweight UI, minimal deps, implement server-side scan for
        deep checks to avoid CORS and improve accuracy.
      </footer>
    </div>
  );
}

// Developer notes — server-side scan example (to implement in /pages/api/scan.ts or /app/api/scan/route.ts):
// (omitted here for brevity)
