// File: components/Navigation.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Home,
  Info,
  Mail,
  Search as IconSearch,
  Bell,
  Bookmark,
  Sun,
  Moon,
  User,
  LogOut,
  Star,
  Key,
  Network,
  Search,
  FileSearch,
  FlaskConical,
  Cloud,
  Code,
  Newspaper 
} from "lucide-react";

/* -----------------------
   Data + Types
   ----------------------- */

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
    tools: [{ slug: "tips", title: "Daily Security Tips", desc: "Flashcards & rotating advice" }],
  },
];

/* -----------------------
   Helpers
   ----------------------- */

const allTools = categories.flatMap((c) => c.tools.map((t) => ({ ...t, category: c.title })));
function searchTools(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return allTools.filter(
    (t) => t.title.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s) || t.slug.toLowerCase().includes(s)
  );
}

/* -----------------------
   Live Ticker Component
   ----------------------- */

/**
 * LiveTicker: small component that fetches public IP, estimates download/upload speed,
 * latency and a light CVE count. Defensive to network failures and CORS — shows placeholders.
 *
 * Update interval: 30s (configurable below).
 */
function LiveTicker() {
  const [ip, setIp] = useState<string | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [cveCount, setCveCount] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const INTERVAL = 30_000; // 30s

    async function fetchIp() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        if (!mountedRef.current) return;
        const data = await res.json();
        setIp(data.ip);
      } catch (e) {
        console.error("Failed to fetch IP:", e);
        setIp(null);
      }
    }

    // measure latency with a cheap generate_204 endpoint
    async function measureLatency() {
      try {
        const start = performance.now();
        // this endpoint returns 204 quickly
        await fetch("https://www.gstatic.com/generate_204", { cache: "no-store", mode: "no-cors" }).catch(() => {
          // some browsers block no-cors timing; fallback to try-catch
        });
        const end = performance.now();
        const ms = Math.round(end - start);
        if (mountedRef.current) setLatencyMs(ms);
      } catch {
        if (mountedRef.current) setLatencyMs(null);
      }
    }

    // naive download speed estimator:
    // fetch a known large-ish CDN file, read its blob size or content-length and measure time.
    async function measureDownload() {
      try {
        const url = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js";
        const start = performance.now();
        const resp = await fetch(url, { cache: "no-store" });
        const t1 = performance.now();
        // try header length
        let bytes = 0;
        const cl = resp.headers.get("content-length");
        if (cl) {
          bytes = parseInt(cl, 10);
        } else {
          // fallback: read as blob to get size (may be slower)
          const blob = await resp.blob();
          bytes = blob.size;
        }
        const t2 = performance.now();
        const secs = (t2 - start) / 1000;
        const mbps = secs > 0 ? Math.round(((bytes * 8) / secs) / (1024 * 1024)) : null;
        if (mountedRef.current) setDownloadMbps(mbps ?? null);
      } catch {
        if (mountedRef.current) setDownloadMbps(null);
      }
    }

    // naive upload test: try posting small payload to httpbin.org (CORS dependent)
    async function measureUpload() {
      try {
        const payload = new Uint8Array(256 * 1024); // 256 KB random payload
        const start = performance.now();
        const res = await fetch("https://httpbin.org/post", {
          method: "POST",
          body: payload,
          mode: "cors",
          cache: "no-store",
        });
        if (!mountedRef.current) return;
        const end = performance.now();
        if (!res.ok) {
          setUploadMbps(null);
          return;
        }
        const secs = (end - start) / 1000;
        const mbps = secs > 0 ? Math.round(((payload.byteLength * 8) / secs) / (1024 * 1024)) : null;
        if (mountedRef.current) setUploadMbps(mbps ?? null);
      } catch {
        // likely CORS block or network failure — set null
        if (mountedRef.current) setUploadMbps(null);
      }
    }

    // light CVE count: attempt to fetch a small feed from CIRCL (last N CVEs)
    async function fetchCveCount() {
      try {
        const res = await fetch("https://cve.circl.lu/api/last"); // returns array of latest CVEs
        if (!mountedRef.current) return;
        if (!res.ok) {
          setCveCount(null);
          return;
        }
        const arr = await res.json();
        // arr is array — show how many arrived in last feed as a quick indicator
        if (Array.isArray(arr)) setCveCount(arr.length);
        else setCveCount(null);
      } catch {
        setCveCount(null);
      }
    }

    async function runAll() {
      await Promise.all([fetchIp(), measureLatency(), measureDownload(), measureUpload(), fetchCveCount()]);
    }

    runAll();
    const id = setInterval(runAll, INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  // pretty string outputs with fallbacks
  const ipText = ip ?? "—";
  const speedText = downloadMbps !== null && downloadMbps !== undefined ? `${downloadMbps}` : "—";
  const uploadText = uploadMbps !== null && uploadMbps !== undefined ? `${uploadMbps}` : "—";
  const cveText = cveCount !== null && cveCount !== undefined ? `${cveCount}` : "—";
  const latText = latencyMs !== null && latencyMs !== undefined ? `${latencyMs}` : "—";

  return (
    <div className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
      {/* <span className="mr-2 font-medium">IP:</span>
      <span className="mr-3">{ipText}</span>
      <span className="mx-2">|</span>
      <span className="mr-1">Speed:</span>
      <span className="mr-3">{speedText} Mbps ↓ / {uploadText} Mbps ↑</span>
      <span className="mx-2">|</span>
      <span className="mr-1">CVEs Today:</span>
      <span className="mr-3">{cveText}</span>
      <span className="mx-2">|</span>
      <span className="mr-1">Latency:</span>
      <span>{latText} ms</span> */}
    </div>
  );
}

