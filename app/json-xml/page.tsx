"use client";

import React, { useMemo, useRef, useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * JSON / XML Formatter Tool
 * - Paste JSON or XML into the input
 * - Real-time detection (JSON vs XML)
 * - Beautify / Minify / Validate
 * - Syntax-highlighted preview (client-side, no deps)
 * - Copy / Export (txt, md, json), Share, Print (PDF) using iframe blob trick
 * - Lightweight, accessible, mobile-friendly
 */

/* ---------- Helpers ---------- */

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
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

/* Print via invisible iframe (reliable across browsers) */
function printHtml(title: string, htmlBody: string) {
  const html = `
    <html>
      <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
        <style>body{font-family:system-ui,Arial;color:#0f172a;padding:20px}pre{white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:6px;overflow:auto}</style>
      </head>
      <body>${htmlBody}</body>
    </html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    URL.revokeObjectURL(url);
    document.body.removeChild(iframe);
  };
}

/* Lightweight syntax highlighting for JSON & XML (safe-ish: simple regex wrapping) */
function highlightJSON(jsonText: string) {
  // escape
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // token replace
  // strings, numbers, booleans, null, keys
  return (
    esc(jsonText)
      // keys: "key":
      .replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:\s*)/g, (_m, p1, _p2, p3) => {
        return `<span class="text-emerald-600 font-medium">${p1}</span>${p3}`;
      })
      // strings (values)
      .replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")/g, `<span class="text-rose-600">$1</span>`)
      // numbers
      .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, `<span class="text-sky-600">$1</span>`)
      // booleans & null
      .replace(/\b(true|false|null)\b/g, `<span class="text-violet-600">$1</span>`)
  );
}

function highlightXML(xmlText: string) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // tags & attributes
  return esc(xmlText)
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span class="text-slate-500">$1</span>`)
    .replace(/(&lt;\/?[^\s&]+)([\s\S]*?)(&gt;)/g, (_m, p1, p2, p3) => {
      // highlight attributes inside p2
      const attrs = p2.replace(
        /([a-zA-Z0-9\-:]+)(\s*=\s*)(".*?"|'.*?'|[^\s"'>]+)/g,
        `<span class="text-emerald-600">$1</span>$2<span class="text-amber-600">$3</span>`
      );
      return `<span class="text-indigo-700 font-medium">${p1}</span>${attrs}<span class="text-indigo-700 font-medium">${p3}</span>`;
    });
}

/* ---------- Validation helpers ---------- */

function tryParseJSON(input: string) {
  try {
    const obj = JSON.parse(input);
    return { ok: true, obj, error: null };
  } catch (err: any) {
    // Provide friendly parse message
    return { ok: false, obj: null, error: String(err) };
  }
}

function tryParseXML(input: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, "application/xml");
    // detect parsererror element
    if (doc.querySelector("parsererror")) {
      const errText = doc.querySelector("parsererror")?.textContent || "XML parse error";
      return { ok: false, doc: null, error: errText };
    }
    return { ok: true, doc, error: null };
  } catch (err: any) {
    return { ok: false, doc: null, error: String(err) };
  }
}

/* ---------- Component ---------- */

