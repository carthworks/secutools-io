// File: app/(public)/email-header-analyzer/page.tsx
"use client";
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Copy, Download, Share2, CheckCircle, AlertTriangle, Mail } from "lucide-react";
import Section from "@/components/Section";

// Types
type Mode = "raw" | "parsed";
type Message = { type: "ok" | "warn" | "err"; text: string };
type HeaderField = { key: string; value: string };
type AnalysisResult = {
  headers: HeaderField[];
  warnings: string[];
  valid: boolean;
  error: string | null;
};

// Constants
const MAX_INPUT_SIZE = 1_000_000; // 1MB limit
const MESSAGE_TIMEOUT = 1500;

// Helpers
async function copyText(text: string): Promise<void> {
  if (typeof navigator === "undefined") throw new Error("Navigator unavailable");
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    if (!document.execCommand?.("copy")) throw new Error("Copy command failed");
  } finally {
    document.body.removeChild(textarea);
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

function escapeForHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Basic email header parser (RFC 5322 compliant)
function parseEmailHeaders(input: string): AnalysisResult {
  if (typeof input !== "string") {
    return { headers: [], warnings: [], valid: false, error: "Input is not a string" };
  }
  const raw = input.trim();
  if (!raw) {
    return { headers: [], warnings: [], valid: false, error: "Empty input" };
  }
  if (raw.length > MAX_INPUT_SIZE) {
    return { headers: [], warnings: [], valid: false, error: "Input exceeds size limit (1MB)" };
  }

  try {
    const lines = raw.split(/\r?\n/);
    const headers: HeaderField[] = [];
    const warnings: string[] = [];
    let currentKey = "";
    let currentValue = "";

    // Parse headers
    for (const line of lines) {
      if (!line.trim()) break; // End of headers
      if (/^\s/.test(line)) {
        // Continuation line
        currentValue += " " + line.trim();
      } else {
        if (currentKey) {
          headers.push({ key: currentKey, value: currentValue });
        }
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (!match) continue;
        currentKey = match[1].trim();
        currentValue = match[2].trim();
      }
    }
    if (currentKey) {
      headers.push({ key: currentKey, value: currentValue });
    }

    // Analyze for spoofing/spam
    const from = headers.find((h) => h.key.toLowerCase() === "from")?.value;
    const received = headers.filter((h) => h.key.toLowerCase() === "received");
    const dkim = headers.find((h) => h.key.toLowerCase() === "dkim-signature");
    const spf = headers.find((h) => h.key.toLowerCase() === "received-spf");

    if (!from) warnings.push("Missing 'From' header");
    if (!dkim) warnings.push("Missing DKIM-Signature; email authenticity questionable");
    if (!spf) warnings.push("Missing SPF check; sender verification not confirmed");
    if (received.length === 0) warnings.push("No 'Received' headers; email path unclear");

    // Check for domain mismatch in From vs. SPF/DKIM
    if (from && spf) {
      const fromDomain = from.match(/@([\w.-]+)/)?.[1];
      const spfDomain = spf.value.match(/result=pass.*?@([\w.-]+)/i)?.[1];
      if (fromDomain && spfDomain && fromDomain.toLowerCase() !== spfDomain.toLowerCase()) {
        warnings.push(`Domain mismatch: From (${fromDomain}) does not match SPF (${spfDomain})`);
      }
    }

    return { headers, warnings, valid: headers.length > 0, error: null };
  } catch (err) {
    return { headers: [], warnings: [], valid: false, error: `Header parsing failed: ${String(err)}` };
  }
}

function highlightHeaders(headers: HeaderField[]): string {
  return headers
    .map((h) => `<span class="text-emerald-600 font-medium">${escapeForHtml(h.key)}</span>: ${escapeForHtml(h.value)}`)
    .join("<br>");
}

export default function EmailHeaderAnalyzer(): JSX.Element {
  const [input, setInput] = useState<string>("");
  const [mode, setMode] = useState<Mode>("raw");
  const [message, setMessage] = useState<Message | null>(null);
  const [lineWrap, setLineWrap] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const analysis = useMemo(() => parseEmailHeaders(input), [input]);

  const formattedOutput = useMemo(() => {
    if (!analysis.valid || analysis.error) return input;
    return analysis.headers.map((h) => `${h.key}: ${h.value}`).join("\n");
  }, [analysis, input]);

  const highlightedHtml = useMemo(() => {
    if (!input.trim()) return "<pre class='text-xs text-slate-600'>No preview</pre>";
    if (!analysis.valid || analysis.error) {
      return `<pre class="text-sm leading-relaxed">${escapeForHtml(input)}</pre>`;
    }
    const warningHtml = analysis.warnings.length
      ? `<div class="text-amber-700 mb-2">${analysis.warnings.map((w) => `<div>${escapeForHtml(w)}</div>`).join("")}</div>`
      : "";
    return `<pre class="text-sm leading-relaxed">${warningHtml}${highlightHeaders(analysis.headers)}</pre>`;
  }, [analysis, input]);

  const setTimedMessage = useCallback((msg: Message) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setMessage(msg);
    messageTimeoutRef.current = setTimeout(() => setMessage(null), MESSAGE_TIMEOUT);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!input.trim()) {
      setTimedMessage({ type: "err", text: "No input provided" });
      return;
    }
    const result = parseEmailHeaders(input);
    if (!result.valid) {
      setTimedMessage({ type: "err", text: result.error || "Invalid email headers" });
    } else {
      setTimedMessage({
        type: result.warnings.length ? "warn" : "ok",
        text: result.warnings.length ? "Headers parsed with warnings" : "Headers valid",
      });
    }
  }, [input, setTimedMessage]);

  const handleCopy = useCallback(async () => {
    if (!formattedOutput) return;
    try {
      await copyText(formattedOutput);
      setTimedMessage({ type: "ok", text: "Copied to clipboard" });
    } catch {
      setTimedMessage({ type: "err", text: "Copy failed" });
    }
  }, [formattedOutput, setTimedMessage]);

  const handleExport = useCallback(
    (kind: "txt" | "md") => {
      if (!formattedOutput) return;
      try {
        const content =
          kind === "md"
            ? `# Email Header Analysis\n\n\`\`\`\n${formattedOutput}\n\`\`\`\n\n**Warnings**: ${analysis.warnings.join(", ") || "None"}`
            : formattedOutput;
        downloadBlob(content, `email-headers.${kind}`, kind === "md" ? "text/markdown" : "text/plain");
        setTimedMessage({ type: "ok", text: "Export started" });
      } catch {
        setTimedMessage({ type: "err", text: "Export failed" });
      }
    },
    [formattedOutput, analysis.warnings, setTimedMessage]
  );

  const handleShare = useCallback(async () => {
    if (!formattedOutput) return;
    const title = "Email Header Analysis Result";
    const shareText = `${title}\n\n${formattedOutput}\n\nWarnings: ${analysis.warnings.join(", ") || "None"}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText });
      } else {
        await copyText(shareText);
        setTimedMessage({ type: "ok", text: "Copied share text to clipboard" });
      }
    } catch {
      setTimedMessage({ type: "err", text: "Share failed" });
    }
  }, [formattedOutput, analysis.warnings, setTimedMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  }, [handleAnalyze]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-8">
      <Section
        title="Email Header Analyzer"
        subtitle="Trace spoofing & spam origins from email headers (client-side)"
      >
        <p className="text-sm text-slate-600 max-w-2xl">
          Paste raw email headers to analyze sender authenticity, detect spoofing, and identify spam indicators.
          The tool parses headers and flags issues like missing DKIM/SPF or domain mismatches.
          All processing is done locally in your browser — no data is sent to a server.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="input-area" className="sr-only">Email headers input</label>
            <textarea
              id="input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste email headers here (e.g., From: ..., Received: ...) — Ctrl/Cmd+Enter to analyze"
              className="w-full min-h-[220px] border rounded p-3 font-mono text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              aria-label="Email headers input"
            />

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={handleAnalyze}
                className="px-3 py-1 border rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-2"
                aria-label="Analyze email headers"
              >
                <CheckCircle className="w-4 h-4" /> Analyze
              </button>

              <div className="border-l pl-3 ml-auto flex items-center gap-2">
                <label htmlFor="mode-select" className="text-xs text-slate-500">Mode</label>
                <select
                  id="mode-select"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="text-xs p-1 border rounded bg-white"
                  aria-label="Select input mode"
                >
                  <option value="raw">Raw</option>
                  <option value="parsed">Parsed</option>
                </select>
              </div>
            </div>

            <div className="mt-2 text-sm">
              {analysis.headers.length > 0 || analysis.error ? (
                <span
                  className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded ${
                    analysis.valid && !analysis.warnings.length
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {analysis.valid && !analysis.warnings.length ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  Headers — {analysis.valid ? (analysis.warnings.length ? "Warnings" : "Valid") : "Invalid"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">No data</span>
              )}
              {analysis.error && <div className="mt-2 text-xs text-amber-700">Error: {analysis.error}</div>}
              {message && (
                <div
                  className={`mt-2 text-sm ${message.type === "err" ? "text-rose-600" : "text-emerald-600"}`}
                  role="alert"
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Analysis Preview</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Copy analysis output"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={() => handleExport("txt")}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Export as text file"
                >
                  <Download className="w-4 h-4" /> TXT
                </button>
                <button
                  onClick={() => handleExport("md")}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Export as markdown file"
                >
                  <Download className="w-4 h-4" /> MD
                </button>
                <button
                  onClick={handleShare}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Share analysis output"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            <div
              ref={previewRef}
              className={`w-full min-h-[220px] border rounded p-3 text-sm bg-slate-50 overflow-auto ${
                lineWrap ? "whitespace-pre-wrap" : "whitespace-pre"
              } font-mono`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              aria-live="polite"
              role="region"
              aria-label="Email header analysis preview"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500">Analyzed locally — no data sent to server</div>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={lineWrap}
                  onChange={(e) => setLineWrap(e.target.checked)}
                  aria-label="Toggle line wrapping in preview"
                />
                Wrap
              </label>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}