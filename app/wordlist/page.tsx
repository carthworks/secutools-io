// File: components/WordlistGenerator.tsx
"use client";

import React, { useMemo, useState, useRef } from "react";
import Section from "@/components/Section";
import {
  Copy,
  Download,
  Share2,
  FileText,
  RefreshCw,
  Check,
  AlertTriangle,
  ArrowDownCircle,
  Sparkles,
  Hash,
  Type,
  Key,
  Shuffle as ShuffleIcon,
  CheckCircle2,
  XCircle,
  BarChart3,
  Zap,
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    showToast(`Generated ${out.length.toLocaleString()} words successfully!`);
    // scroll preview into view on mobile
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleCopyAll() {
    const text = (lastGenerated ?? []).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setError(null);
      showToast("Wordlist copied to clipboard!");
    } catch {
      showToast("Copy failed — your browser may restrict clipboard access.", "error");
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
    showToast("Exported as TXT file!");
  }

  function exportAsMd() {
    const content = ["# Wordlist export", "", ...((lastGenerated ?? []).map((w) => `- \`${w}\``))].join("\n");
    downloadBlob("wordlist.md", content, "text/markdown;charset=utf-8");
    showToast("Exported as Markdown file!");
  }

  function printAsPdf() {
    // open a new window with preformatted content and call print
    const content = (lastGenerated ?? []).join("\n");
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      showToast("Popup blocked. Allow popups for PDF export.", "error");
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
        showToast("Shared successfully!");
      } catch {
        // user canceled or share failed
      }
    } else {
      // fallback: download or copy
      try {
        await navigator.clipboard.writeText(content);
        showToast("Share unavailable — wordlist copied to clipboard!");
      } catch {
        showToast("Share unavailable and clipboard write failed.", "error");
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
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <Section
        title="Wordlist Generator"
        subtitle="Generate custom password/wordlists for penetration testing and security research"
      >
        {/* Stats Dashboard */}
        {lastGenerated && lastGenerated.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Count</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.count.toLocaleString()}</div>
              <div className="text-xs text-slate-600 mt-1">words generated</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Entropy</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.avgEntropy}</div>
              <div className="text-xs text-slate-600 mt-1">bits (average)</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Size</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {(stats.bytes / 1024).toFixed(1)} KB
              </div>
              <div className="text-xs text-slate-600 mt-1">total file size</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-slate-700">Quality</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {avoidDuplicates ? "High" : "Standard"}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {avoidDuplicates ? "no duplicates" : "may have duplicates"}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Character Set */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-5 h-5 text-indigo-600" />
                <label className="text-sm font-semibold text-slate-900">Character Set</label>
              </div>
              <input
                value={charset}
                onChange={(e) => setCharset(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                aria-label="Character set"
                placeholder="Enter custom characters"
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCharset(PRESET_CHARSETS.letters)}
                  className="text-xs px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all font-medium"
                >
                  abc
                </button>
                <button
                  type="button"
                  onClick={() => setCharset(PRESET_CHARSETS.lettersUpper)}
                  className="text-xs px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:border-purple-500 hover:bg-purple-50 transition-all font-medium"
                >
                  ABC
                </button>
                <button
                  type="button"
                  onClick={() => setCharset(PRESET_CHARSETS.digits)}
                  className="text-xs px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 transition-all font-medium"
                >
                  123
                </button>
                <button
                  type="button"
                  onClick={() => setCharset(PRESET_CHARSETS.symbols)}
                  className="text-xs px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 transition-all font-medium"
                >
                  !@#
                </button>
                <button
                  type="button"
                  onClick={() => setCharset(PRESET_CHARSETS.letters + PRESET_CHARSETS.digits)}
                  className="text-xs px-3 py-1.5 rounded-lg border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium"
                >
                  abc123
                </button>
              </div>
            </div>

            {/* Pattern */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-purple-600" />
                <label className="text-sm font-semibold text-slate-900">Pattern (Optional)</label>
              </div>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. {l}{l}{d}{d}{d} or leave empty"
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-mono"
                aria-label="Pattern"
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => quickExample("{l}{l}{l}{d}{d}{d}")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all font-mono"
                >
                  aaa111
                </button>
                <button
                  type="button"
                  onClick={() => quickExample("{l}{d}{d}{d}{s}")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all font-mono"
                >
                  a111!
                </button>
                <button
                  type="button"
                  onClick={() => quickExample("pass{d}{d}")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-all font-mono"
                >
                  pass##
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-2 font-mono">
                Tokens: <span className="text-blue-600">{"{l}"}</span> lowercase{" "}
                <span className="text-purple-600">{"{u}"}</span> uppercase{" "}
                <span className="text-green-600">{"{d}"}</span> digit{" "}
                <span className="text-orange-600">{"{s}"}</span> symbol
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <label className="text-sm font-semibold text-slate-900">Settings</label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Length</label>
                <input
                  type="number"
                  value={fixedLength ?? ""}
                  onChange={(e) => setFixedLength(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  aria-label="Fixed length"
                  placeholder="auto (from pattern)"
                  min={1}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(clamp(Number(e.target.value || 0), 1, SAFE_MAX))}
                  min={1}
                  max={SAFE_MAX}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  aria-label="Quantity"
                />
                <div className="text-xs text-slate-500 mt-1">Max: {SAFE_MAX.toLocaleString()}</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={avoidDuplicates}
                    onChange={(e) => setAvoidDuplicates(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-medium">Avoid duplicates</span>
                </label>
                <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffle}
                    onChange={(e) => setShuffle(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-medium">Shuffle results</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Case Transform</label>
                <select
                  value={caseOption}
                  onChange={(e) => setCaseOption(e.target.value as CaseOption)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                >
                  <option value="none">None</option>
                  <option value="lower">lowercase</option>
                  <option value="upper">UPPERCASE</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLastGenerated(null);
                    setError(null);
                  }}
                  className="px-4 py-3 rounded-lg border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all"
                  title="Clear results"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-red-900">Validation Error</div>
                    <div className="text-sm text-red-700 mt-1">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Box */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Live Preview</div>
                    <div className="text-xs text-slate-500">
                      Showing first {previewLines} lines
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={previewLines}
                    onChange={(e) => setPreviewLines(clamp(Number(e.target.value || 0), 1, 1000))}
                    className="w-20 px-2 py-1 border-2 border-slate-300 rounded text-sm bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    min={1}
                    max={1000}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-indigo-100 border border-indigo-300 hover:bg-indigo-200 text-indigo-700 text-xs font-medium transition-all"
                    onClick={() => {
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

              <div
                className="overflow-auto bg-slate-900 p-4"
                style={{ maxHeight: 500 }}
              >
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {(lastGenerated ?? []).slice(0, previewLines).map((line, i) => (
                    <div key={i} className="flex gap-3 hover:bg-slate-800/50 px-2 py-0.5 rounded">
                      <div className="text-slate-500 w-12 text-right select-none flex-shrink-0">
                        {i + 1}
                      </div>
                      <div
                        className="flex-1 text-green-400"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
                      />
                    </div>
                  ))}

                  {(!lastGenerated || lastGenerated.length === 0) && (
                    <div className="text-center py-12 text-slate-500">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div className="text-sm">No wordlist generated yet</div>
                      <div className="text-xs mt-1">
                        Configure settings and click Generate or Quick preview
                      </div>
                    </div>
                  )}
                </pre>
              </div>

              {/* Action Buttons */}
              {lastGenerated && lastGenerated.length > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="px-3 py-2 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy All
                  </button>
                  <button
                    type="button"
                    onClick={exportAsTxt}
                    className="px-3 py-2 bg-white border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    TXT
                  </button>
                  <button
                    type="button"
                    onClick={exportAsMd}
                    className="px-3 py-2 bg-white border-2 border-slate-300 hover:border-purple-500 hover:bg-purple-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={printAsPdf}
                    className="px-3 py-2 bg-white border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={shareWordlist}
                    className="px-3 py-2 bg-white border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700">
                  <div className="font-semibold text-slate-900 mb-2">Quick Start Guide</div>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Choose a character set or use presets (abc, 123, !@#)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Use patterns for structured words: <code className="bg-white px-1 rounded">{"{l}{l}{d}{d}"}</code> generates "ab12"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Set quantity (max {SAFE_MAX.toLocaleString()}) and enable duplicate removal for quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Export as TXT, Markdown, or PDF for use in security tools</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Section>

      <Section title="Use Cases">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl mb-2">🔐</div>
            <h4 className="font-semibold text-slate-900 mb-1">Password Testing</h4>
            <p className="text-sm text-slate-600">
              Generate custom wordlists for password strength testing and brute-force simulations
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-slate-900 mb-1">Penetration Testing</h4>
            <p className="text-sm text-slate-600">
              Create targeted wordlists based on company names, patterns, or common conventions
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-semibold text-slate-900 mb-1">Security Research</h4>
            <p className="text-sm text-slate-600">
              Build specialized dictionaries for cryptographic analysis and security research
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
