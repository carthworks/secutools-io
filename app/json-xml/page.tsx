// File: app/(public)/json-xml/page.tsx
"use client";
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Copy, Download, Share2, CheckCircle, AlertTriangle, Printer } from "lucide-react";
import Section from "@/components/Section"; // Ensure this component exists or replace with a div

// Types
type Mode = "auto" | "json" | "xml";
type Message = { type: "ok" | "warn" | "err"; text: string };
type ParseResult<T> = { ok: true; obj: T; error: null } | { ok: false; obj: null; error: string };

// Constants
const MAX_INPUT_SIZE = 1_000_000; // 1MB limit for input
const MESSAGE_TIMEOUT = 1500;

// Helpers
async function copyText(text: string): Promise<void> {
  if (typeof navigator === "undefined") throw new Error("Navigator unavailable");
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback: Create textarea for copying
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    // execCommand may be deprecated in some browsers but keep as fallback
    // defensive check without optional chaining call syntax to satisfy some linters
    // (document.execCommand is available in many legacy browsers)
    // eslint-disable-next-line deprecation/deprecation
    if (!document.execCommand || !document.execCommand("copy")) throw new Error("Copy command failed");
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
  // revoke after a tick to allow click to start download in all browsers
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function printHtml(title: string, htmlBody: string) {
  try {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error("Cannot access iframe document");
    doc.open();
    doc.write(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>${title}</title>
          <style>
            body { font-family: system-ui, Arial; color: #0f172a; padding: 20px; }
            pre { white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; overflow: auto; }
          </style>
        </head>
        <body>${htmlBody}</body>
      </html>
    `);
    doc.close();
    // wait for iframe to load then print
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        // cleanup
        setTimeout(() => {
          try {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          } catch {
            /* ignore cleanup errors */
          }
        }, 1000);
      }
    };
  } catch {
    throw new Error("Print failed");
  }
}

function escapeForHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJSON(jsonText: string): string {
  let out = escapeForHtml(jsonText);
  out = out.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:\s*)/g,
    `<span class="text-emerald-600 font-medium">$1</span>$3`
  );
  out = out.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")/g, `<span class="text-rose-600">$1</span>`);
  out = out.replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, `<span class="text-sky-600">$1</span>`);
  out = out.replace(/\b(true|false|null)\b/g, `<span class="text-violet-600">$1</span>`);
  return out;
}

function highlightXML(xmlText: string): string {
  const escaped = escapeForHtml(xmlText);
  return escaped
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span class="text-slate-500">$1</span>`)
    .replace(/(&lt;\/?[^\s&]+)([\s\S]*?)(&gt;)/g, (_m, p1, p2, p3) => {
      const attrs = p2.replace(
        /([a-zA-Z0-9\-:]+)(\s*=\s*)(".*?"|'.*?'|[^\s"'>]+)/g,
        `<span class="text-emerald-600">$1</span>$2<span class="text-amber-600">$3</span>`
      );
      return `<span class="text-indigo-700 font-medium">${p1}</span>${attrs}<span class="text-indigo-700 font-medium">${p3}</span>`;
    });
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function tolerantJsonPreprocess(input: string): string {
  let s = stripBom(input);
  s = s
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      if (idx === -1) return line;
      const before = line.slice(0, idx);
      const quotes = (before.match(/"/g) || []).length;
      return quotes % 2 === 0 ? before : line;
    })
    .join("\n");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  s = s.replace(/,\s*(?=[}\]])/g, "");
  s = s.replace(/'([^\r\n'\\]*(?:\\.[^\r\n'\\]*)*)'/g, (_m, p1) => {
    if (p1.includes('"')) return `'${p1}'`;
    const inner = p1.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${inner}"`;
  });
  return s;
}

function tryParseJSON(input: string): ParseResult<unknown> {
  if (typeof input !== "string") {
    return { ok: false, obj: null, error: "Input is not a string" };
  }
  const raw = input.trim();
  if (!raw) {
    return { ok: false, obj: null, error: "Empty input" };
  }
  try {
    const obj = JSON.parse(stripBom(raw));
    return { ok: true, obj, error: null };
  } catch {
    try {
      const pre = tolerantJsonPreprocess(raw);
      const obj = JSON.parse(pre);
      return { ok: true, obj, error: null };
    } catch (err) {
      return { ok: false, obj: null, error: `JSON parse failed: ${String(err)}` };
    }
  }
}

// <-- FIX: return shape uses `obj` (not `doc`) to match ParseResult<T> -->
function tryParseXML(input: string): ParseResult<Document> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, "application/xml");
    const parserErrors = doc.getElementsByTagName("parsererror");
    if (parserErrors.length > 0) {
      return { ok: false, obj: null, error: parserErrors[0].textContent ?? "XML parse error" };
    }
    if (/parsererror/i.test(doc.documentElement?.nodeName ?? "") || /parsererror/i.test(doc.documentElement?.textContent ?? "")) {
      return { ok: false, obj: null, error: "XML parse error" };
    }
    if (!doc) return { ok: false, obj: null, error: "XML parse produced no document" };
    return { ok: true, obj: doc, error: null };
  } catch (err) {
    return { ok: false, obj: null, error: String(err) };
  }
}

function formatXml(xml: string): string {
  const PADDING = "  ";
  const reg = /(>)(<)(\/*)/g;
  let formattedXml = xml.replace(reg, "$1\r\n$2$3");
  let pad = 0;
  return formattedXml
    .split("\r\n")
    .map((node) => {
      let indent = "";
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = PADDING.repeat(pad);
      } else if (node.match(/^<\/\w/)) {
        pad = Math.max(0, pad - 1);
        indent = PADDING.repeat(pad);
      } else if (node.match(/^<\w([^>]*[^/])?>.*$/)) {
        indent = PADDING.repeat(pad);
        pad += 1;
      } else {
        indent = PADDING.repeat(pad);
      }
      return indent + node;
    })
    .join("\n");
}

export default function JsonXmlFormatter(): JSX.Element {
  const [input, setInput] = useState<string>("");
  const [mode, setMode] = useState<Mode>("auto");
  const [message, setMessage] = useState<Message | null>(null);
  const [lineWrap, setLineWrap] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  // <-- FIX: browser timeout returns number, avoid NodeJS.Timeout -->
  const messageTimeoutRef = useRef<number | null>(null);

  const detected = useMemo<"json" | "xml" | null>(() => {
    const t = input.trim();
    if (!t) return null;
    if (mode === "json" || mode === "xml") return mode;
    if (/^[\[{]/.test(t)) return "json";
    if (/^<\?xml|^<\w+/.test(t)) return "xml";
    const angle = (t.match(/[<>]/g) || []).length;
    const colon = (t.match(/:/g) || []).length;
    return angle > colon ? "xml" : "json";
  }, [input, mode]);

  const { formatted, valid, error } = useMemo(() => {
    const raw = input.trim();
    if (!raw) return { formatted: "", valid: false, error: null };
    if (raw.length > MAX_INPUT_SIZE) {
      return { formatted: "", valid: false, error: "Input exceeds size limit (1MB)" };
    }
    if (detected === "json") {
      const res = tryParseJSON(raw);
      if (!res.ok) return { formatted: raw, valid: false, error: res.error };
      try {
        const pretty = JSON.stringify(res.obj, null, 2);
        return { formatted: pretty, valid: true, error: null };
      } catch (e) {
        return { formatted: raw, valid: false, error: String(e) };
      }
    }
    const res = tryParseXML(raw);
    if (!res.ok) return { formatted: raw, valid: false, error: res.error };
    try {
      const serializer = new XMLSerializer();
      // <-- use res.obj (Document) -->
      const rawXml = serializer.serializeToString(res.obj!);
      const formattedXml = formatXml(rawXml);
      return { formatted: formattedXml, valid: true, error: null };
    } catch (err) {
      return { formatted: raw, valid: false, error: String(err) };
    }
  }, [input, detected]);

  const highlightedHtml = useMemo(() => {
    if (!formatted) return `<pre class='text-xs text-slate-600'>No preview</pre>`;
    return `<pre class="text-sm leading-relaxed">${
      detected === "json" ? highlightJSON(formatted) : highlightXML(formatted)
    }</pre>`;
  }, [formatted, detected]);

  const setTimedMessage = useCallback((msg: Message) => {
    if (messageTimeoutRef.current !== null) {
      window.clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setMessage(msg);
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, MESSAGE_TIMEOUT);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!formatted) return;
    try {
      await copyText(formatted);
      setTimedMessage({ type: "ok", text: "Copied to clipboard" });
    } catch {
      setTimedMessage({ type: "err", text: "Copy failed" });
    }
  }, [formatted, setTimedMessage]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) return;
    if (detected === "json") {
      const r = tryParseJSON(input);
      if (!r.ok) {
        setTimedMessage({ type: "err", text: `Invalid JSON: ${r.error}` });
        return;
      }
      try {
        setInput(JSON.stringify(r.obj));
        setTimedMessage({ type: "ok", text: "JSON minified" });
      } catch (e) {
        setTimedMessage({ type: "err", text: `Minify failed: ${String(e)}` });
      }
    } else {
      try {
        const s = input.replace(/\r?\n/g, "").replace(/\s{2,}/g, " ");
        setInput(s);
        setTimedMessage({ type: "ok", text: "XML minified" });
      } catch (e) {
        setTimedMessage({ type: "err", text: `Minify failed: ${String(e)}` });
      }
    }
  }, [input, detected, setTimedMessage]);

  const handleBeautify = useCallback(() => {
    if (!input.trim()) return;
    if (detected === "json") {
      const r = tryParseJSON(input);
      if (!r.ok) {
        setTimedMessage({ type: "err", text: `Invalid JSON: ${r.error}` });
        return;
      }
      try {
        setInput(JSON.stringify(r.obj, null, 2));
        setTimedMessage({ type: "ok", text: "JSON beautified" });
      } catch (e) {
        setTimedMessage({ type: "err", text: `Beautify failed: ${String(e)}` });
      }
    } else {
      const r = tryParseXML(input);
      if (!r.ok) {
        setTimedMessage({ type: "err", text: `Invalid XML: ${r.error}` });
        return;
      }
      try {
        const serializer = new XMLSerializer();
        const raw = serializer.serializeToString(r.obj!);
        setInput(formatXml(raw));
        setTimedMessage({ type: "ok", text: "XML formatted" });
      } catch (e) {
        setTimedMessage({ type: "err", text: `Format failed: ${String(e)}` });
      }
    }
  }, [input, detected, setTimedMessage]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) return;
    if (detected === "json") {
      const r = tryParseJSON(input);
      setTimedMessage(r.ok ? { type: "ok", text: "Valid JSON" } : { type: "err", text: `Invalid JSON: ${r.error}` });
    } else {
      const r = tryParseXML(input);
      setTimedMessage(r.ok ? { type: "ok", text: "Valid XML" } : { type: "err", text: `Invalid XML: ${r.error}` });
    }
  }, [input, detected, setTimedMessage]);

  const handleExport = useCallback(
    (kind: "txt" | "md" | "json") => {
      if (!formatted) return;
      try {
        const title = detected === "json" ? "JSON Formatter" : "XML Formatter";
        if (kind === "json") {
          downloadBlob(formatted, `formatted.${detected}`, detected === "json" ? "application/json" : "application/xml");
        } else if (kind === "md") {
          const md = `# ${title}\n\n\`\`\`${detected}\n${formatted}\n\`\`\``;
          downloadBlob(md, "formatted.md", "text/markdown");
        } else {
          downloadBlob(formatted, "formatted.txt", "text/plain");
        }
        setTimedMessage({ type: "ok", text: "Export started" });
      } catch {
        setTimedMessage({ type: "err", text: "Export failed" });
      }
    },
    [formatted, detected, setTimedMessage]
  );

  const handleShare = useCallback(async () => {
    if (!formatted) return;
    const title = detected === "json" ? "JSON formatter result" : "XML formatter result";
    const shareText = `${title}\n\n${formatted}`;
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
  }, [formatted, detected, setTimedMessage]);

  const handlePrint = useCallback(() => {
    if (!formatted) return;
    try {
      printHtml("Formatted Output", `<h1>${(detected ?? "DATA").toUpperCase()} Preview</h1><pre>${escapeForHtml(formatted)}</pre>`);
      setTimedMessage({ type: "ok", text: "Print initiated" });
    } catch {
      setTimedMessage({ type: "err", text: "Print failed" });
    }
  }, [formatted, detected, setTimedMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleBeautify();
    }
  }, [handleBeautify]);

  // Update preview innerHTML instead of using dangerouslySetInnerHTML
  useEffect(() => {
    if (!previewRef.current) return;
    // highlightedHtml is constructed using escapeForHtml first, so it's safe for innerHTML
    previewRef.current.innerHTML = highlightedHtml;
  }, [highlightedHtml]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current !== null) {
        window.clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      <Section
        title="JSON / XML Formatter"
        subtitle="Beautify, validate, and preview structured data (client-side)"
      >
        <p className="text-sm text-slate-600 max-w-2xl">
          Paste JSON or XML into the editor. The tool auto-detects the format, validates it, and shows a syntax-highlighted preview.
          Use the buttons to beautify, minify, validate, copy, export, or share results. Formatting runs entirely in your browser — no data is sent to a server.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="input-area" className="sr-only">Input JSON or XML data</label>
            <textarea
              id="input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Paste JSON ({"foo":123}) or XML (<root>...</root>) here — Ctrl/Cmd+Enter to beautify'
              className="w-full min-h-[220px] border rounded p-3 font-mono text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              aria-label="Input JSON or XML data"
            />

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={handleBeautify}
                className="px-3 py-1 border rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-2"
                aria-label="Beautify input data"
              >
                <CheckCircle className="w-4 h-4" /> Beautify
              </button>
              <button
                onClick={handleMinify}
                className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100 flex items-center gap-2"
                aria-label="Minify input data"
              >
                Minify
              </button>
              <button
                onClick={handleValidate}
                className="px-3 py-1 border rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-2"
                aria-label="Validate input data"
              >
                Validate
              </button>

              <div className="border-l pl-3 ml-auto flex items-center gap-2">
                <label htmlFor="mode-select" className="text-xs text-slate-500">Mode</label>
                <select
                  id="mode-select"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="text-xs p-1 border rounded bg-white"
                  aria-label="Select format mode"
                >
                  <option value="auto">Auto</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                </select>
              </div>
            </div>

            <div className="mt-2 text-sm">
              {detected ? (
                <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded ${valid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {valid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {detected.toUpperCase()} — {valid ? "Valid" : "Invalid / Preview"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">No data</span>
              )}
              {error && <div className="mt-2 text-xs text-amber-700">Error: {error}</div>}
              {message && (
                <div className={`mt-2 text-sm ${message.type === "err" ? "text-rose-600" : "text-emerald-600"}`} role="alert">
                  {message.text}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Copy formatted output"
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
                  onClick={() => handleExport("json")}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label={`Export as ${detected === "json" ? "JSON" : "XML"} file`}
                >
                  <Download className="w-4 h-4" /> File
                </button>
                <button
                  onClick={handleShare}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Share formatted output"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={handlePrint}
                  className="px-2 py-1 border rounded text-xs flex items-center gap-1"
                  aria-label="Print formatted output"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>

            <div
              ref={previewRef}
              className={`w-full min-h-[220px] border rounded p-3 text-sm bg-slate-50 overflow-auto ${lineWrap ? "whitespace-pre-wrap" : "whitespace-pre"} font-mono`}
              // preview innerHTML is updated in useEffect (safer, and avoids dangerouslySetInnerHTML)
              aria-live="polite"
              role="region"
              aria-label="Formatted output preview"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500">Rendered locally — no data sent to server</div>
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
