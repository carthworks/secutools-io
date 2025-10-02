"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  Key,
  Network,
  Search,
  FileSearch,
  FlaskConical,
  Cloud,
  Star,
  StarOff,
  ExternalLink,
  Code,
  type LucideIcon,
  
} from "lucide-react";

/* -----------------------
  Types & data (icons typed)
   ----------------------- */

type Tool = { slug: string; title: string; desc: string };
type Category = { title: string; icon: any; color: string; tools: Tool[] };

const categories0: Category[] = [
  {
    title: "Cryptography",
    icon: Key,
    tools: [
      { slug: "hash", title: "Hash Tools", desc: "MD5, SHA1, SHA256, SHA512" },
      { slug: "jwt", title: "JWT Decoder", desc: "Decode and verify JWTs" },
      { slug: "password", title: "Password Utilities", desc: "Strength checker and generator" },
    ],
  },
  {
    title: "Network Analysis",
    icon: Network,
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
    tools: [
      { slug: "payloads", title: "XSS/SQLi Payloads", desc: "Encoders and test payloads" },
      { slug: "cheatsheets", title: "Cheatsheets", desc: "OWASP Top 10, MITRE ATT&CK" },
    ],
  },
  {
    title: "Web & Cloud Security",
    icon: Cloud,
    tools: [
      { slug: "headers-check", title: "Security Headers Checker", desc: "Inspect CSP, HSTS, X-Frame-Options" },
      { slug: "url-trace", title: "URL Unshortener & Redirect Tracer", desc: "Expand and trace redirects" },
      { slug: "cvss", title: "CVE Severity Calculator", desc: "Compute CVSS scores" },
      { slug: "aws-s3", title: "AWS S3 Checker", desc: "Test for public/misconfigured buckets" },
    ],
  },
];