export default function JsonXmlFormatter() {
  const [input, setInput] = useState<string>("");
  const [mode, setMode] = useState<"auto" | "json" | "xml">("auto");
  const [message, setMessage] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(null);
  const [lineWrap, setLineWrap] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // auto-detect type
  const detected = useMemo(() => {
    const t = input.trim();
    if (!t) return null;
    if (mode === "json" || mode === "xml") return mode;
    // quick detection: JSON starts with { or [
    if (/^[\[{]/.test(t)) return "json";
    if (/^<\?xml|^<\w+/.test(t)) return "xml";
    // fallback: if it contains angle brackets more than colons -> xml
    const angle = (t.match(/[<>]/g) || []).length;
    const colon = (t.match(/:/g) || []).length;
    if (angle > colon) return "xml";
    if (colon > 0) return "json";
    return "json";
  }, [input, mode]);

  // formatted outputs & validation
  const { formatted, valid, error } = useMemo(() => {
    if (!input.trim()) return { formatted: "", valid: false, error: null };
    if (detected === "json") {
      const res = tryParseJSON(input);
      if (!res.ok) {
        return { formatted: input, valid: false, error: res.error };
      }
      const pretty = JSON.stringify(res.obj, null, 2);
      return { formatted: pretty, valid: true, error: null };
    } else {
      // xml
      const res = tryParseXML(input);
      if (!res.ok) return { formatted: input, valid: false, error: res.error };
      // pretty-print XML (simple indentation)
      try {
        // serialize then format
        const serializer = new XMLSerializer();
        const raw = serializer.serializeToString(res.doc);
        // basic pretty format
        const formattedXml = formatXml(raw);
        return { formatted: formattedXml, valid: true, error: null };
      } catch (err: any) {
        return { formatted: input, valid: true, error: null };
      }
    }
  }, [input, detected]);

  function formatXml(xml: string) {
    // simple pretty printer for XML
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

  /* UI actions */
  async function handleCopy() {
    if (!formatted) return;
    await copyText(formatted);
    setMessage({ type: "ok", text: "Copied to clipboard" });
    setTimeout(() => setMessage(null), 1500);
  }

  function handleMinify() {
    if (!input.trim()) return;
    if (detected === "json") {
      const r = tryParseJSON(input);
      if (!r.ok) {
        setMessage({ type: "err", text: "Invalid JSON: " + r.error });
        return;
      }
      setInput(JSON.stringify(r.obj));
      setMessage({ type: "ok", text: "JSON minified" });
    } else {
      // xml minify: remove newlines/indent
      const s = input.replace(/\r?\n/g, "").replace(/\s{2,}/g, " ");
      setInput(s);
      setMessage({ type: "ok", text: "XML minified" });
    }
    setTimeout(() => setMessage(null), 1400);
  }

  function handleBeautify() {
    if (!input.trim()) return;
    if (detected === "json") {
      const r = tryParseJSON(input);
      if (!r.ok) {
        setMessage({ type: "err", text: "Invalid JSON: " + r.error });
        return;
      }
      setInput(JSON.stringify(r.obj, null, 2));
      setMessage({ type: "ok", text: "JSON beautified" });
    } else {
      const r = tryParseXML(input);
      if (!r.ok) {
        setMessage({ type: "err", text: "Invalid XML: " + r.error });
        return;
      }
      const serializer = new XMLSerializer();
      const raw = serializer.serializeToString(r.doc);
      setInput(formatXml(raw));
      setMessage({ type: "ok", text: "XML formatted" });
    }
    setTimeout(() => setMessage(null), 1400);
  }

  function handleValidate() {
    if (!input.trim()) return;
    if (detected === "json") {
      const r = tryParseJSON(input);
      if (!r.ok) setMessage({ type: "err", text: "Invalid JSON: " + r.error });
      else setMessage({ type: "ok", text: "Valid JSON" });
    } else {
      const r = tryParseXML(input);
      if (!r.ok) setMessage({ type: "err", text: "Invalid XML: " + r.error });
      else setMessage({ type: "ok", text: "Valid XML" });
    }
    setTimeout(() => setMessage(null), 1800);
  }

  function handleExport(kind: "txt" | "md" | "json") {
    if (!formatted) return;
    const title = detected === "json" ? "JSON Formatter" : "XML Formatter";
    if (kind === "json") {
      // export structured: if it's JSON, export actual json; otherwise wrap
      if (detected === "json") downloadBlob(formatted, "formatted.json", "application/json");
      else downloadBlob(formatted, "formatted.xml", "application/xml");
    } else if (kind === "md") {
      const md = `# ${title}\n\n\`\`\`${detected}\n${formatted}\n\`\`\``;
      downloadBlob(md, "formatted.md", "text/markdown");
    } else {
      downloadBlob(formatted, "formatted.txt", "text/plain");
    }
  }

  async function handleShare() {
    if (!formatted) return;
    const title = detected === "json" ? "JSON formatter result" : "XML formatter result";
    const shareText = `${title}\n\n${formatted}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title, text: shareText });
      } catch {
        // ignore
      }
    } else {
      await copyText(shareText);
      setMessage({ type: "ok", text: "Copied share text to clipboard" });
      setTimeout(() => setMessage(null), 1400);
    }
  }

  function handlePrint() {
    if (!formatted) return;
    const body = `<h1>${detected?.toUpperCase()} Preview</h1><pre>${escapeHtml(formatted)}</pre>`;
    printHtml("Formatted Output", body);
  }

  function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* keyboard shortcuts: Ctrl/Cmd+Enter -> beautify */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleBeautify();
    }
  }

  /* generate highlighted HTML for preview */
  const highlightedHtml = useMemo(() => {
    if (!formatted) return "<pre class='text-xs text-slate-600'>No preview</pre>";
    if (detected === "json") return `<pre class="text-sm leading-relaxed">${highlightJSON(formatted)}</pre>`;
    return `<pre class="text-sm leading-relaxed">${highlightXML(formatted)}</pre>`;
  }, [formatted, detected]);

  return (
    <div className="space-y-8">
      <Section title="JSON / XML Formatter" subtitle="Beautify, validate, and preview structured data (client-side)">
        <p className="text-sm text-slate-600 max-w-2xl">
          Paste JSON or XML into the editor. The tool auto-detects the format, validates it, and shows a syntax-highlighted preview.
          Use the buttons to Beautify, Minify, Validate, Copy, Export or Share results. Formatting runs entirely in your browser — nothing is sent to a server.
        </p>

        {/* Editor + controls */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="input-area" className="sr-only">Input data</label>
            <textarea
              id="input-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Paste JSON ({"foo":123}) or XML (<root>...</root>) here — Ctrl/Cmd+Enter to beautify'
              className="w-full min-h-[220px] border rounded p-3 font-mono text-sm bg-white"
              aria-label="Input data"
            />

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button onClick={handleBeautify} className="px-3 py-1 border rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Beautify
              </button>
              <button onClick={handleMinify} className="px-3 py-1 border rounded bg-slate-50 hover:bg-slate-100 flex items-center gap-2">
                Minify
              </button>
              <button onClick={handleValidate} className="px-3 py-1 border rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-2">
                Validate
              </button>

              <div className="border-l pl-3 ml-auto flex items-center gap-2">
                <label className="text-xs text-slate-500">Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="text-xs p-1 border rounded bg-white">
                  <option value="auto">Auto</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                </select>
              </div>
            </div>

            {/* small status */}
            <div className="mt-2 text-sm">
              {detected ? (
                <span className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded ${valid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {valid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {detected.toUpperCase()} — {valid ? "Valid" : "Invalid / Preview"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">No data</span>
              )}

              {error && <div className="mt-2 text-xs text-amber-700">Error: {String(error)}</div>}
              {message && <div className={`mt-2 text-sm ${message.type === "err" ? "text-rose-600" : "text-emerald-600"}`}>{message.text}</div>}
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="px-2 py-1 border rounded text-xs flex items-center gap-1"><Copy className="w-4 h-4" /> Copy</button>
                <button onClick={() => handleExport("txt")} className="px-2 py-1 border rounded text-xs flex items-center gap-1"><Download className="w-4 h-4" /> TXT</button>
                <button onClick={() => handleExport("md")} className="px-2 py-1 border rounded text-xs flex items-center gap-1"><Download className="w-4 h-4" /> MD</button>
                <button onClick={() => handleExport("json")} className="px-2 py-1 border rounded text-xs flex items-center gap-1"><Download className="w-4 h-4" /> File</button>
                <button onClick={handleShare} className="px-2 py-1 border rounded text-xs flex items-center gap-1"><Share2 className="w-4 h-4" /> Share</button>
                <button onClick={handlePrint} className="px-2 py-1 border rounded text-xs flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Print</button>
              </div>
            </div>

            <div
              ref={previewRef}
              className={`w-full min-h-[220px] border rounded p-3 text-sm bg-slate-50 overflow-auto ${lineWrap ? "whitespace-pre-wrap" : "whitespace-pre"} font-mono`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              aria-live="polite"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500">Rendered locally — no data sent to server</div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={lineWrap} onChange={(e) => setLineWrap(e.target.checked)} /> Wrap
                </label>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
