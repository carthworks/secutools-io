"use client";
import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, RefreshCw } from "lucide-react";

/* --- Transformation helpers --- */
function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function caesar(str: string, shift: number): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((c.charCodeAt(0) - base + shift + 26) % 26) + base
    );
  });
}

function xorCipher(str: string, key: number): string {
  return Array.from(str)
    .map((ch) => String.fromCharCode(ch.charCodeAt(0) ^ key))
    .join("");
}

function base64Encode(str: string): string {
  return btoa(str);
}
function base64Decode(str: string): string {
  try {
    return atob(str);
  } catch {
    return "⚠ Invalid Base64 input";
  }
}

function hexEncode(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}
function hexDecode(hex: string): string {
  try {
    return hex
      .match(/.{1,2}/g)!
      .map((b) => String.fromCharCode(parseInt(b, 16)))
      .join("");
  } catch {
    return "⚠ Invalid Hex input";
  }
}

/* --- Component --- */
export default function StringObfuscatorPage() {
  const [input, setInput] = useState("Hello Security World");
  const [method, setMethod] = useState("rot13");
  const [shift, setShift] = useState(3);
  const [xorKey, setXorKey] = useState(42);
  const [output, setOutput] = useState("");

  function transform() {
    let result = "";
    switch (method) {
      case "rot13":
        result = rot13(input);
        break;
      case "caesar":
        result = caesar(input, shift);
        break;
      case "xor":
        result = xorCipher(input, xorKey);
        break;
      case "b64enc":
        result = base64Encode(input);
        break;
      case "b64dec":
        result = base64Decode(input);
        break;
      case "hexenc":
        result = hexEncode(input);
        break;
      case "hexdec":
        result = hexDecode(input);
        break;
      default:
        result = input;
    }
    setOutput(result);
  }

  function copyOut() {
    navigator.clipboard.writeText(output);
    alert("Copied ✅");
  }

  function exportTxt() {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `string-output.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function shareOut() {
    if (!navigator.share) return copyOut();
    try {
      await navigator.share({
        title: "Obfuscated String",
        text: output,
      });
    } catch {}
  }

  return (
    <div className="space-y-8">
      <Section
        title="String Obfuscator"
        subtitle="ROT13, Caesar, XOR, Base64/Hex encode/decode"
      >
        {/* Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text here..."
          className="w-full h-32 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />

        {/* Method selection */}
        <div className="flex flex-wrap gap-3 items-center mt-3 text-sm">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="rot13">ROT13</option>
            <option value="caesar">Caesar Cipher</option>
            <option value="xor">XOR Cipher</option>
            <option value="b64enc">Base64 Encode</option>
            <option value="b64dec">Base64 Decode</option>
            <option value="hexenc">Hex Encode</option>
            <option value="hexdec">Hex Decode</option>
          </select>

          {method === "caesar" && (
            <input
              type="number"
              value={shift}
              onChange={(e) => setShift(Number(e.target.value))}
              className="w-24 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              placeholder="Shift"
            />
          )}

          {method === "xor" && (
            <input
              type="number"
              value={xorKey}
              onChange={(e) => setXorKey(Number(e.target.value))}
              className="w-24 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              placeholder="Key"
            />
          )}

          <button
            onClick={transform}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 text-sm transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Transform
          </button>
        </div>

        {/* Output */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Output</label>
          <pre className="text-sm font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 h-40 overflow-auto text-slate-800 dark:text-slate-200 shadow-sm">
            {output || <span className="text-slate-400 dark:text-slate-500 font-sans text-xs">Transformed output will appear here...</span>}
          </pre>

          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              onClick={copyOut}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              onClick={exportTxt}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" /> Export TXT
            </button>
            <button
              onClick={shareOut}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </Section>

      <Section title="About this tool" subtitle="Quick encoder and obfuscator details">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          This tool helps you quickly <strong>obfuscate or de-obfuscate strings</strong> using
          simple transformations: ROT13, Caesar cipher, XOR, Base64, and Hex. It
          is useful for analyzing encoded payloads, reversing obfuscation in
          malware scripts, or generating quick test cases.
        </p>
        <ul className="list-disc pl-5 text-sm mt-3 text-slate-700 dark:text-slate-300 space-y-1">
          <li>🔐 Encode/decode payloads in seconds</li>
          <li>⚡ Works fully client-side (no server, no logging)</li>
          <li>📤 Copy, export, or share results instantly</li>
        </ul>
      </Section>
    </div>
  );
}