const categories: Category[] = [
  {
    title: "Cryptography",
    icon: Key,
    color: "bg-indigo-50",
    tools: [
      { slug: "hash", title: "Hash Tools", desc: "MD5, SHA1, SHA256, SHA512" },
      { slug: "jwt", title: "JWT Decoder", desc: "Decode and verify JWTs" },
      { slug: "password", title: "Password Utilities", desc: "Strength checker and generator" },
      { slug: "hash-id", title: "Hash Identifier", desc: "Detect type of hash string" },
      { slug: "obfuscator", title: "String Obfuscator", desc: "ROT13, Caesar, XOR, Base conversions" },
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
      { slug: "cidr", title: "CIDR Calculator", desc: "Subnet ranges, broadcast, network size" },
      { slug: "asn", title: "ASN Lookup", desc: "Find ASN / ISP from IP (offline dataset)" },
    ],
  },
  {
    title: "Threat Intelligence",
    icon: Search,
    color: "bg-purple-50",
    tools: [
      { slug: "ioc", title: "IOC Extractor", desc: "Extract IPs, URLs, hashes, emails" },
      { slug: "cve", title: "CVE Lookup", desc: "Fetch details from CIRCL CVE" },
      { slug: "cve-feed", title: "CVE Feed Viewer", desc: "Browse latest CVEs from NVD" },
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
      { slug: "json-xml", title: "JSON/XML Formatter", desc: "Beautify and validate structured data" },
      { slug: "regex", title: "Regex Tester", desc: "Build and test regex patterns" },
    ],
  },
  {
    title: "Testing & Payloads",
    icon: FlaskConical,
    color: "bg-yellow-50",
    tools: [
      { slug: "payloads", title: "XSS/SQLi Payloads", desc: "Encoders and test payloads" },
      { slug: "cheatsheets", title: "Cheatsheets", desc: "OWASP Top 10, MITRE ATT&CK" },
      { slug: "wordlist", title: "Wordlist Generator", desc: "Custom password/wordlists" },
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
  {
    title: "Learning",
    icon: Code,
    color: "bg-green-50",
    tools: [
      { slug: "tips", title: "Daily Security Tips", desc: "Flashcards & rotating advice" },
    ],
  },
];

/* -----------------------
  Component
   ----------------------- */

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  // close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // flatten tools for search
  const allTools: (Tool & { category: string })[] = categories.flatMap((c) =>
    c.tools.map((t) => ({ ...t, category: c.title }))
  );

  const filtered = query
    ? allTools.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.desc.toLowerCase().includes(query.toLowerCase()) ||
          t.slug.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary">SecuTools.io</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm text-slate-700">
          {/* Categories dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              aria-haspopup="true"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((s) => !s)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 transition"
            >
              Tool Categories
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div
                role="menu"
                aria-label="Tool categories"
                className="absolute left-0 mt-2 w-[560px] max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-lg z-40"
              >
                {/* Search inside dropdown */}
                <div className="p-3 border-b border-slate-100">
                  <div className="flex gap-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search tools (name, description)..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none"
                      autoFocus
                    />
                    <button onClick={() => setQuery("")} className="px-3 py-2 rounded hover:bg-slate-100">
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">Tip: press Esc to close</div>
                </div>

                {/* Results container: vertical scroll */}
                <div className="p-4 max-h-[420px] overflow-y-auto">
                  {/* if user is typing show filtered list; otherwise show grouped categories */}
                  {filtered ? (
                    <div className="grid gap-3">
                      {filtered.length === 0 && <div className="text-sm text-slate-500">No matching tools</div>}
                      {filtered.map((t) => (
                        <Link
                          key={t.slug}
                          href={`/${t.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block p-2 rounded hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-800">{t.title}</div>
                              <div className="text-xs text-slate-500">{t.desc}</div>
                            </div>
                            <div className="text-xs text-slate-400">{t.category}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category, idx) => {
                        const Icon = category.icon;
                        return (
                          <div key={idx}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-slate-600" />
                              <h4 className="text-sm font-semibold text-slate-800">{category.title}</h4>
                              <span className="ml-2 text-xs text-slate-400">({category.tools.length})</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              {category.tools.map((tool) => (
                                <Link
                                  key={tool.slug}
                                  href={`/${tool.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="block rounded px-2 py-1 hover:bg-slate-50 transition"
                                >
                                  <div className="text-xs text-slate-700 font-medium">{tool.title}</div>
                                  <div className="text-xxs text-slate-400">{tool.desc}</div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 text-center">
                  <Link
                    href="/tools"
                    onClick={() => setIsOpen(false)}
                    className="inline-block text-sm font-medium text-primary hover:underline"
                  >
                    View All Tools
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link className="hover:text-slate-900" href="/about">About</Link>
          <Link className="hover:text-slate-900" href="/contact">Contact</Link>
          <a className="hover:text-slate-900" href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noreferrer">OWASP</a>
        </nav>

        {/* Mobile Nav: menu button */}
        <div className="sm:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded border"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 sm:hidden" role="dialog" aria-modal="true">
          <div className="absolute right-0 top-0 h-full w-[92vw] max-w-sm bg-white shadow-lg p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Tools</div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              {(query ? allToolsFilter(categories, query) : categories).map((c: any, i: number) => {
                // mobile: if query provided, c is tool; otherwise c is category
                if (query) {
                  // c is Tool-like object
                  return (
                    <Link key={c.slug} href={`/${c.slug}`} onClick={() => setMobileOpen(false)} className="block p-2 rounded hover:bg-slate-50">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-slate-500">{c.desc}</div>
                    </Link>
                  );
                } else {
                  const Icon = c.icon;
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <div className="font-medium">{c.title}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {c.tools.map((t: Tool) => (
                          <Link key={t.slug} href={`/${t.slug}`} onClick={() => setMobileOpen(false)} className="block px-2 py-1 rounded hover:bg-slate-50">
                            <div className="text-sm">{t.title}</div>
                            <div className="text-xs text-slate-500">{t.desc}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            <div className="mt-6">
              <Link href="/tools" onClick={() => setMobileOpen(false)} className="block text-center text-sm font-medium text-primary">
                View All Tools
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* -----------------------
  Helpers
   ----------------------- */

/**
 * Helper used inside mobile branch to provide a simplified flat list when query is set.
 * We return an array of tool-like objects so mobile rendering can reuse blocks.
 */
function allToolsFilter(cats: Category[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return cats;
  const matched: (Tool & { category: string })[] = [];
  for (const c of cats) {
    for (const t of c.tools) {
      if (
        t.title.toLowerCase().includes(query) ||
        t.desc.toLowerCase().includes(query) ||
        t.slug.toLowerCase().includes(query)
      ) {
        matched.push({ ...t, category: c.title });
      }
    }
  }
  return matched;
}
