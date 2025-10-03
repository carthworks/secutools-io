// File: components/WordlistGenerator.tsx
"use client";

import React, { useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  Copy,
  Download,
  Share2,
  FileText,
  RefreshCw,
  Check,
  AlertTriangle,
  ArrowDownCircle,
  ChevronDown,
} from "lucide-react";

/**
 * WordlistGenerator
 *
 * - Responsive layout (controls / preview)
 * - Copy, Export (TXT, MD), Print-to-PDF (via print dialog), Share
 * - Real-time preview, syntax-like lightweight highlight
 * - Input validation, duplicate handling, quantity cap
 *
 * Minimal external deps: lucide-react icons only. Uses native Web APIs.
 */

/* ---------- Helper / config ---------- */

const PRESET_CHARSETS = {
  letters: "abcdefghijklmnopqrstuvwxyz",
  lettersUpper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>/?\\|~",
};

const SAFE_MAX = 50000; // absolute cap on words to generate
const DEFAULT_PREVIEW_LINES = 50;

type CaseOption = "none" | "lower" | "upper" | "capitalize";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function estimateBytesForWords(words: string[]) {
  // rough utf-8 bytes
  const joined = words.join("\n");
  return new TextEncoder().encode(joined).length;
}

function simpleEntropy(word: string) {
  // rough estimate: log2(unique_chars ^ len) = len * log2(unique_chars)
  const uniq = new Set(word).size || 1;
  return +(word.length * Math.log2(Math.max(uniq, 2))).toFixed(1);
}

/* ---------- Core generation functions ---------- */

/**
 * parsePattern:
 * - Accepts a 'pattern' using simple placeholders:
 *   {l} -> random lowercase letter
 *   {u} -> random uppercase letter
 *   {d} -> random digit
 *   {s} -> random symbol
 *   {L} -> a literal (escaped) next char
 *   {word:N} -> repeat provided `seed` word truncated/padded (advanced not implemented)
 *
 * For simplicity, we accept:
 *  - raw charset (user provided)
 *  - pattern like: "prefix{d}{d}{l}" etc.
 */
function generateFromPattern(pattern: string, charsetFallback: string, idxSeed = 0) {
  // pattern tokens: text and {token}
  const tokens: Array<{ type: "text" | "token"; value: string }> = [];
  const re = /\{([^}]+)\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(pattern)) !== null) {
    if (m.index > last) tokens.push({ type: "text", value: pattern.slice(last, m.index) });
    tokens.push({ type: "token", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < pattern.length) tokens.push({ type: "text", value: pattern.slice(last) });

  // helper for random selection
  const pick = (set: string) => set.charAt(Math.floor(Math.random() * set.length)) || "";

  // deterministic-ish fallback via idxSeed for quick preview (not cryptographic)
  return tokens
    .map((t) => {
      if (t.type === "text") return t.value;
      const v = t.value;
      // support token shapes
      if (v === "l") return pick(PRESET_CHARSETS.letters);
      if (v === "u") return pick(PRESET_CHARSETS.lettersUpper);
      if (v === "d") return pick(PRESET_CHARSETS.digits);
      if (v === "s") return pick(PRESET_CHARSETS.symbols);
      if (v.startsWith("c:")) {
        // e.g., {c:abc123} -> choose from provided
        const body = v.slice(2);
        return pick(body || charsetFallback);
      }
      // fallback: return charsetFallback char
      return pick(charsetFallback);
    })
    .join("");
}

/**
 * generateWordlist:
 * - If user provided a fixed charset & length, produce permutations up to quantity (naive),
 *   but to avoid heavy combinatorics, we'll generate random combinations using RNG.
 * - If the pattern contains tokens, use pattern generator.
 * - De-duplicate if requested.
 */
function generateWordlist({
  quantity,
  pattern,
  fixedLength,
  charset,
  avoidDuplicates,
  shuffle,
  caseOption,
}: {
  quantity: number;
  pattern: string | null;
  fixedLength: number | null;
  charset: string;
  avoidDuplicates: boolean;
  shuffle: boolean;
  caseOption: CaseOption;
}) {
  const out = new Array<string>();
  const seen = new Set<string>();
  const cap = clamp(quantity, 1, SAFE_MAX);

  for (let i = 0; out.length < cap && i < cap * 5; i++) {
    let word = "";
    if (pattern && pattern.includes("{")) {
      word = generateFromPattern(pattern, charset, i);
      if (fixedLength) {
        // trim or pad using charset
        if (word.length > fixedLength) word = word.slice(0, fixedLength);
        else while (word.length < fixedLength) word += charset.charAt((i + word.length) % charset.length);
      }
    } else if (fixedLength && charset.length > 0) {
      // random from charset with fixed length
      let s = "";
      for (let k = 0; k < fixedLength; k++) s += charset.charAt(Math.floor(Math.random() * charset.length));
      word = s;
    } else {
      // fallback: simple random word length 6..12
      const len = 6 + (i % 7);
      let s = "";
      for (let k = 0; k < len; k++) s += charset.charAt(Math.floor(Math.random() * charset.length));
      word = s;
    }

    // case transform
    if (caseOption === "lower") word = word.toLowerCase();
    if (caseOption === "upper") word = word.toUpperCase();
    if (caseOption === "capitalize") word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    if (avoidDuplicates) {
      if (!seen.has(word)) {
        seen.add(word);
        out.push(word);
      } else {
        // continue generating more attempts
      }
    } else {
      out.push(word);
    }
  }

  // if shuffle requested
  if (shuffle) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  }

  return out.slice(0, cap);
}

