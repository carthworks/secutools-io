"use client";

import { useState } from "react";
import Link from "next/link";
import { Key, Network, Search, FileSearch, FlaskConical, Cloud } from "lucide-react";

type Tool = { slug: string; title: string; desc: string };
type Category = { title: string; icon: any; color: string; tools: Tool[] };

const categories: Category[] = [
  {
    title: "Cryptography",
    icon: Key,
    color: "bg-indigo-50",
    tools: [
      { slug: "hash", title: "Hash Tools", desc: "MD5, SHA1, SHA256, SHA512" },
      { slug: "jwt", title: "JWT Decoder", desc: "Decode and verify JWTs" },
      { slug: "password", title: "Password Utilities", desc: "Strength checker and generator" },
    ],
  },
  {
    title: "Network Analysis",
    icon: Network,
    color: "bg-blue-50",
    tools: [
      { slug: "ip-dns", title: "IP & DNS Toolkit", desc: "GeoIP, DNS records, rDNS" },
      { slug: "ssl", title: "SSL/TLS Checker", desc: "Certificate info and expiry" },
      { slug: "port", title: "Port Check", desc: "TCP reachability" },
      { slug: "headers", title: "HTTP Headers", desc: "CORS & CSP overview" },
    ],
  },
  {
    title: "Threat Intelligence",
    icon: Search,
    color: "bg-purple-50",
    tools: [
      { slug: "ioc", title: "IOC Extractor", desc: "Extract IPs, URLs, hashes, emails" },
      { slug: "cve", title: "CVE Lookup", desc: "Fetch details from CIRCL CVE" },
      { slug: "threat", title: "Threat Intel Check", desc: "VirusTotal/AbuseIPDB" },
      { slug: "whois", title: "WHOIS / RDAP", desc: "Ownership & registration" },
    ],
  },
  {
    title: "Analysis Tools",
    icon: FileSearch,
    color: "bg-teal-50",
    tools: [
      { slug: "logs", title: "Log Beautifier", desc: "Format JSON, Apache, Nginx" },
      { slug: "pcap", title: "PCAP Decoder", desc: "View timestamps, sizes, hex" },
      { slug: "timestamp", title: "Timestamp Converter", desc: "Unix ↔ Human time" },
      { slug: "subdomain", title: "Subdomain Finder", desc: "Dictionary-based" },
    ],
  },
  {
    title: "Testing & Payloads",
    icon: FlaskConical,
    color: "bg-yellow-50",
    tools: [
      { slug: "payloads", title: "XSS/SQLi Payloads", desc: "Encoders and test payloads" },
      { slug: "cheatsheets", title: "Cheatsheets", desc: "OWASP Top 10, MITRE ATT&CK" },
    ],
  },
  {
    title: "Web & Cloud Security",
    icon: Cloud,
    color: "bg-pink-50",
    tools: [
      { slug: "headers-check", title: "Security Headers Checker", desc: "Inspect CSP, HSTS, X-Frame-Options" },
      { slug: "url-trace", title: "URL Unshortener & Redirect Tracer", desc: "Expand and trace redirects" },
      { slug: "cvss", title: "CVE Severity Calculator", desc: "Compute CVSS scores" },
      { slug: "aws-s3", title: "AWS S3 Checker", desc: "Test for public/misconfigured buckets" },
    ],
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    tools: cat.tools.filter((t) =>
      [t.title, t.desc, cat.title].some((field) =>
        field.toLowerCase().includes(query.toLowerCase())
      )
    ),
  }));

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold">Cybersecurity Handy Tools</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Everyday tools for students and professionals. Fast, privacy-friendly, and open.
        </p>
      </section>

      {/* Search */}
      <section className="max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-lg p-3 shadow-sm"
        />
      </section>

      {/* Categories - 2 per row */}
      <section className="grid md:grid-cols-2 gap-6">
        {filteredCategories.map(
          (cat, idx) =>
            cat.tools.length > 0 && (
              <div key={idx} className={`space-y-4 p-4 rounded-lg shadow-sm ${cat.color}`}>
                <div className="flex items-center gap-2">
                  <cat.icon className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold">{cat.title}</h2>
                </div>
                <div className="grid gap-3">
                  {cat.tools.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${t.slug}`}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-4 block shadow-sm"
                    >
                      <div className="font-medium">{t.title}</div>
                      <div className="text-sm text-slate-500">{t.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )
        )}
      </section>
    </div>
  );
}
