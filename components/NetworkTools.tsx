"use client";

import React, { useMemo, useRef, useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2 } from "lucide-react";

/* -------------------------
   Utilities: IP / MAC helpers
   ------------------------- */

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3];
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function maskFromPrefix(prefix: number) {
  if (prefix < 0 || prefix > 32) return null;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return intToIp(mask);
}

function prefixFromMask(mask: string) {
  const i = ipToInt(mask);
  if (i === null) return null;
  // count ones
  let n = i;
  let count = 0;
  for (let j = 0; j < 32; j++) {
    if ((n & (1 << (31 - j))) !== 0) count++;
    else break;
  }
  // verify mask is contiguous ones
  const maskCheck = count === 0 ? 0 : (~0 << (32 - count)) >>> 0;
  return maskCheck === i ? count : null;
}

function calcIPv4Subnet(cidr: string) {
  const parts = cidr.split("/");
  if (parts.length !== 2) return { error: "Invalid CIDR (expect x.x.x.x/NN)" };
  const ip = parts[0];
  const prefix = Number(parts[1]);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return { error: "Invalid prefix" };
  const ipInt = ipToInt(ip);
  if (ipInt === null) return { error: "Invalid IP" };
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = ipInt & mask;
  const broadcast = network | (~mask >>> 0);
  const first = prefix >= 31 ? network : network + 1;
  const last = prefix >= 31 ? broadcast : broadcast - 1;
  const hosts = prefix >= 31 ? (prefix === 31 ? 0 : 1) : Math.pow(2, 32 - prefix) - 2;
  return {
    input: cidr,
    ip: intToIp(ipInt),
    prefix,
    netmask: intToIp(mask),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(first),
    lastHost: intToIp(last),
    totalHosts: hosts,
  };
}

/* expand range: from start..end inclusive, but cap count to avoid huge outputs */
function expandRange(start: string, end: string, max = 1024) {
  const s = ipToInt(start);
  const e = ipToInt(end);
  if (s === null || e === null) return { error: "Invalid IP(s)" };
  if (s > e) return { error: "Start must be <= end" };
  const count = e - s + 1;
  if (count > max) return { error: `Range too large (max ${max} addresses)` };
  const arr = [];
  for (let i = s; i <= e; i++) arr.push(intToIp(i >>> 0));
  return { list: arr, count };
}

/* IPv4 converter helpers */
function toBinary(n: number) {
  return n.toString(2).padStart(32, "0").replace(/(.{8})/g, "$1 ").trim();
}
function toHex(n: number) {
  return "0x" + (n >>> 0).toString(16).padStart(8, "0");
}

/* MAC helpers */
function normalizeMac(s: string) {
  const cleaned = s.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (cleaned.length !== 12) return null;
  return cleaned.match(/.{1,2}/g)!.join(":");
}
function randomMac({ multicast = false, locallyAdmin = false }: { multicast?: boolean; locallyAdmin?: boolean } = {}) {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  // set multicast/unicast bit and local/global bit in first octet
  if (multicast) bytes[0] = bytes[0] | 1; // set LSB
  else bytes[0] = bytes[0] & ~1;
  if (locallyAdmin) bytes[0] = bytes[0] | 2; // set second LSB
  else bytes[0] = bytes[0] & ~2;
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(":");
}

/* small local OUI sample for lookup (real app should use an API or larger DB) */
const SAMPLE_OUI: Record<string, string> = {
  "00:1a:2b": "Example Corp.",
  "3c:5a:b4": "NetDevices Ltd.",
  "00:0c:29": "VMware, Inc.",
  "b8:27:eb": "Raspberry Pi Foundation",
};

