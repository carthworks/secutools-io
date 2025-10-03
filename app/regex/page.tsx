"use client";

import React, { useMemo, useRef, useState } from "react";
import { Copy, Share2, X } from "lucide-react";

/**
 * RegexTester component
 * Single-file React + Tailwind component
 * - Pattern input (with simple syntax highlighting)
 * - Flags toggles
 * - Test text area with real-time highlighted matches
 * - Quick suggestions and common patterns
 * - Copy / Export (txt / md) and Share (Web Share API) + Download
 * - Error detection with friendly messages
 * - Accessible controls and responsive layout
 */

export default function RegexTester() {
  // inputs
  const [pattern, setPattern] = useState<string>("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [testText, setTestText] = useState<string>(
    `john.doe@example.com\nattack@evil.test\nVisit https://example.com or http://10.0.0.1:8080`);
  const [lastError, setLastError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const debounceRef = useRef<number | null>(null);

  // build regex safely
  const regex = useMemo(() => {
    try {
      setLastError(null);
      const f = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join("");
      return new RegExp(pattern, f);
    } catch (err: any) {
      setLastError(err?.message ?? "Invalid pattern");
      return null;
    }
  }, [pattern, flags]);

  // compute matches
  const matches = useMemo(() => {
    if (!regex) return [];
    try {
      const out: { text: string; index: number; length: number }[] = [];
      if (!regex.global) {
        const m = regex.exec(testText);
        if (m) out.push({ text: m[0], index: m.index, length: m[0].length });
      } else {
        let m: RegExpExecArray | null;
        // reset lastIndex in case
        regex.lastIndex = 0;
        while ((m = regex.exec(testText))) {
          out.push({ text: m[0], index: m.index, length: m[0].length });
          // prevent infinite loop on empty match
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
      }
      return out;
    } catch (e) {
      console.error("Regex match error:", e);
      return [];
    }
  }, [regex, testText]);

  // highlighted preview (split into array of nodes)
  const previewNodes = useMemo(() => {
    if (!matches || matches.length === 0) return [{ text: testText }];
    const nodes: { text: string; match?: boolean }[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor) nodes.push({ text: testText.slice(cursor, m.index) });
      nodes.push({ text: testText.slice(m.index, m.index + m.length), match: true });
      cursor = m.index + m.length;
    }
    if (cursor < testText.length) nodes.push({ text: testText.slice(cursor) });
    return nodes;
  }, [matches, testText]);

  // quick copy function
  async function copyPattern() {
    try {
      await navigator.clipboard.writeText(pattern);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error(e);
    }
  }

  // export helpers
  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportText() {
    const content = `Pattern: /${pattern}/${Object.entries(flags).filter(([,v]) => v).map(([k])=>k).join("")}\n\nTest text:\n${testText}`;
    download("regex-test.txt", content);
  }

  function exportMarkdown() {
    const md = `# Regex Test\n\n**Pattern:** \`/${pattern}/${Object.entries(flags).filter(([,v]) => v).map(([k])=>k).join("")}\`\n\n**Test text**\n\n\`\`\`\n${testText}\n\`\`\`\n`;
    download("regex-test.md", md);
  }

  function exportSnippet() {
    const js = `const re = /${pattern}/${Object.entries(flags).filter(([,v]) => v).map(([k])=>k).join("")};\nconst text = ${JSON.stringify(testText)};\nconsole.log(text.match(re));`;
    download("regex-snippet.js", js);
  }

  async function share() {
    const payload = { title: "Regex Tester - SecuTools", text: `Pattern /${pattern}/`, url: location.href };
    if ((navigator as any).canShare) {
      try {
        await (navigator as any).share(payload);
        return;
      } catch (e) {
        console.error("Share failed:", e);
        alert("Sharing failed. Pattern copied to clipboard instead.");
      }
    }
    await navigator.clipboard.writeText(`Pattern: /${pattern}/\nText:\n${testText}`);
    alert("Pattern copied to clipboard (sharing not available)");
  }

  // simple syntax highlighting for pattern (metacharacters)
  function renderPatternHighlighted(p: string) {
    // escape html
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // wrap common tokens
    const tokens = esc(p)
      .replace(/(\\\\x[0-9A-Fa-f]{2})/g, "<span class='token-hex'>$1</span>")
      .replace(/(\\\\u[0-9A-Fa-f]{4})/g, "<span class='token-hex'>$1</span>")
      .replace(/(\\\\w|\\\\d|\\\\s|\\\\b|\\\\W|\\\\D|\\\\S)/g, "<span class='token-escape'>$1</span>")
      .replace(/(\[.*?\])/g, "<span class='token-class'>$1</span>")
      .replace(/(\{\d+,?\d*\}|\*|\+|\?)/g, "<span class='token-quant'>$1</span>")
      .replace(/([.^$|])/g, "<span class='token-meta'>$1</span>");
    return tokens;
  }

  return (
    <section className="max-w-4xl mx-auto p-4">
      <div className="rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-start gap-4 p-4">
          {/* left column */}
          <div className="w-full md:w-1/2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Regex Tester</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Build, test and share regex patterns — instant feedback for security work.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyPattern} title="Copy pattern" className="p-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100">
                  <Copy className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button onClick={share} title="Share" className="p-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <label htmlFor="regex-pattern-input" className="block mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">Pattern</label>
            <div className="mt-2">
              <input
                id="regex-pattern-input"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded font-mono text-sm"
                aria-label="Regex pattern"
              />

              <div className="mt-2 text-xs text-slate-500">Flags</div>
              <div className="mt-1 flex gap-2 flex-wrap">
                {(["g", "i", "m", "s", "u"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFlags((s) => ({ ...s, [f]: !s[f] }))}
                    className={`text-xs px-2 py-1 rounded border ${flags[f] ? "bg-indigo-600 text-white" : "bg-white text-slate-700"}`}
                    aria-pressed={!!flags[f]}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* syntax highlight preview for pattern */}
              <div className="mt-3 text-xs font-mono text-slate-700 dark:text-slate-200">
                <div className="px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div dangerouslySetInnerHTML={{ __html: renderPatternHighlighted(pattern) }} />
                </div>
              </div>

              {lastError && (
                <div className="mt-2 text-xs text-rose-600 flex items-center gap-2">
                  <X className="w-4 h-4" /> <span>{lastError}</span>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button onClick={exportText} className="px-3 py-2 rounded bg-slate-50 border text-sm">Export .txt</button>
                <button onClick={exportMarkdown} className="px-3 py-2 rounded bg-slate-50 border text-sm">Export .md</button>
                <button onClick={exportSnippet} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">Download snippet</button>
              </div>

              <div className="mt-3 text-xs text-slate-500">Suggestions</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {["^https?://","\\b\\w+@\\w+\\.\\w+\\b","\\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b","\\d{4}-\\d{2}-\\d{2}"]
                  .map((sug) => (
                    <button key={sug} onClick={() => setPattern(sug)} className="px-2 py-1 text-xs rounded border bg-white">{sug}</button>
                  ))}
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="w-full md:w-1/2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Test Input</div>
                <div className="text-xs text-slate-500">Type or paste sample text to see matches highlighted in real time.</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setTestText(''); }} title="Clear" className="p-2 rounded hover:bg-slate-50">Clear</button>
                <button onClick={() => { setTestText((s)=>s+"\nexample@domain.test"); }} title="Append example" className="p-2 rounded hover:bg-slate-50">Append</button>
              </div>
            </div>

            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="mt-3 w-full h-48 md:h-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-3 font-mono text-sm text-slate-800 dark:text-slate-100"
              aria-label="Test text area"
            />

            <div className="mt-3">
              <div className="text-xs text-slate-500">Preview</div>
              <div className="mt-2 p-3 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-auto text-sm font-mono leading-relaxed">
                {previewNodes.map((n, idx) => (
                  <span key={idx} className={n.match ? "bg-yellow-200 dark:bg-yellow-600/30" : ""}>
                    {n.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded p-2 bg-slate-50 dark:bg-slate-800 border">
                <div className="font-medium">Matches</div>
                <div className="text-slate-500">{matches.length}</div>
              </div>
              <div className="rounded p-2 bg-slate-50 dark:bg-slate-800 border">
                <div className="font-medium">Last index</div>
                <div className="text-slate-500">{matches.length ? matches[matches.length - 1].index : "—"}</div>
              </div>
            </div>

          </div>
        </div>

        {/* footer description + accessibility */}
        <div className="border-t px-4 py-2 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <strong>About this tool:</strong> Build and test regex patterns with instant highlighting, export and share options, and friendly error messages for quick debugging.
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDescOpen(s => !s)} className="text-xs px-2 py-1 rounded border">{descOpen ? 'Hide' : 'Quick start'}</button>
            </div>
          </div>

          {descOpen && (
            <div className="mt-2 text-xs text-slate-500">
              <ol className="list-decimal list-inside">
                <li>Type or paste a <em>pattern</em> and toggle flags (g,i,m,s,u).</li>
                <li>Enter sample text to preview highlighted matches in real-time.</li>
                <li>Copy or export your pattern and sample as text, markdown, or a small JS snippet.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* small styles for tokens (kept local) */}
      <style>{`
        .token-escape{ color: #955; font-weight:600 }
        .token-class{ color: #0a7; font-weight:600 }
        .token-quant{ color:#b55 }
        .token-meta{ color:#666 }
        .token-hex{ color:#3b82f6 }
      `}</style>
    </section>
  );
}
