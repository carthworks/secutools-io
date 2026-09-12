"use client";

import { useState, useMemo } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, RefreshCw } from "lucide-react";

/* --- Utility functions for IP math --- */
function ipToInt(ip: string): number {
  return ip
    .split(".")
    .map(Number)
    .reduce((acc, oct) => (acc << 8) + oct, 0) >>> 0;
}

function intToIp(num: number): string {
  return [24, 16, 8, 0].map((s) => (num >>> s) & 255).join(".");
}

function calcCIDR(cidr: string) {
  try {
    const [ip, prefixStr] = cidr.split("/");
    if (!ip || !prefixStr) throw new Error("Invalid CIDR format");
    const prefix = parseInt(prefixStr, 10);
    if (prefix < 0 || prefix > 32) throw new Error("Invalid prefix");

    const ipInt = ipToInt(ip);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = ipInt & mask;
    const broadcast = network | (~mask >>> 0);

    return {
      input: cidr,
      ip,
      prefix,
      netmask: intToIp(mask),
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      firstHost: prefix === 32 ? intToIp(network) : intToIp(network + 1),
      lastHost: prefix === 32 ? intToIp(network) : intToIp(broadcast - 1),
      hosts: prefix >= 31 ? 0 : Math.pow(2, 32 - prefix) - 2,
    };
  } catch (e: any) {
    return { error: e.message };
  }
}

/* --- Helper functions --- */
async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  alert("Copied to clipboard ✅");
}

function exportFile(content: string, name: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* --- Component --- */
export default function CidrCalculatorPage() {
  const [cidr, setCidr] = useState("192.168.1.0/24");

  const result = useMemo(() => calcCIDR(cidr), [cidr]);

  function exportResults(kind: "txt" | "json") {
    if (!result || (result as any).error) return;
    const payload =
      kind === "json"
        ? JSON.stringify(result, null, 2)
        : Object.entries(result)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");
    exportFile(payload, `cidr-result.${kind}`, kind === "json" ? "application/json" : "text/plain");
  }

  function shareResult() {
    if (!result || (result as any).error) return;
    const text = `CIDR: ${result.input}\nNetwork: ${result.network}\nBroadcast: ${result.broadcast}\nMask: ${result.netmask}\nHosts: ${result.hosts}`;
    if ((navigator as any).share) {
      (navigator as any).share({ title: "CIDR Calculator", text }).catch(() => copyText(text));
    } else {
      copyText(text);
    }
  }

  return (
    <div className="space-y-8">
      <Section title="CIDR Calculator" subtitle="Calculate subnet ranges, broadcast, network size">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Enter a CIDR (e.g., <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-400">192.168.1.0/24</code>) to calculate subnet information.
        </p>

        <div className="flex gap-2">
          <input
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            placeholder="Enter CIDR (e.g. 10.0.0.0/16)"
            className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setCidr("")}
            className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-sm transition"
          >
            <RefreshCw className="w-4 h-4" /> Clear
          </button>
        </div>

        {result && (result as any).error ? (
          <div className="mt-4 p-3.5 border border-rose-200 dark:border-rose-900 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm font-medium">
            ❌ {(result as any).error}
          </div>
        ) : result ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><strong className="text-slate-500 dark:text-slate-400 font-sans">Input:</strong> <span className="text-slate-900 dark:text-slate-100 font-semibold">{result.input}</span></div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><strong className="text-slate-500 dark:text-slate-400 font-sans">Netmask:</strong> <span className="text-slate-900 dark:text-slate-100 font-semibold">{result.netmask}</span></div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><strong className="text-slate-500 dark:text-slate-400 font-sans">Network:</strong> <span className="text-slate-900 dark:text-slate-100 font-semibold">{result.network}</span></div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><strong className="text-slate-500 dark:text-slate-400 font-sans">Broadcast:</strong> <span className="text-slate-900 dark:text-slate-100 font-semibold">{result.broadcast}</span></div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><strong className="text-slate-500 dark:text-slate-400 font-sans">First Host:</strong> <span className="text-slate-900 dark:text-slate-100 font-semibold">{result.firstHost}</span></div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"><strong className="text-slate-500 dark:text-slate-400 font-sans">Last Host:</strong> <span className="text-slate-900 dark:text-slate-100 font-semibold">{result.lastHost}</span></div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 sm:col-span-2"><strong className="text-slate-500 dark:text-slate-400 font-sans">Total Usable Hosts:</strong> <span className="text-indigo-600 dark:text-indigo-400 font-bold">{result.hosts?.toLocaleString()}</span></div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => copyText(JSON.stringify(result, null, 2))}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </button>
              <button
                onClick={() => exportResults("txt")}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5" /> Export TXT
              </button>
              <button
                onClick={() => exportResults("json")}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
              <button
                onClick={shareResult}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 text-xs font-medium transition"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">About CIDR Calculator</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                The <strong>CIDR Calculator</strong> helps you break down <em>Classless Inter-Domain Routing (CIDR)</em> notations like 
                <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-indigo-600 dark:text-indigo-400">192.168.1.0/24</code> into clear and useful information.
                It shows the <strong>network address</strong>, <strong>broadcast address</strong>, <strong>usable host range</strong>, 
                and <strong>total host capacity</strong> for any subnet.
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                This tool runs fully in your browser (no data leaves your device), making it fast, secure, 
                and privacy-friendly. Whether you’re a <em>student learning subnetting</em>, a <em>SOC analyst mapping attack 
                surfaces</em>, or a <em>network admin planning IP allocations</em>, it provides a quick way to calculate 
                and understand subnet ranges.
              </p>

              <ul className="list-disc pl-5 mt-3 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li>🔹 Enter any CIDR notation (e.g., <code className="font-mono">10.0.0.0/16</code>)</li>
                <li>🔹 Instantly see network, broadcast, mask, and host counts</li>
                <li>🔹 Copy, export, or share results for reporting or study</li>
              </ul>
            </div>

          </div>
        ) : null}
      </Section>
    </div>
  );
}