/* -----------------------
   Component
   ----------------------- */

export default function Navigation() {
  // ui state
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
// const [theme, setTheme] = useState<"light" | "dark">(() => (typeof window !== "undefined" && localStorage.getItem("site_theme") === "dark" ? "dark" : "light"));
  const [theme, setTheme] = useState<"light" | "dark">(() => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("site_theme");
    if (stored === "light" || stored === "dark") return stored as "light" | "dark";
  }
  return "dark"; // default to dark
});

const [notifCount, setNotifCount] = useState(2);
  const [bookmarked, setBookmarked] = useState(false);

  // refs for outside clicks
  const megaRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // dark mode sync
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try { localStorage.setItem("site_theme", theme); } catch {}
  }, [theme]);

  // outside click closes mega
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!megaRef.current) return;
      if (!megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // esc handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // derived
  const suggestions = query ? searchTools(query).slice(0, 6) : [];

  // small handlers
  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }
  function toggleBookmark() {
    setBookmarked((b) => !b);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-md dark:bg-slate-900/80">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        {/* Left: Brand + hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="sm:hidden p-2 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>

          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-md bg-gradient-to-tr from-indigo-600 to-emerald-400 p-2 shadow-md">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">AIToolBox.io
</div>
              <div className="text-xs text-slate-500 dark:text-slate-300 -mt-0.5">Fast · Privacy-friendly · Open</div>
            </div>
          </Link>
        </div>

        {/* Center: Live search */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm">
              <IconSearch className="w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, e.g., 'hash', 'CVE', 'PCAP'..."
                className="flex-1 bg-transparent outline-none ml-2 text-sm text-slate-800 dark:text-slate-100"
                aria-label="Search tools"
                list="tool-suggestions"
              />
              <datalist id="tool-suggestions">
                {suggestions.map((s) => (
                  <option key={s.slug} value={s.title} />
                ))}
              </datalist>
              {query ? (
                <button onClick={() => setQuery("")} className="px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                  Clear
                </button>
              ) : (
                <div className="text-xs text-slate-400 hidden sm:block">⌘K</div>
              )}
            </div>
            {/* suggestions dropdown */}
            {suggestions.length === 0 && query && (
              <div className="absolute left-0 right-0 mt-2 rounded-lg shadow-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-opacity opacity-100">
                <div className="p-2">
                  <div className="text-sm text-slate-500 px-2 py-3">No matches — try another term.</div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 p-2 text-center text-xs">
                  <Link href="/tools" className="text-primary font-medium">
                    View all tools
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: icon-only actions */}
        <div className="flex items-center gap-2">
          {/* Live ticker injected here */}
          <LiveTicker />

          {/* Categories mega */}
          <div className="relative" ref={megaRef}>
            <button
              onClick={() => setMegaOpen((s) => !s)}
              aria-expanded={megaOpen}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-sm border"
            >
              Categories
              <ChevronDown className={`w-4 h-4 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
            </button>

            {megaOpen && (
              <div className="absolute right-0 mt-2 w-[680px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-2xl p-4 z-50">
                <div className="grid grid-cols-3 gap-4">
                  {categories.map((c) => {
                    const Icon = c.icon;
                    return (
                      <div key={c.title} className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-slate-100 dark:bg-slate-800">
                            <Icon className="w-5 h-5 text-slate-700 dark:text-slate-100" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-100">{c.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{c.tools.length} tools</div>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-1 text-sm">
                          {c.tools.slice(0, 4).map((t) => (
                            <Link
                              key={t.slug}
                              href={`/${t.slug}`}
                              className="block rounded px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => setMegaOpen(false)}
                            >
                              <div className="font-medium text-slate-700 dark:text-slate-100">{t.title}</div>
                              <div className="text-xs text-slate-400">{t.desc}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/tools" onClick={() => setMegaOpen(false)} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 text-white">
                    Explore all tools
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Icon-only colorful compact nav */}
          <nav className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded hover:bg-slate-50" title="Home" aria-label="Home">
              <Home className="w-5 h-5 text-sky-600" />
            </Link>
            <Link href="/about" className="p-2 rounded hover:bg-slate-50" title="About" aria-label="About">
              <Info className="w-5 h-5 text-emerald-600" />
            </Link>
            <Link href="/contact" className="p-2 rounded hover:bg-slate-50" title="Contact" aria-label="Contact">
              <Mail className="w-5 h-5 text-rose-600" />
            </Link>
             {/* <Link href="/news" className="p-2 rounded hover:bg-slate-50" title="News" aria-label="News">
              <Newspaper className="w-5 h-5 text-yellow-600" />
            </Link> */}
          </nav>

          {/* misc icons */}
          <button
            onClick={() => setNotifCount(0)}
            className="p-2 rounded hover:bg-slate-50 relative hidden"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full px-1.5">{notifCount}</span>}
          </button>

          <button
            onClick={toggleBookmark}
            className="p-2 rounded hover:bg-slate-50"
            aria-pressed={bookmarked}
            title={bookmarked ? "Bookmarked" : "Bookmark"}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? "text-amber-500" : "text-slate-700 dark:text-slate-200"}`} />
          </button>

          <button onClick={toggleTheme} className="p-2 rounded hover:bg-slate-50" aria-label="Toggle theme" title="Toggle theme">
            {theme === "light" ? <Moon className="w-5 h-5 text-slate-700" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>

          {/* profile */}
          <div className="relative hidden">
            <details className="relative">
              <summary className="list-none cursor-pointer p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  A
                </div>
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-md overflow-hidden z-40">
                <div className="p-3">
                  <div className="font-medium">Alex Parker</div>
                  <div className="text-xs text-slate-500">SecOps · London</div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800">
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link href="/bookmarks" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Star className="w-4 h-4" /> Bookmarks
                  </Link>
                  <Link href="/logout" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <LogOut className="w-4 h-4" /> Sign out
                  </Link>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-60 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[92vw] max-w-sm bg-white dark:bg-slate-900 p-4 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Menu</div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded px-3 py-2">
                <IconSearch className="w-4 h-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <nav className="flex gap-2">
                <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
                  <Home className="w-5 h-5 text-sky-600" /> Home
                </Link>
                <Link href="/about" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
                  <Info className="w-5 h-5 text-emerald-600" /> About
                </Link>
              </nav>

              <div>
                <div className="text-xs font-medium mb-2">Categories</div>
                {categories.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.title} className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <div className="font-medium">{c.title}</div>
                      </div>
                      <div className="pl-6">
                        {c.tools.map((t) => (
                          <Link key={t.slug} href={`/${t.slug}`} className="block px-2 py-1 text-sm rounded hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                            {t.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link href="/tools" onClick={() => setMobileOpen(false)} className="block text-center px-3 py-2 rounded bg-indigo-600 text-white">
                  Browse all tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
