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
  Search as IconSearch,
  Bookmark,
  Sun,
  Moon,
  Star,
  Key,
  Network,
  Search,
  FileSearch,
  FlaskConical,
  Cloud,
  Code,
  Newspaper,
  Brain,
  GraduationCap,
  Bot,
} from "lucide-react";
import { CommandPalette, SearchTrigger } from "@/components/CommandPalette";

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
      { slug: "hash-collision", title: "Hash Collision Demo", desc: "Visualize MD5/SHA1 collisions" },
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
      { slug: "cidr", title: "CIDR Calculator", desc: "Subnet ranges, broadcast, network size" },
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
      { slug: "qr-code-generator", title: "QR Code Generator (TQRCG)", desc: "Create & customize QR codes" },
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
   Component
   ----------------------- */

export default function Navigation() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [bookmarked, setBookmarked] = useState(false);

  const megaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("site_theme") === "dark";
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("site_theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: next }));
    } catch {}
  }

  /* Close mega on outside click */
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!megaRef.current) return;
      if (!megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* Global keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-md dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="sm:hidden p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 p-2 shadow-md">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-bold text-slate-900 dark:text-white leading-tight">SecuTools.io</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Fast · Private · Open</div>
              </div>
            </Link>
          </div>

          {/* Center: Command Palette trigger */}
          <div className="flex-1 max-w-xl mx-4">
            <SearchTrigger onOpen={() => setPaletteOpen(true)} />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Categories mega */}
            <div className="relative" ref={megaRef}>
              <button
                onClick={() => setMegaOpen((s) => !s)}
                aria-expanded={megaOpen}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition"
              >
                Categories
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
              </button>

              {megaOpen && (
                <div className="absolute right-0 mt-2 w-[680px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl p-4 z-50">
                  <div className="grid grid-cols-3 gap-3">
                    {categories.map((c) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.title} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.title}</div>
                              <div className="text-[10px] text-slate-400">{c.tools.length} tools</div>
                            </div>
                          </div>
                          <div className="grid gap-0.5">
                            {c.tools.slice(0, 3).map((t) => (
                              <Link
                                key={t.slug}
                                href={`/${t.slug}`}
                                className="block rounded-lg px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                                onClick={() => setMegaOpen(false)}
                              >
                                {t.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                    <Link
                      href="/tools"
                      onClick={() => setMegaOpen(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
                    >
                      Explore all tools
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center">
              <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Home" aria-label="Home">
                <Home className="w-4 h-4 text-sky-600" />
              </Link>
              <Link href="/about" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="About" aria-label="About">
                <Info className="w-4 h-4 text-emerald-600" />
              </Link>
              <Link href="/how-to" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="How to Use" aria-label="How to Use">
                <Newspaper className="w-4 h-4 text-purple-600" />
              </Link>
            </nav>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[88vw] max-w-xs bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400"
              >
                <IconSearch className="w-4 h-4 text-indigo-500" />
                <span>Search tools…</span>
                <kbd className="ml-auto text-[10px] px-1.5 py-0.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900">⌘K</kbd>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title}>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                      <Icon className="w-3.5 h-3.5" />
                      {c.title}
                    </div>
                    {c.tools.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/${t.slug}`}
                        className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t.title}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2 mb-3">
                <Link href="/" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setMobileOpen(false)}>
                  <Home className="w-4 h-4" /> Home
                </Link>
                <Link href="/about" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setMobileOpen(false)}>
                  <Info className="w-4 h-4" /> About
                </Link>
              </div>
              <button onClick={toggleTheme} className="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