/* IPv6 ULA generator (fd + 40-bit global ID => /48) */
function generateUla() {
  // fd prefix + 40 random bits (5 bytes) to make /48 with subnet zero
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  // use only 5 bytes of random for global ID
  const global = Array.from(arr.slice(0, 5)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // format as fdxx:xxxx:xxxx::/48 by grouping global (40 bits) into 3 hextets (12+12+16 bits)
  // simplest: create 6 hextets: fd + g1 g2 g3...
  const hex = global.padEnd(12, "0"); // ensure 12 hex chars
  const h1 = hex.slice(0, 4);
  const h2 = hex.slice(4, 8);
  const h3 = hex.slice(8, 12);
  const prefix = `fd${h1}:${h2}:${h3}::/48`;
  // more polished: ensure colon separated lower-case groups
  return prefix;
}

/* small safe math eval using Function but restrict characters */
function safeEval(expr: string) {
  // allow digits, parentheses, + - * / % . ^ spaces, math functions names, and letters for function names
  if (!expr || /[^0-9+\-*/%^()., eEa-zA-Z_]/.test(expr)) return { error: "Expression contains invalid characters" };
  try {
    // replace ^ with ** for exponent
    const jsExpr = expr.replace(/\^/g, "**");
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${jsExpr})`);
    const val = fn();
    if (typeof val === "number" && !Number.isFinite(val)) return { error: "Result is not finite" };
    return { value: val };
  } catch (err: any) {
    return { error: String(err) };
  }
}

/* Export / copy / share helpers */
async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
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
function printHtml(title: string, bodyHtml: string) {
  const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style>body{font-family:system-ui;padding:12px;color:#0f172a}pre{white-space:pre-wrap;background:#f6f8fa;padding:10px;border-radius:6px}</style>
  </head><body>${bodyHtml}</body></html>`;
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

/* -------------------------
   React component
   ------------------------- */

export default function NetworkTools() {
  const [tab, setTab] = useState<
    | "subnet"
    | "conv"
    | "range"
    | "maclookup"
    | "macgen"
    | "ula"
    | "math"
  >("subnet");

  /* Subnet state */
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const subnetRes = useMemo(() => calcIPv4Subnet(cidr), [cidr]);

  /* Converter state */
  const [convIp, setConvIp] = useState("10.0.0.1");
  const convInt = useMemo(() => {
    const i = ipToInt(convIp);
    if (i === null) return null;
    return { int: i >>> 0, bin: toBinary(i), hex: toHex(i) };
  }, [convIp]);

  /* Range state */
  const [rangeStart, setRangeStart] = useState("192.168.1.1");
  const [rangeEnd, setRangeEnd] = useState("192.168.1.10");
  const [rangeMax] = useState(1024);
  const rangeRes = useMemo(() => expandRange(rangeStart, rangeEnd, rangeMax), [rangeStart, rangeEnd, rangeMax]);

  /* MAC lookup/generate */
  const [macQuery, setMacQuery] = useState("b8:27:eb:aa:bb:cc");
  const macNormalized = useMemo(() => normalizeMac(macQuery), [macQuery]);
  const macVendor = useMemo(() => {
    if (!macNormalized) return null;
    const oui = macNormalized.split(":").slice(0, 3).join(":");
    return SAMPLE_OUI[oui] || "Unknown (use OUI DB or API)";
  }, [macNormalized]);

  const [macOpts, setMacOpts] = useState({ multicast: false, local: false });
  const generatedMac = useMemo(() => randomMac({ multicast: macOpts.multicast, locallyAdmin: macOpts.local }), [macOpts]);

  /* ULA */
  const [ulaRes, setUlaRes] = useState<string | null>(null);

  /* Math */
  const [expr, setExpr] = useState("1024 * 8 / 1024");
  const mathRes = useMemo(() => safeEval(expr), [expr]);

  /* small UI helpers */
  async function handleCopyResult(text: string, label = "Copied") {
    await copyText(text);
    alert(label);
  }

  function exportResult(name: string, content: string, kind: "txt" | "json" | "md" = "txt") {
    const mime = kind === "json" ? "application/json" : kind === "md" ? "text/markdown" : "text/plain";
    downloadBlob(content, `${name}.${kind}`, mime);
  }

  async function shareText(text: string) {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Network Tools", text });
      } catch {}
    } else {
      await copyText(text);
      alert("Share not available — copied to clipboard.");
    }
  }

  return (
    <div className="space-y-8">
      <Section title="Network Tools" subtitle="IPv4/IPv6 utilities, MAC helpers, and quick math — client-side">
        <p className="text-sm text-slate-600">
          Handy network utilities for students and SOC engineers. All processing runs in your browser — no data is uploaded.
        </p>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {[
            ["subnet", "IPv4 Subnet"],
            ["conv", "IPv4 Converter"],
            ["range", "Range Expander"],
            ["maclookup", "MAC Lookup"],
            ["macgen", "MAC Generator"],
            ["ula", "IPv6 ULA"],
            ["math", "Math"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                tab === k 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-4 text-slate-800 dark:text-slate-200">
          {tab === "subnet" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">CIDR</label>
                <input value={cidr} onChange={(e) => setCidr(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                <div className="mt-3 space-y-2 text-sm">
                  {subnetRes.error ? (
                    <div className="text-rose-600 dark:text-rose-400">Error: {String((subnetRes as any).error)}</div>
                  ) : (
                    <>
                      <div><strong>Network:</strong> {subnetRes.network}</div>
                      <div><strong>Broadcast:</strong> {subnetRes.broadcast}</div>
                      <div><strong>First host:</strong> {subnetRes.firstHost}</div>
                      <div><strong>Last host:</strong> {subnetRes.lastHost}</div>
                      <div><strong>Netmask:</strong> {subnetRes.netmask}</div>
                      <div><strong>Total hosts:</strong> {subnetRes.totalHosts}</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleCopyResult(JSON.stringify(subnetRes, null, 2), "Copied subnet JSON")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-2 text-sm"><Copy className="w-4 h-4" /> Copy</button>
                  <button onClick={() => exportResult("subnet", JSON.stringify(subnetRes, null, 2), "json")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export JSON</button>
                  <button onClick={() => shareText(JSON.stringify(subnetRes, null, 2))} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg flex items-center gap-2 text-sm"><Share2 className="w-4 h-4" /> Share</button>
                  <button onClick={() => printHtml("Subnet Result", `<pre>${JSON.stringify(subnetRes, null, 2)}</pre>`)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm ml-auto">Print</button>
                </div>
              </div>
            </div>
          )}

          {tab === "conv" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">IPv4 address</label>
                <input value={convIp} onChange={(e) => setConvIp(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                <div className="mt-3 text-sm">
                  {convInt === null ? <div className="text-rose-600 dark:text-rose-400">Invalid IPv4</div> : (
                    <div className="space-y-1">
                      <div><strong>Integer:</strong> {convInt.int}</div>
                      <div><strong>Binary:</strong> <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{convInt.bin}</code></div>
                      <div><strong>Hex:</strong> {convInt.hex}</div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => convInt && handleCopyResult(String(convInt.int))} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Copy Int</button>
                  <button onClick={() => convInt && exportResult("ipv4", JSON.stringify(convInt, null, 2), "json")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export</button>
                  <button onClick={() => convInt && shareText(JSON.stringify(convInt, null, 2))} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Share</button>
                </div>
              </div>
            </div>
          )}

          {tab === "range" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Start IP</label>
                <input value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                <label className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">End IP</label>
                <input value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                <div className="mt-3 text-sm">
                  {("error" in (rangeRes as any)) ? <div className="text-rose-600 dark:text-rose-400">{(rangeRes as any).error}</div> : (
                    <div>Count: {(rangeRes as any).count}</div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <button onClick={() => { if (!("error" in (rangeRes as any))) handleCopyResult(((rangeRes as any).list).join("\n"), "Copied list"); }} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Copy list</button>
                  <button onClick={() => { if (!("error" in (rangeRes as any))) exportResult("range", ((rangeRes as any).list).join("\n"), "txt"); }} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export</button>
                </div>
                <div className="overflow-auto max-h-60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-sm">
                  {("error" in (rangeRes as any)) ? <div className="text-rose-600 dark:text-rose-400">{(rangeRes as any).error}</div> : ((rangeRes as any).list || []).map((ip: string) => <div key={ip} className="py-0.5">{ip}</div>)}
                </div>
              </div>
            </div>
          )}

          {tab === "maclookup" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">MAC address</label>
                <input value={macQuery} onChange={(e) => setMacQuery(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                <div className="mt-3 text-sm space-y-1">
                  <div><strong>Normalized:</strong> {macNormalized || <span className="text-rose-600 dark:text-rose-400">Invalid</span>}</div>
                  <div><strong>Vendor:</strong> {macVendor}</div>
                </div>
              </div>
              <div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => macNormalized && handleCopyResult(macNormalized, "MAC copied")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Copy</button>
                  <button onClick={() => macNormalized && exportResult("mac", JSON.stringify({ mac: macNormalized, vendor: macVendor }, null, 2), "json")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export</button>
                </div>
              </div>
            </div>
          )}

          {tab === "macgen" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Options</label>
                <div className="flex gap-2 items-center mt-2 flex-wrap">
                  <label className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={macOpts.multicast} onChange={(e) => setMacOpts({ ...macOpts, multicast: e.target.checked })} /> Multicast
                  </label>
                  <label className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={macOpts.local} onChange={(e) => setMacOpts({ ...macOpts, local: e.target.checked })} /> Locally administered
                  </label>
                  <button onClick={() => setMacOpts({ ...macOpts })} className="px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-xs ml-auto text-slate-700 dark:text-slate-300">Refresh</button>
                </div>

                <div className="mt-4 text-sm">
                  <div><strong>Generated MAC:</strong> <span className="font-mono">{generatedMac}</span></div>
                </div>
              </div>
              <div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleCopyResult(generatedMac, "MAC copied")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Copy</button>
                  <button onClick={() => exportResult("mac-gen", generatedMac, "txt")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export</button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">Tip: Locally-administered addresses set internal network device addressing.</div>
              </div>
            </div>
          )}

          {tab === "ula" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Generate ULA /48</label>
                <div className="mt-2">
                  <button onClick={() => setUlaRes(generateUla())} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium">Generate</button>
                </div>
                <div className="mt-3 text-sm">{ulaRes ? <div><strong>ULA:</strong> <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{ulaRes}</code></div> : <div className="text-slate-500 dark:text-slate-400">No ULA generated yet</div>}</div>
              </div>
              <div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => ulaRes && handleCopyResult(ulaRes, "ULA copied")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Copy</button>
                  <button onClick={() => ulaRes && exportResult("ula", ulaRes, "txt")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export</button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">ULA prefixes start with <code>fd</code> and are for local networks (not globally routable).</div>
              </div>
            </div>
          )}

          {tab === "math" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Expression</label>
                <input value={expr} onChange={(e) => setExpr(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" />
                <div className="mt-3 text-sm">
                  {("error" in (mathRes as any)) ? <div className="text-rose-600 dark:text-rose-400">{(mathRes as any).error}</div> : <div><strong>Result:</strong> {(mathRes as any).value}</div>}
                </div>
              </div>
              <div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={async () => { if (!("error" in (mathRes as any))) { await copyText(String((mathRes as any).value)); alert("Copied"); } }} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Copy</button>
                  <button onClick={() => exportResult("calc", JSON.stringify(mathRes, null, 2), "json")} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm">Export</button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">Supports + - * / % ^ and parentheses. Example: <code>2^8 + (1024/4)</code></div>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
