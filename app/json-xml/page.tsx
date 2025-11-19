// File: app/(public)/json-xml/page.tsx
"use client";
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Copy, Download, Share2, CheckCircle, AlertTriangle, Printer } from "lucide-react";
import Section from "@/components/Section";

type Mode = "auto" | "json" | "xml";
type Message = { type: "ok" | "warn" | "err"; text: string };
type ParseResult<T> = { ok: true; obj: T; error: null } | { ok: false; obj: null; error: string };

const MAX_INPUT_SIZE = 1_000_000;
const MESSAGE_TIMEOUT = 1500;

// Helpers (same as before)
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
            h1 { font-size: 18px; margin-bottom: 8px; }
          </style>
        </head>
        <body>${htmlBody}</body>
      </html>
    `);
    doc.close();
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          try {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          } catch {}
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
  const messageTimeoutRef = useRef<number | null>(null);

  // New: tab for right-side view
  type Tab = "beautify" | "minify" | "xmlformat";
  const [tab, setTab] = useState<Tab>("beautify");

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

  const parseResults = useMemo(() => {
    const raw = input.trim();
    if (!raw) return { json: null as ParseResult<unknown> | null, xml: null as ParseResult<Document> | null, error: null as string | null };
    if (raw.length > MAX_INPUT_SIZE) return { json: null, xml: null, error: "Input exceeds size limit (1MB)" };
    const j = tryParseJSON(raw);
    const x = tryParseXML(raw);
    return { json: j, xml: x, error: null as string | null };
  }, [input]);

  // derive formatted strings for each tab
  const beautified = useMemo(() => {
    const raw = input.trim();
    if (!raw) return "";
    if (detected === "json") {
      const r = parseResults.json;
      if (!r || !r.ok) return raw;
      try {
        return JSON.stringify(r.obj, null, 2);
      } catch {
        return raw;
      }
    } else {
      const r = parseResults.xml;
      if (!r || !r.ok) return raw;
      try {
        const serializer = new XMLSerializer();
        const rawXml = serializer.serializeToString(r.obj!);
        return formatXml(rawXml);
      } catch {
        return raw;
      }
    }
  }, [input, detected, parseResults]);

  const minified = useMemo(() => {
    const raw = input.trim();
    if (!raw) return "";
    if (detected === "json") {
      const r = parseResults.json;
      if (!r || !r.ok) return raw.replace(/\s+/g, " ");
      try {
        return JSON.stringify(r.obj);
      } catch {
        return raw.replace(/\s+/g, " ");
      }
    } else {
      // naive xml minify: remove newlines and collapse spaces between tags/text
      return raw.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").replace(/^\s+|\s+$/g, "");
    }
  }, [input, detected, parseResults]);

  const xmlFormattedOnly = useMemo(() => {
    if (detected !== "xml") return "";
    const r = parseResults.xml;
    if (!r || !r.ok) return "";
    try {
      const serializer = new XMLSerializer();
      const rawXml = serializer.serializeToString(r.obj!);
      return formatXml(rawXml);
    } catch {
      return "";
    }
  }, [input, detected, parseResults]);

  // Build HTML for preview (highlighted)
  const previewHtml = useMemo(() => {
    // choose source based on tab & detected
    let content = "";
    if (tab === "beautify") content = beautified;
    else if (tab === "minify") content = minified;
    else content = xmlFormattedOnly || minified;

    if (!content) return `<pre class='text-xs text-slate-600'>No preview</pre>`;

    return `<pre class="text-sm leading-relaxed">${detected === "json" ? highlightJSON(content) : highlightXML(content)}</pre>`;
  }, [tab, beautified, minified, xmlFormattedOnly, detected]);

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

  // Actions act on current tab output
  const getCurrentOutput = useCallback(() => {
    if (tab === "beautify") return beautified;
    if (tab === "minify") return minified;
    return xmlFormattedOnly || minified;
  }, [tab, beautified, minified, xmlFormattedOnly]);

  const handleCopy = useCallback(async () => {
    const out = getCurrentOutput();
    if (!out) return setTimedMessage({ type: "err", text: "Nothing to copy" });
    try {
      await copyText(out);
      setTimedMessage({ type: "ok", text: "Copied to clipboard" });
    } catch {
      setTimedMessage({ type: "err", text: "Copy failed" });
    }
  }, [getCurrentOutput, setTimedMessage]);

  const handleExport = useCallback((kind: "txt" | "md" | "json") => {
    const out = getCurrentOutput();
    if (!out) return setTimedMessage({ type: "err", text: "Nothing to export" });
    try {
      const detectedExt = detected === "json" ? "json" : "xml";
      if (kind === "json") {
        downloadBlob(out, `formatted.${detectedExt}`, detected === "json" ? "application/json" : "application/xml");
      } else if (kind === "md") {
        const md = `# ${detected === "json" ? "JSON" : "XML"} - ${tab}\n\n\`\`\`${detectedExt}\n${out}\n\`\`\``;
        downloadBlob(md, `formatted_${tab}.md`, "text/markdown");
      } else {
        downloadBlob(out, `formatted_${tab}.txt`, "text/plain");
      }
      setTimedMessage({ type: "ok", text: "Export started" });
    } catch {
      setTimedMessage({ type: "err", text: "Export failed" });
    }
  }, [getCurrentOutput, setTimedMessage, detected, tab]);

  const handleShare = useCallback(async () => {
    const out = getCurrentOutput();
    if (!out) return setTimedMessage({ type: "err", text: "Nothing to share" });
    const title = detected === "json" ? "JSON formatter result" : "XML formatter result";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: out });
        setTimedMessage({ type: "ok", text: "Shared" });
      } else {
        await copyText(out);
        setTimedMessage({ type: "ok", text: "Copied share text to clipboard" });
      }
    } catch {
      setTimedMessage({ type: "err", text: "Share failed" });
    }
  }, [getCurrentOutput, detected, setTimedMessage]);

  const handlePrint = useCallback(() => {
    const out = getCurrentOutput();
    if (!out) return setTimedMessage({ type: "err", text: "Nothing to print" });
    try {
      const title = `${(detected ?? "DATA").toUpperCase()} - ${tab}`;
      printHtml(title, `<h1>${title}</h1><pre>${escapeForHtml(out)}</pre>`);
      setTimedMessage({ type: "ok", text: "Print initiated" });
    } catch {
      setTimedMessage({ type: "err", text: "Print failed" });
    }
  }, [getCurrentOutput, detected, tab, setTimedMessage]);

  const handleBeautifyCmd = useCallback(() => {
    // convenience: set input to beautified content (only for json/xml)
    if (!beautified) return setTimedMessage({ type: "err", text: "Nothing to beautify" });
    setInput(beautified);
    setTimedMessage({ type: "ok", text: "Beautified applied to input" });
  }, [beautified, setTimedMessage]);

  const handleMinifyCmd = useCallback(() => {
    if (!minified) return setTimedMessage({ type: "err", text: "Nothing to minify" });
    setInput(minified);
    setTimedMessage({ type: "ok", text: "Minified applied to input" });
  }, [minified, setTimedMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleBeautifyCmd();
    }
  }, [handleBeautifyCmd]);

  // place preview HTML into DOM safely (we escape content in highlight functions)
  useEffect(() => {
    if (!previewRef.current) return;
    previewRef.current.innerHTML = previewHtml;
    // preserve wrapping class (lineWrap toggle handled via parent classes)
  }, [previewHtml]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current !== null) {
        window.clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  const detectedStatus = useMemo(() => {
    // determine validity for small status badge
    if (!input.trim()) return { detected: null as null | "json" | "xml", valid: false, error: null as string | null };
    if (input.length > MAX_INPUT_SIZE) return { detected: null, valid: false, error: "Input exceeds size limit (1MB)" };
    if (detected === "json") {
      const r = parseResults.json;
      return { detected, valid: !!r && r.ok, error: r && !r.ok ? r.error : null };
    }
    const r = parseResults.xml;
    return { detected, valid: !!r && r.ok, error: r && !r.ok ? r.error : null };
  }, [input, detected, parseResults]);

  return (
    <div className="space-y-8">
      <Section
        title="JSON / XML Formatter"
        subtitle="Beautify, minify, and preview structured data (client-side) — colorful JSON on the right"
      >
        <p className="text-sm text-slate-600 max-w-2xl">
          Paste JSON or XML on the left. Use tabs on the right to view <strong>Beautify</strong>, <strong>Minify</strong> or <strong>XML Format</strong>. Buttons operate on the current tab's output.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Left: input */}
          <div>
            <label htmlFor="input-area" className="sr-only">Input JSON or XML data</label>
            <textarea
              id="input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Paste JSON ({"foo":123}) or XML (<root>...</root>) here — Ctrl/Cmd+Enter to apply beautify'
              className="w-full min-h-[420px] border rounded p-3 font-mono text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              aria-label="Input JSON or XML data"
            />

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={handleBeautifyCmd}
                className="px-3 py-1 border rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-2"
                aria-label="Apply beautify to input"
              >
                <CheckCircle className="w-4 h-4" /> Apply Beautify
              </button>
              <button
                onClick={handleMinifyCmd}
                className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100 flex items-center gap-2"
                aria-label="Apply minify to input"
              >
                Minify Input
              </button>
              <button
                onClick={() => setTab("beautify")}
                className={`px-3 py-1 border rounded text-xs ${tab === "beautify" ? "bg-indigo-50 text-indigo-700" : "bg-white"}`}
                aria-label="Select beautify tab"
              >
                Beautify tab
              </button>
              <button
                onClick={() => setTab("minify")}
                className={`px-3 py-1 border rounded text-xs ${tab === "minify" ? "bg-indigo-50 text-indigo-700" : "bg-white"}`}
                aria-label="Select minify tab"
              >
                Minify tab
              </button>
              <button
                onClick={() => setTab("xmlformat")}
                className={`px-3 py-1 border rounded text-xs ${tab === "xmlformat" ? "bg-indigo-50 text-indigo-700" : "bg-white"}`}
                aria-label="Select xml format tab"
              >
                XML Format tab
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
              {detectedStatus.detected ? (
                <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded ${detectedStatus.valid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {detectedStatus.valid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {detectedStatus.detected.toUpperCase()} — {detectedStatus.valid ? "Valid" : "Invalid / Preview"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">No data</span>
              )}
              {detectedStatus.error && <div className="mt-2 text-xs text-amber-700">Error: {detectedStatus.error}</div>}
              {message && (
                <div className={`mt-2 text-sm ${message.type === "err" ? "text-rose-600" : "text-emerald-600"}`} role="alert">
                  {message.text}
                </div>
              )}
            </div>
          </div>

          {/* Right: tabbed preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Preview — <span className="text-xs text-slate-500 ml-2">{tab.toUpperCase()}</span></div>
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
              className={`w-full min-h-[420px] border rounded p-3 text-sm bg-slate-50 overflow-auto ${lineWrap ? "whitespace-pre-wrap" : "whitespace-pre"} font-mono`}
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
