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
            className="flex-1 border rounded p-2"
            placeholder="IP address"
          />
          <button
            onClick={lookupGeo}
            disabled={loading}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            {loading ? "..." : "Lookup"}
          </button>
        </div>
        {geo && (
          <div className="mt-3">
            <pre className="text-xs whitespace-pre-wrap bg-slate-950 text-black border border-slate-800 rounded p-2">
              {JSON.stringify(geo, null, 2)}
            </pre>
            <div className="flex gap-2 mt-2">
              <button onClick={() => copy(geo)} className="px-3 py-1 border rounded flex items-center gap-1"><Copy size={14}/> Copy</button>
              <button onClick={() => exportFile(geo, `geo-${ip}`)} className="px-3 py-1 border rounded flex items-center gap-1"><Download size={14}/> Export</button>
              <button onClick={() => share(geo)} className="px-3 py-1 border rounded flex items-center gap-1"><Share2 size={14}/> Share</button>
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
            className="flex-1 border rounded p-2"
            placeholder="domain.com"
          />
          <button
            onClick={lookupDNS}
            disabled={loading}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            {loading ? "..." : "Lookup"}
          </button>
        </div>
        {dns && (
          <div className="mt-3">
            <pre className="text-xs whitespace-pre-wrap bg-slate-950 text-black border border-slate-800 rounded p-2">
              {JSON.stringify(dns, null, 2)}
            </pre>
            <div className="flex gap-2 mt-2">
              <button onClick={() => copy(dns)} className="px-3 py-1 border rounded flex items-center gap-1"><Copy size={14}/> Copy</button>
              <button onClick={() => exportFile(dns, `dns-${domain}`)} className="px-3 py-1 border rounded flex items-center gap-1"><Download size={14}/> Export</button>
              <button onClick={() => share(dns)} className="px-3 py-1 border rounded flex items-center gap-1"><Share2 size={14}/> Share</button>
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
            className="flex-1 border rounded p-2"
            placeholder="IP address"
          />
          <button
            onClick={lookupPTR}
            disabled={loading}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            {loading ? "..." : "Reverse"}
          </button>
        </div>
        {ptr && (
          <div className="mt-3">
            <pre className="text-xs whitespace-pre-wrap bg-slate-950 text-black border border-slate-800 rounded p-2">
              {JSON.stringify(ptr, null, 2)}
            </pre>
            <div className="flex gap-2 mt-2">
              <button onClick={() => copy(ptr)} className="px-3 py-1 border rounded flex items-center gap-1"><Copy size={14}/> Copy</button>
              <button onClick={() => exportFile(ptr, `ptr-${ip}`)} className="px-3 py-1 border rounded flex items-center gap-1"><Download size={14}/> Export</button>
              <button onClick={() => share(ptr)} className="px-3 py-1 border rounded flex items-center gap-1"><Share2 size={14}/> Share</button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
