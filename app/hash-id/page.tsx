"use client";

import React, { useMemo, useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, FileText, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Hash Identifier (client-only)
 * - Detect hash types from pasted text or single hash
 * - Show confidence, characteristics, suggestions
 * - One-click copy / export (TXT, MD, JSON) / share
 * - Real-time preview + syntax-like highlighting
 * - Lightweight, accessible, responsive
 */

/* ---------- detection rules ---------- */
/* Each rule: name, regex to match (full), allowed char set (for quick check), description */
const HASH_RULES: { name: string; regex: RegExp; desc: string; example?: string }[] = [
  { name: "MD5", regex: /^[a-f0-9]{32}$/i, desc: "128-bit MD5 hex (32 hex chars)", example: "5d41402abc4b2a76b9719d911017c592" },
  { name: "SHA-1", regex: /^[a-f0-9]{40}$/i, desc: "160-bit SHA-1 hex (40 hex chars)", example: "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12" },
  { name: "SHA-256", regex: /^[a-f0-9]{64}$/i, desc: "256-bit SHA-256 hex (64 hex chars)", example: "e3b0c44298fc1c149afbf4c8996fb924... (64 hex)" },
  { name: "SHA-384", regex: /^[a-f0-9]{96}$/i, desc: "384-bit SHA-384 hex (96 hex chars)" },
  { name: "SHA-512", regex: /^[a-f0-9]{128}$/i, desc: "512-bit SHA-512 hex (128 hex chars)" },
  { name: "NTLM", regex: /^[a-f0-9]{32}$/i, desc: "NTLM (looks like MD5 hex) — context matters" },
  { name: "CRC32", regex: /^[a-f0-9]{8}$/i, desc: "32-bit CRC hex (8 hex chars)" },
  { name: "bcrypt", regex: /^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/, desc: "bcrypt (modular crypt format)", example: "$2b$12$..." },
  { name: "argon2", regex: /^\$argon2(id|i|d)\$v=\d+\$m=\d+,t=\d+,p=\d+\$.+$/, desc: "Argon2 encoded string (modular format)" },
  { name: "base64", regex: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/, desc: "Base64 (may be binary data or encoded hash)", example: "SGVsbG8=" },
  // add more rules as needed
];

/* utility: find all candidate tokens in text */
function extractTokens(text: string): string[] {
  // split on whitespace and punctuation, keep possible tokens
  const tokens = text.split(/[\s,;:"'<>()\[\]{}|\\]+/).filter(Boolean);
  // filter tokens length between 6 and 200 to avoid noise
  return tokens.filter((t) => t.length >= 6 && t.length <= 512);
}

/* detection result */
type Detection = {
  token: string;
  matches: { name: string; desc: string }[];
  confidence: number; // 0-100
  notes?: string[];
};

function detectHash(token: string): Detection {
  const matches = HASH_RULES.filter((r) => r.regex.test(token)).map((r) => ({ name: r.name, desc: r.desc }));
  // heuristics for confidence:
  // exact regex match -> high confidence; ambiguous (same length) -> lower
  let confidence = 0;
  let notes: string[] = [];

  if (matches.length === 1) confidence = 95;
  else if (matches.length > 1) {
    confidence = 70 - (matches.length - 1) * 10;
    notes.push("Multiple possible matches — check context (e.g., NTLM vs MD5).");
  } else {
    // try hex-length heuristic
    if (/^[a-f0-9]+$/i.test(token)) {
      const L = token.length;
      if (L === 32) {
        matches.push({ name: "MD5-like", desc: "32 hex chars — could be MD5 or NTLM" });
        confidence = 60;
      } else if (L === 40) {
        matches.push({ name: "SHA-1-like", desc: "40 hex chars — likely SHA-1" });
        confidence = 70;
      } else if (L === 64) {
        matches.push({ name: "SHA-256-like", desc: "64 hex chars — likely SHA-256" });
        confidence = 80;
      } else {
        matches.push({ name: `${L}-hex`, desc: "Hex of unusual length" });
        confidence = 40;
      }
    } else if (/^[A-Za-z0-9+\/=]+$/.test(token) && token.length % 4 === 0) {
      matches.push({ name: "Base64-like", desc: "Looks like Base64" });
      confidence = 50;
    } else {
      confidence = 15;
      notes.push("No strong pattern detected — could be partial or salted value.");
    }
  }

  // extra notes for salted or PBKDF context
  if (token.includes("$") && /argon2|bcrypt/i.test(token)) {
    notes.push("Looks like an adaptive hash (bcrypt/argon2).");
  }

  return { token, matches, confidence, notes };
}

/* small helpers */
async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

/* export helpers */
function download(content: string, name: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* print-to-pdf via new window */
function printAsPDF(title: string, bodyHtml: string) {
  const html = `
  <html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style>body{font-family:system-ui,Arial;color:#0f172a;padding:20px}pre{background:#f8fafc;padding:12px;border-radius:6px;overflow:auto}</style>
  </head><body><h1>${title}</h1>${bodyHtml}</body></html>`;
  const w = window.open("", "_blank", "noopener");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 300);
  return true;
}

/* ---------- Component ---------- */
export default function HashIdentifierPage() {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // extract tokens and run detection
  const detections = useMemo(() => {
    const tokens = extractTokens(text);
    const dets = tokens.map((t) => detectHash(t));
    return dets;
  }, [text]);

  const primary = useMemo(() => {
    if (!detections.length) return null;
    // choose the detection with highest confidence
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    return sorted[0];
  }, [detections]);

  function handleCopyToken(tok: string) {
    copyText(tok).then(() => setMessage("Copied to clipboard"));
    setTimeout(() => setMessage(null), 1500);
  }

  function exportResult(kind: "txt" | "md" | "json") {
    const payload = { input: text, detections };
    if (kind === "json") {
      download(JSON.stringify(payload, null, 2), "hash-identify.json", "application/json");
    } else if (kind === "md") {
      const md = `# Hash Identify Report\n\n**Input**:\n\n\`\`\`\n${text}\n\`\`\`\n\n## Detections\n\n${detections
        .map(
          (d) =>
            `- Token: \`${d.token}\`\n  - Matches: ${d.matches.map((m) => m.name).join(", ")}\n  - Confidence: ${d.confidence}%\n  ${d.notes?.length ? `  - Notes: ${d.notes.join("; ")}` : ""}`
        )
        .join("\n\n")}`;
      download(md, "hash-identify.md", "text/markdown");
    } else {
      const txt =
        `Hash Identify Report\n\nInput:\n${text}\n\nDetections:\n` +
        detections
          .map((d) => `Token: ${d.token}\nMatches: ${d.matches.map((m) => m.name).join(", ")}\nConfidence: ${d.confidence}%\nNotes: ${d.notes?.join("; ") || "-"}\n`)
          .join("\n");
      download(txt, "hash-identify.txt");
    }
    setMessage("Export started");
    setTimeout(() => setMessage(null), 1500);
  }

  function handleShare() {
    const summary = primary
      ? `${primary.token} — ${primary.matches.map((m) => m.name).join(", ")} (${primary.confidence}%)`
      : "No detection";
    const textShare = `Hash ID Report\nInput: ${text}\nTop: ${summary}`;
    if ((navigator as any).share) {
      (navigator as any)
        .share({ title: "Hash Identify", text: textShare })
        .catch(() => {
          copyText(textShare);
          setMessage("Share not available — summary copied");
          setTimeout(() => setMessage(null), 1500);
        });
    } else {
      copyText(textShare);
      setMessage("Summary copied to clipboard");
      setTimeout(() => setMessage(null), 1500);
    }
  }

  function handleClear() {
    setText("");
    setSelected(null);
  }

  /* quick samples */
  const samples = [
    { label: "MD5", value: "5d41402abc4b2a76b9719d911017c592" },
    { label: "SHA-1", value: "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12" },
    { label: "SHA-256", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e..." },
    { label: "bcrypt", value: "$2b$12$eImiTXuWVxfM37uY4JANjQ==" },
  ];

  return (
    <div className="space-y-8">
      <Section title="Hash Identifier" subtitle="Detect probable hash algorithms from pasted text or single hash">
        <p className="text-sm text-slate-600 max-w-2xl">
          Paste a hash or logs containing hashes. The tool will try to identify probable hash types (MD5, SHA-1, SHA-256, bcrypt, Argon2, etc.), show a confidence score, and give suggestions.
        </p>

        {/* Input area */}
        <div className="mt-4 grid gap-3">
          <label className="sr-only" htmlFor="hash-input">Hash input</label>
          <textarea
            id="hash-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste hash or logs here (supports multiple tokens)"
            className="w-full min-h-[120px] border rounded p-3 font-mono bg-white text-sm"
            aria-label="Hash input"
          />

          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={() => handleClear()} className="px-3 py-1 border rounded text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Clear
            </button>

            <div className="flex gap-2 ml-auto">
              <button onClick={() => exportResult("txt")} className="px-3 py-1 border rounded text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> TXT</button>
              <button onClick={() => exportResult("md")} className="px-3 py-1 border rounded text-sm flex items-center gap-2"><Download className="w-4 h-4" /> MD</button>
              <button onClick={() => exportResult("json")} className="px-3 py-1 border rounded text-sm flex items-center gap-2"><Download className="w-4 h-4" /> JSON</button>
              <button onClick={handleShare} className="px-3 py-1 border rounded text-sm flex items-center gap-2"><Share2 className="w-4 h-4" /> Share</button>
            </div>
          </div>

          {/* quick samples */}
          <div className="flex gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Samples:</span>
              {samples.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setText(s.value)}
                  className="px-2 py-1 border rounded bg-slate-50 text-xs"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results / preview */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* Left: summary */}
          <div className="md:col-span-1 bg-white border rounded p-3">
            <div className="flex items-center gap-2">
              <div className="font-semibold">Top Detection</div>
              {primary ? (
                primary.confidence >= 75 ? (
                  <div className="ml-auto text-green-600 inline-flex items-center gap-1 text-sm"><CheckCircle className="w-4 h-4" /> {primary.confidence}%</div>
                ) : (
                  <div className="ml-auto text-amber-600 inline-flex items-center gap-1 text-sm"><AlertTriangle className="w-4 h-4" /> {primary.confidence}%</div>
                )
              ) : (
                <div className="ml-auto text-slate-500 text-sm">No candidates</div>
              )}
            </div>

            <div className="mt-3 text-sm">
              {primary ? (
                <>
                  <div className="font-medium">Token</div>
                  <div className="font-mono break-words mt-1 text-xs bg-slate-50 border rounded p-2">{primary.token}</div>

                  <div className="mt-3">
                    <div className="font-medium">Possible types</div>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                      {primary.matches.map((m) => (
                        <li key={m.name}><span className="font-medium">{m.name}</span> — <span className="text-slate-600">{m.desc}</span></li>
                      ))}
                    </ul>
                  </div>

                  {primary.notes?.length ? (
                    <div className="mt-3 text-xs text-slate-500">
                      <div className="font-medium">Notes</div>
                      <ul className="list-disc pl-5">
                        {primary.notes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleCopyToken(primary.token)} className="px-2 py-1 border rounded text-sm flex items-center gap-1"><Copy className="w-4 h-4" /> Copy</button>
                    <button onClick={() => printAsPDF("Hash Identify", `<pre>${escapeHtml(primary.token)}</pre>`)} className="px-2 py-1 border rounded text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Print</button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500">No token selected. Paste a hash or sample above to detect.</div>
              )}
            </div>
          </div>

          {/* Middle: candidate list */}
          <div className="md:col-span-2 bg-white border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">All Detections ({detections.length})</div>
              <div className="text-xs text-slate-500">Real-time</div>
            </div>

            <div className="mt-3 space-y-2">
              {detections.length === 0 ? (
                <div className="text-sm text-slate-400">No tokens detected. Try pasting a hash or log line.</div>
              ) : (
                detections.map((d) => (
                  <div key={d.token} className={`p-2 border rounded flex items-center gap-3 ${selected===d.token ? "bg-slate-50" : ""}`}>
                    <div className="flex-1">
                      <div className="font-mono text-xs break-words">{d.token}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Matches: {d.matches.map(m=>m.name).join(", ") || "—"} • Confidence: {d.confidence}%
                      </div>
                      {d.notes?.length ? <div className="text-xs text-amber-600 mt-1">{d.notes.join("; ")}</div> : null}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-1">
                        <button onClick={()=>{ setSelected(d.token); handleCopyToken(d.token); }} className="px-2 py-1 border rounded text-xs">Copy</button>
                        <button onClick={()=>{ setSelected(d.token); setMessage(`Selected ${d.token}`); setTimeout(()=>setMessage(null),1200); }} className="px-2 py-1 border rounded text-xs">Select</button>
                      </div>
                      <div className="text-xs text-slate-400">{d.token.length} chars</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right (below on small): tips */}
          <div className="md:col-span-3">
            <div className="mt-3 bg-white border rounded p-3 text-sm">
              <div className="font-medium">Quick Tips</div>
              <ul className="list-disc pl-5 mt-2 text-slate-600">
                <li>Context matters — identical hex lengths can map to multiple algorithms (MD5 vs NTLM).</li>
                <li>If a token contains `$` with parameters, it may be bcrypt/argon2/other adaptive hash.</li>
                <li>Base64 tokens can encode binary hashes — decode first if unsure.</li>
                <li>For suspicious hashes, try searching VirusTotal or threat intel sources (requires API keys).</li>
              </ul>
              <div className="mt-3 text-xs text-slate-500">All detection runs locally in your browser. No data is sent to our servers.</div>
            </div>
          </div>
        </div>

        {/* small ephemeral message */}
        {message && <div className="mt-2 text-sm text-green-600">{message}</div>}
      </Section>
    </div>
  );
}

/* ---------- small util to escape HTML for print ---------- */
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