/* ---------- UI Component ---------- */

export default function WordlistGenerator(): JSX.Element {
  // form state
  const [charset, setCharset] = useState<string>(PRESET_CHARSETS.letters + PRESET_CHARSETS.digits);
  const [fixedLength, setFixedLength] = useState<number | null>(8);
  const [quantity, setQuantity] = useState<number>(200);
  const [pattern, setPattern] = useState<string>("{l}{l}{l}{d}{d}{d}"); // default helpful pattern
  const [avoidDuplicates, setAvoidDuplicates] = useState<boolean>(true);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [caseOption, setCaseOption] = useState<CaseOption>("none");
  const [previewLines, setPreviewLines] = useState<number>(DEFAULT_PREVIEW_LINES);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // quick stats
  const stats = useMemo(() => {
    const words = lastGenerated ?? [];
    return {
      count: words.length,
      bytes: estimateBytesForWords(words),
      avgEntropy: words.length ? +(words.reduce((s, w) => s + simpleEntropy(w), 0) / words.length).toFixed(1) : 0,
    };
  }, [lastGenerated]);

  /* ---------- Validation ---------- */
  function validateInputs() {
    setError(null);
    if (!charset || charset.trim().length === 0) {
      setError("Character set is empty. Use presets or supply custom characters.");
      return false;
    }
    if (quantity < 1) {
      setError("Quantity should be at least 1.");
      return false;
    }
    if (quantity > SAFE_MAX) {
      setError(`Quantity capped to ${SAFE_MAX} to avoid browser overload.`);
      setQuantity(SAFE_MAX);
      return false;
    }
    if (fixedLength !== null && fixedLength <= 0) {
      setError("Length must be a positive number.");
      return false;
    }
    // basic pattern sanity: braces balanced
    const opens = (pattern.match(/\{/g) || []).length;
    const closes = (pattern.match(/\}/g) || []).length;
    if (opens !== closes) {
      setError("Pattern braces mismatch. Example pattern: {l}{l}{d}{d}");
      return false;
    }
    return true;
  }

  /* ---------- Actions ---------- */

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault?.();
    setError(null);
    if (!validateInputs()) return;
    setIsGenerating(true);

    // lightweight generation - chunked to let UI breathe for large sets
    const chunk = 1000;
    const total = clamp(quantity, 1, SAFE_MAX);
    const out: string[] = [];
    for (let start = 0; start < total; start += chunk) {
      const q = Math.min(chunk, total - start);
      const piece = generateWordlist({
        quantity: q,
        pattern: pattern || null,
        fixedLength,
        charset,
        avoidDuplicates,
        shuffle,
        caseOption,
      });
      out.push(...piece);
      // small yield to UI thread
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 0));
    }

    setLastGenerated(out);
    setIsGenerating(false);
    // scroll preview into view on mobile
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleCopyAll() {
    const text = (lastGenerated ?? []).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      // small visual confirmation (could be toast)
      setError(null);
      alert("Copied to clipboard ✓");
    } catch {
      setError("Copy failed — your browser may restrict clipboard access.");
    }
  }

  function downloadBlob(filename: string, content: string, mime = "text/plain;charset=utf-8") {
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

  function exportAsTxt() {
    const content = (lastGenerated ?? []).join("\n");
    downloadBlob("wordlist.txt", content, "text/plain;charset=utf-8");
  }

  function exportAsMd() {
    const content = ["# Wordlist export", "", ...((lastGenerated ?? []).map((w) => `- \`${w}\``))].join("\n");
    downloadBlob("wordlist.md", content, "text/markdown;charset=utf-8");
  }

  function printAsPdf() {
    // open a new window with preformatted content and call print
    const content = (lastGenerated ?? []).join("\n");
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      setError("Popup blocked. Allow popups for PDF export.");
      return;
    }
    const html = `
      <html>
        <head>
          <title>Wordlist Export</title>
          <style>
            body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace; padding: 20px; }
            pre { white-space: pre-wrap; word-break: break-word; font-size: 11px; }
            h1 { font-family: system-ui, sans-serif; }
          </style>
        </head>
        <body>
          <h1>Wordlist Export</h1>
          <pre>${escapeHtml(content)}</pre>
        </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 300);
  }

  async function shareWordlist() {
    const content = (lastGenerated ?? []).join("\n");
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Wordlist from SecuTools",
          text: content.slice(0, 10000), // limit
        });
      } catch {
        // user canceled or share failed
      }
    } else {
      // fallback: download or copy
      try {
        await navigator.clipboard.writeText(content);
        alert("Share unavailable — wordlist copied to clipboard.");
      } catch {
        setError("Share unavailable and clipboard write failed.");
      }
    }
  }

  /* ---------- Small helpers for UI ---------- */

  function applyPreset(preset: keyof typeof PRESET_CHARSETS) {
    setCharset((prev) => {
      const next = PRESET_CHARSETS[preset] + (prev.includes(PRESET_CHARSETS.digits) ? PRESET_CHARSETS.digits : "");
      return next;
    });
  }

  function quickExample(patternExpr: string) {
    setPattern(patternExpr);
    // keep length null to use pattern actual size
    setFixedLength(null);
  }

  // escape for printing
  function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
  }

  /* ---------- Lightweight "syntax" highlight in preview ---------- */

  function highlightLine(line: string) {
    // very small highlighting: digits + symbols + letters
    // Wrap digits and symbols with span classes
    const escaped = escapeHtml(line);
    return escaped
      .replace(/(\d+)/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>')
      .replace(/([!@#$%^&*()_\-=\+\[\]{};:,.<>\/?\\|~]+)/g, '<span class="text-rose-600 dark:text-rose-400">$1</span>');
  }

  /* ---------- Render UI ---------- */

  return (
    <section ref={containerRef} className="w-full max-w-5xl mx-auto p-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Wordlist Generator</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Generate custom password/wordlists for learning and testing. Use patterns, preset sets, or custom
            characters — copy or export results quickly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50"
            aria-label="Copy all"
            title="Copy all lines"
            disabled={!lastGenerated || lastGenerated.length === 0}
          >
            <Copy className="w-4 h-4" /> Copy
          </button>

          <div className="relative inline-flex">
            <button
              onClick={exportAsTxt}
              className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50"
              aria-label="Export as text"
              title="Export as .txt"
              disabled={!lastGenerated || lastGenerated.length === 0}
            >
              <Download className="w-4 h-4" /> TXT
            </button>
            <button
              onClick={exportAsMd}
              className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50 ml-1"
              aria-label="Export as markdown"
              title="Export as .md"
              disabled={!lastGenerated || lastGenerated.length === 0}
            >
              <FileText className="w-4 h-4" /> MD
            </button>
            <button
              onClick={printAsPdf}
              className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50 ml-1"
              aria-label="Export as PDF"
              title="Export as PDF (via print)"
              disabled={!lastGenerated || lastGenerated.length === 0}
            >
              <ArrowDownCircle className="w-4 h-4" /> PDF
            </button>
          </div>

          <button
            onClick={shareWordlist}
            className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50 ml-2"
            aria-label="Share"
            title="Share"
            disabled={!lastGenerated || lastGenerated.length === 0}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </header>

      <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Controls */}
        <div className="md:col-span-1 space-y-3">
          <div className="rounded-lg border p-3 bg-white dark:bg-slate-800">
            <label className="text-xs font-medium">Character set (editable)</label>
            <input
              value={charset}
              onChange={(e) => setCharset(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded text-sm bg-transparent"
              aria-label="Character set"
            />
            <div className="mt-2 flex gap-2 flex-wrap">
              <button type="button" onClick={() => setCharset(PRESET_CHARSETS.letters)} className="text-xs px-2 py-1 rounded border">
                letters
              </button>
              <button type="button" onClick={() => setCharset(PRESET_CHARSETS.lettersUpper)} className="text-xs px-2 py-1 rounded border">
                LETTERS
              </button>
              <button type="button" onClick={() => setCharset(PRESET_CHARSETS.digits)} className="text-xs px-2 py-1 rounded border">
                digits
              </button>
              <button type="button" onClick={() => setCharset(PRESET_CHARSETS.symbols)} className="text-xs px-2 py-1 rounded border">
                symbols
              </button>
              <button type="button" onClick={() => setCharset(PRESET_CHARSETS.letters + PRESET_CHARSETS.digits)} className="text-xs px-2 py-1 rounded border">
                letters+digits
              </button>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-white dark:bg-slate-800">
            <label className="text-xs font-medium">Pattern (optional)</label>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. {l}{l}{d}{d}{d} or leave empty"
              className="w-full mt-2 px-3 py-2 border rounded text-sm bg-transparent"
              aria-label="Pattern"
            />
            <div className="mt-2 flex gap-2 flex-wrap text-xs">
              <button type="button" onClick={() => quickExample("{l}{l}{l}{d}{d}{d}")} className="px-2 py-1 rounded border">
                aaa111
              </button>
              <button type="button" onClick={() => quickExample("{l}{d}{d}{d}{s}")} className="px-2 py-1 rounded border">
                a111!
              </button>
              <button type="button" onClick={() => quickExample("pass{d}{d}")} className="px-2 py-1 rounded border">
                pass##
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">Tokens: {`{l} l-case {u} U-case {d} digit {s} symbol {c:xyz}`}</div>
          </div>

          <div className="rounded-lg border p-3 bg-white dark:bg-slate-800 space-y-2">
            <label className="text-xs font-medium">Length</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fixedLength ?? ""}
                onChange={(e) => setFixedLength(e.target.value ? Number(e.target.value) : null)}
                className="w-24 px-2 py-1 border rounded text-sm bg-transparent"
                aria-label="Fixed length"
                placeholder="auto"
                min={1}
              />
              <div className="text-xs text-slate-500">leave empty to use pattern or variable lengths</div>
            </div>

            <label className="text-xs font-medium mt-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(clamp(Number(e.target.value || 0), 1, SAFE_MAX))}
              min={1}
              max={SAFE_MAX}
              className="w-full px-2 py-1 border rounded text-sm bg-transparent"
              aria-label="Quantity"
            />
            <div className="text-xs text-slate-500">Max allowed: {SAFE_MAX.toLocaleString()}</div>

            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs inline-flex items-center gap-2">
                <input type="checkbox" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} />
                Avoid duplicates
              </label>
              <label className="text-xs inline-flex items-center gap-2">
                <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
                Shuffle
              </label>
            </div>

            <div className="mt-2">
              <label className="text-xs font-medium">Case</label>
              <select value={caseOption} onChange={(e) => setCaseOption(e.target.value as CaseOption)} className="w-full px-2 py-1 border rounded mt-1">
                <option value="none">None</option>
                <option value="lower">lowercase</option>
                <option value="upper">UPPERCASE</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white"
                disabled={isGenerating}
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Generate
              </button>

              <button
                type="button"
                onClick={() => {
                  // quick clear preview
                  setLastGenerated(null);
                  setError(null);
                }}
                className="px-3 py-2 rounded border"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="md:col-span-2 space-y-3">
          <div className="rounded-lg border bg-white dark:bg-slate-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">Preview</div>
                <div className="text-xs text-slate-500">real-time snapshot (first {previewLines} lines)</div>
                {error && (
                  <div className="flex items-center gap-1 text-rose-600 text-xs ml-3">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500">Lines</div>
                <input
                  type="number"
                  value={previewLines}
                  onChange={(e) => setPreviewLines(clamp(Number(e.target.value || 0), 1, 1000))}
                  className="w-20 px-2 py-1 border rounded text-sm bg-transparent"
                />
                <button
                  type="button"
                  className="px-2 py-1 rounded border text-xs"
                  onClick={() => {
                    // quick regenerate small preview without setting lastGenerated
                    const small = generateWordlist({
                      quantity: clamp(previewLines, 1, 200),
                      pattern: pattern || null,
                      fixedLength,
                      charset,
                      avoidDuplicates,
                      shuffle,
                      caseOption,
                    });
                    setLastGenerated(small);
                  }}
                >
                  Quick preview
                </button>
              </div>
            </div>

            {/* preview box */}
            <div className="overflow-auto border rounded bg-slate-50 dark:bg-slate-900 p-2" style={{ maxHeight: 420 }}>
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {(lastGenerated ?? []).slice(0, previewLines).map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="text-slate-400 dark:text-slate-500 w-12 text-right select-none">{i + 1}</div>
                    <div
                      className="flex-1"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
                    />
                  </div>
                ))}

                {(!lastGenerated || lastGenerated.length === 0) && (
                  <div className="text-sm text-slate-500">No generated content yet — click Generate or use Quick preview.</div>
                )}
              </pre>
            </div>

            {/* stats + small actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <div>Count: <strong>{stats.count}</strong></div>
                <div>Avg entropy: <strong>{stats.avgEntropy}</strong></div>
                <div>Size: <strong>{(stats.bytes / 1024).toFixed(2)} KB</strong></div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-2 py-1 rounded border text-xs"
                  disabled={!lastGenerated || lastGenerated.length === 0}
                >
                  Copy all
                </button>
                <button
                  type="button"
                  onClick={exportAsTxt}
                  className="px-2 py-1 rounded border text-xs"
                  disabled={!lastGenerated || lastGenerated.length === 0}
                >
                  Download .txt
                </button>
                <button
                  type="button"
                  onClick={exportAsMd}
                  className="px-2 py-1 rounded border text-xs"
                  disabled={!lastGenerated || lastGenerated.length === 0}
                >
                  Download .md
                </button>
                <button
                  type="button"
                  onClick={printAsPdf}
                  className="px-2 py-1 rounded border text-xs"
                  disabled={!lastGenerated || lastGenerated.length === 0}
                >
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={shareWordlist}
                  className="px-2 py-1 rounded border text-xs"
                  disabled={!lastGenerated || lastGenerated.length === 0}
                >
                  <Share2 className="w-4 h-4 inline" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* short help / accessibility notes */}
          <div className="rounded-lg border p-3 bg-white dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
            <strong>Quick start:</strong> choose a charset or pattern, set length and quantity, then click <em>Generate</em>. Use Copy / Download to export. On mobile, use Share to copy the output. Avoid very large quantities to keep performance smooth.
          </div>
        </div>
      </form>
    </section>
  );
}
