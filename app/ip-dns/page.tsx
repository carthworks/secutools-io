"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, RefreshCw } from "lucide-react";

export default function IpDnsPage() {
  const [domain, setDomain] = useState("example.com");
  const [ip, setIp] = useState("8.8.8.8");

  const [geo, setGeo] = useState<any>(null);
  const [dns, setDns] = useState<any>(null);
  const [ptr, setPtr] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function lookupGeo() {
    setLoading(true);
    try {
      const res = await fetch(`https://ip-api.com/json/${ip}?fields=66846719`);
      setGeo(await res.json());
    } catch (err) {
      setGeo({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function lookupDNS() {
    setLoading(true);
    try {
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=ANY`);
      setDns(await res.json());
    } catch (err) {
      setDns({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function lookupPTR() {
    setLoading(true);
    try {
      // Convert IP to reverse DNS format
      const parts = ip.split(".").reverse().join(".") + ".in-addr.arpa";
      const res = await fetch(`https://dns.google/resolve?name=${parts}&type=PTR`);
      setPtr(await res.json());
    } catch (err) {
      setPtr({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  function copy(data: any) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Copied to clipboard");
  }

  function exportFile(data: any, name: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share(data: any) {
    const text = JSON.stringify(data, null, 2);
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "IP/DNS Result", text });
      } catch {}
    } else {
      copy(data);
    }
  }

  return (
    <div className="space-y-8">
      {/* IP Geolocation */}
      <Section
        title="IP Geolocation"
        subtitle="Find country, city, ISP, and ASN details from an IP address"
      >
        <div className="flex gap-2">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            placeholder="IP address"
          />
          <button
            onClick={lookupGeo}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? "..." : "Lookup"}
          </button>
        </div>
        {geo && (
          <div className="mt-3">
            <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              {JSON.stringify(geo, null, 2)}
            </pre>
            <div className="flex gap-2 mt-2">
              <button onClick={() => copy(geo)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Copy size={13}/> Copy</button>
              <button onClick={() => exportFile(geo, `geo-${ip}`)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Download size={13}/> Export</button>
              <button onClick={() => share(geo)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Share2 size={13}/> Share</button>
            </div>
          </div>
        )}
      </Section>

      {/* DNS Records */}
      <Section
        title="DNS Records"
        subtitle="Get A, MX, TXT, NS, and other records of a domain"
      >
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            placeholder="domain.com"
          />
          <button
            onClick={lookupDNS}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? "..." : "Lookup"}
          </button>
        </div>
        {dns && (
          <div className="mt-3">
            <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              {JSON.stringify(dns, null, 2)}
            </pre>
            <div className="flex gap-2 mt-2">
              <button onClick={() => copy(dns)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Copy size={13}/> Copy</button>
              <button onClick={() => exportFile(dns, `dns-${domain}`)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Download size={13}/> Export</button>
              <button onClick={() => share(dns)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Share2 size={13}/> Share</button>
            </div>
          </div>
        )}
      </Section>

      {/* Reverse DNS / PTR */}
      <Section
        title="Reverse DNS / PTR"
        subtitle="Look up the domain name associated with an IP"
      >
        <div className="flex gap-2">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            placeholder="IP address"
          />
          <button
            onClick={lookupPTR}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? "..." : "Reverse"}
          </button>
        </div>
        {ptr && (
          <div className="mt-3">
            <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              {JSON.stringify(ptr, null, 2)}
            </pre>
            <div className="flex gap-2 mt-2">
              <button onClick={() => copy(ptr)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Copy size={13}/> Copy</button>
              <button onClick={() => exportFile(ptr, `ptr-${ip}`)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Download size={13}/> Export</button>
              <button onClick={() => share(ptr)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition"><Share2 size={13}/> Share</button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
