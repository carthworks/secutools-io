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
          className="w-full h-32 bg-black-950 border border-black-800 rounded p-2 text-black"
        />

        {/* Method selection */}
        <div className="flex flex-wrap gap-3 items-center mt-3 text-sm">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border p-2 rounded"
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
              className="w-20 border p-1 rounded"
              placeholder="Shift"
            />
          )}

          {method === "xor" && (
            <input
              type="number"
              value={xorKey}
              onChange={(e) => setXorKey(Number(e.target.value))}
              className="w-20 border p-1 rounded"
              placeholder="Key"
            />
          )}

          <button
            onClick={transform}
            className="px-3 py-1 rounded bg-primary text-white font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> Transform
          </button>
        </div>

        {/* Output */}
        <div className="mt-4">
          <label className="text-xs text-slate-400">Output</label>
          <pre className="text-sm whitespace-pre-wrap bg-slate-900 border border-slate-700 rounded p-2 h-40 overflow-auto text-green-200">
            {output}
          </pre>

          <div className="flex gap-2 mt-2">
            <button
              onClick={copyOut}
              className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={exportTxt}
              className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={shareOut}
              className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </Section>

      <Section title="About this tool">
        <p className="text-sm text-slate-600">
          This tool helps you quickly **obfuscate or de-obfuscate strings** using
          simple transformations: ROT13, Caesar cipher, XOR, Base64, and Hex. It
          is useful for analyzing encoded payloads, reversing obfuscation in
          malware scripts, or generating quick test cases.
        </p>
        <ul className="list-disc pl-5 text-sm mt-2 text-slate-600">
          <li>🔐 Encode/decode payloads in seconds</li>
          <li>⚡ Works fully client-side (no server, no logging)</li>
          <li>📤 Copy, export, or share results instantly</li>
        </ul>
      </Section>
    </div>
  );
}
