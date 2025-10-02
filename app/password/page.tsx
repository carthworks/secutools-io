"use client";

import React, { useMemo, useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, Eye, EyeOff, RefreshCw } from "lucide-react";

/* ---------- Utilities ---------- */

function estimateEntropy(pass: string): number {
  let pool = 0;
  if (/[a-z]/.test(pass)) pool += 26;
  if (/[A-Z]/.test(pass)) pool += 26;
  if (/[0-9]/.test(pass)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pass)) pool += 32; // rough symbol set
  if (pool === 0) return 0;
  return Math.log2(pool) * pass.length;
}

const commonSample = new Set([
  "password",
  "123456",
  "123456789",
  "qwerty",
  "letmein",
  "admin",
  "welcome",
  "iloveyou",
  "111111",
  "12345678",
]);

function generatePassword(
  len: number,
  useLower = true,
  useUpper = true,
  useDigits = true,
  useSymbols = true
): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?/\\|`~";
  let alphabet = "";
  if (useLower) alphabet += lower;
  if (useUpper) alphabet += upper;
  if (useDigits) alphabet += digits;
  if (useSymbols) alphabet += symbols;
  if (!alphabet) return "";
  const array = new Uint32Array(len);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => alphabet[v % alphabet.length]).join("");
}

function copyToClipboard(text: string) {
  return navigator.clipboard?.writeText(text);
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

/* ---------- Component ---------- */

export default function PasswordToolPage() {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [len, setLen] = useState(16);
  const [opts, setOpts] = useState({
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);

  const entropy = useMemo(() => estimateEntropy(pwd), [pwd]);
  const verdict =
    entropy >= 80 ? "Very Strong" : entropy >= 60 ? "Strong" : entropy >= 40 ? "Moderate" : entropy >= 20 ? "Weak" : "Very Weak";
  const score = Math.min(100, Math.round((entropy / 100) * 100)); // normalized for bar
  const inCommon = commonSample.has(pwd);

  const suggestions = useMemo(() => {
    const s: string[] = [];
    if (pwd.length < 12) s.push("Use at least 12 characters.");
    if (!/[a-z]/.test(pwd)) s.push("Add lowercase letters.");
    if (!/[A-Z]/.test(pwd)) s.push("Add uppercase letters.");
    if (!/[0-9]/.test(pwd)) s.push("Add digits (0-9).");
    if (!/[^A-Za-z0-9]/.test(pwd)) s.push("Add symbols (e.g., !@#$%).");
    if (inCommon) s.push("Avoid common or easily guessable passwords.");
    return s;
  }, [pwd, inCommon]);

  function handleGenerate() {
    const newPwd = generatePassword(len, opts.lower, opts.upper, opts.digits, opts.symbols);
    setPwd(newPwd);
  }

  async function handleCopy() {
    try {
      await copyToClipboard(pwd || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy failed");
    }
  }

  function exportFile(type: "txt" | "md" | "json") {
    if (!pwd) return;
    if (type === "json") {
      const payload = { password: pwd, entropy: Number(entropy.toFixed(1)), verdict };
      downloadBlob(JSON.stringify(payload, null, 2), "password.json", "application/json");
      return;
    }
    if (type === "md") {
      const md = `# Generated Password\n\n\`${pwd}\`\n\n**Entropy:** ${entropy.toFixed(1)} bits\n\n**Verdict:** ${verdict}\n`;
      downloadBlob(md, "password.md", "text/markdown");
      return;
    }
    // txt
    const txt = `Password: ${pwd}\nEntropy: ${entropy.toFixed(1)} bits\nVerdict: ${verdict}\n`;
    downloadBlob(txt, "password.txt", "text/plain");
  }

  async function share() {
    const text = `Password: ${pwd}\nEntropy: ${entropy.toFixed(1)} bits — ${verdict}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Generated Password", text });
      } catch {
        // cancelled
      }
    } else {
      try {
        await copyToClipboard(text);
        alert("Share not supported — copied summary to clipboard.");
      } catch {
        alert("Copy failed");
      }
    }
  }

  function quickPreset(preset: "alpha" | "complex" | "digits" | "memorable") {
    if (preset === "memorable") {
      // simple memorable pattern (not cryptographically strong, educational only)
      setPwd("RedApple#42");
      return;
    }
    if (preset === "alpha") {
      setOpts({ lower: true, upper: true, digits: false, symbols: false });
      setLen(12);
    }
    if (preset === "complex") {
      setOpts({ lower: true, upper: true, digits: true, symbols: true });
      setLen(20);
    }
    if (preset === "digits") {
      setOpts({ lower: false, upper: false, digits: true, symbols: false });
      setLen(8);
    }
  }

  return (
    <div className="space-y-8">
      <Section title="Password Strength Checker" subtitle="Estimate entropy and generate secure passwords (client-side only)">
        <p className="text-sm text-slate-600 max-w-2xl">
          This tool runs entirely in your browser. No password data is sent to any server. Use the generator for strong,
          random passwords and the checker to understand strength and improvement suggestions.
        </p>

        {/* Checker */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Password</label>
            <div className="flex items-center gap-2">
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Enter or generate a password"
                className="flex-1 border rounded p-2 bg-white"
                aria-label="Password input"
              />
              <button onClick={() => setShow((s) => !s)} className="px-2 py-1 border rounded" aria-label="Toggle show password">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button onClick={handleCopy} className="px-3 py-1 border rounded text-sm" aria-label="Copy password">
                <Copy size={14} /> {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={() => { setPwd(''); }} className="px-3 py-1 border rounded text-sm" aria-label="Clear password">Clear</button>
            </div>

            <div className="mt-2">
              <div className="text-xs text-slate-500">Entropy: <span className="font-medium">{entropy.toFixed(1)} bits</span> — <span className="font-semibold">{verdict}</span> {inCommon && <span className="text-amber-600 font-medium"> (Common password!)</span>}</div>

              {/* strength bar */}
              <div className="mt-2 h-3 w-full bg-slate-200 rounded overflow-hidden">
                <div
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className={`h-full rounded`}
                  style={{
                    width: `${Math.max(2, score)}%`,
                    background:
                      score >= 80 ? "linear-gradient(90deg,#14b8a6,#06b6d4)" :
                        score >= 60 ? "linear-gradient(90deg,#84cc16,#f59e0b)" :
                        score >= 40 ? "linear-gradient(90deg,#f59e0b,#f97316)" :
                        "linear-gradient(90deg,#ef4444,#ef4444)",
                  }}
                />
              </div>

              {/* suggestions */}
              <div className="mt-3 text-sm">
                <div className="font-medium text-sm">Suggestions</div>
                {suggestions.length ? (
                  <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                    {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500 mt-1">Looks good — strong password.</div>
                )}
              </div>
            </div>
          </div>

          {/* Generator */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">Secure Password Generator (cryptographically random)</label>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={opts.lower} onChange={(e) => setOpts({ ...opts, lower: e.target.checked })} />
                  <span>lower</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={opts.upper} onChange={(e) => setOpts({ ...opts, upper: e.target.checked })} />
                  <span>upper</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={opts.digits} onChange={(e) => setOpts({ ...opts, digits: e.target.checked })} />
                  <span>digits</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={opts.symbols} onChange={(e) => setOpts({ ...opts, symbols: e.target.checked })} />
                  <span>symbols</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm">Length</label>
                <input
                  type="range"
                  min={4}
                  max={64}
                  value={len}
                  onChange={(e) => setLen(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="w-20 text-right text-sm font-medium">{len}</div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={handleGenerate} className="px-3 py-1 bg-primary text-black rounded font-medium">Generate</button>
                <button onClick={() => { setPwd(generatePassword(len, opts.lower, opts.upper, opts.digits, opts.symbols)); }} className="px-3 py-1 border rounded">Generate & Use</button>
                <button onClick={() => quickPreset("alpha")} className="px-3 py-1 border rounded text-sm">Alpha</button>
                <button onClick={() => quickPreset("complex")} className="px-3 py-1 border rounded text-sm">Complex</button>
                <button onClick={() => quickPreset("digits")} className="px-3 py-1 border rounded text-sm">Digits</button>
                <button onClick={() => quickPreset("memorable")} className="px-3 py-1 border rounded text-sm">Memorable</button>
                <button onClick={() => { setPwd(''); setLen(16); setOpts({lower:true,upper:true,digits:true,symbols:true}); }} className="px-3 py-1 border rounded text-sm" title="Reset">Reset</button>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleCopy} className="px-3 py-1 border rounded flex items-center gap-2"><Copy size={14} /> Copy</button>
                <button onClick={() => exportFile("txt")} className="px-3 py-1 border rounded flex items-center gap-2"><Download size={14} /> Export TXT</button>
                <button onClick={() => exportFile("md")} className="px-3 py-1 border rounded flex items-center gap-2"><Download size={14} /> Export MD</button>
                <button onClick={() => exportFile("json")} className="px-3 py-1 border rounded flex items-center gap-2"><Download size={14} /> Export JSON</button>
                <button onClick={share} className="px-3 py-1 border rounded flex items-center gap-2"><Share2 size={14} /> Share</button>
              </div>

              <div className="text-xs text-slate-500 mt-1">All generation happens in your browser — nothing is sent to a server.</div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
