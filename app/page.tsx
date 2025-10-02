"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  Code
  
} from "lucide-react";

import dynamic from "next/dynamic";
import NetworkTools from "@/components/NetworkTools";
// import NewsFeedSection from "@/components/NewsFeedSection";


type Tool = { slug: string; title: string; desc: string; isPublish:boolean };
type Category = { title: string; icon: any; color: string; tools: Tool[];  };


const NewsFeedSection = dynamic(() => import("@/components/NewsFeedSection"), {
  ssr: false,
});

const categories: Category[] = [
  {
    title: "Cryptography",
    icon: Key,
    color: "bg-indigo-50",
    tools: [
      { slug: "hash", title: "Hash Tools", desc: "MD5, SHA1, SHA256, SHA512",	isPublish:true },
      { slug: "jwt", title: "JWT Decoder", desc: "Decode and verify JWTs",	isPublish:true },
      { slug: "password", title: "Password Utilities", desc: "Strength checker and generator",	isPublish:true },
      { slug: "hash-id", title: "Hash Identifier", desc: "Detect type of hash string",	isPublish:true },
      { slug: "obfuscator", title: "String Obfuscator", desc: "ROT13, Caesar, XOR, Base conversions",	isPublish:true },
    ]

  },
  {
    title: "Network Analysis",
    icon: Network,
    color: "bg-blue-50",
    tools: [
      { slug: "ip-dns", title: "IP & DNS Toolkit", desc: "GeoIP, DNS records, rDNS", isPublish:true },
      { slug: "ssl", title: "SSL/TLS Checker", desc: "Certificate info and expiry", isPublish:true },
      { slug: "port", title: "Port Check", desc: "TCP reachability", isPublish:true },
      { slug: "headers", title: "HTTP Headers", desc: "CORS & CSP overview" , isPublish:true},
      { slug: "cidr", title: "CIDR Calculator", desc: "Subnet ranges, broadcast, network size" , isPublish:true},
      { slug: "asn", title: "ASN Lookup", desc: "Find ASN / ISP from IP (offline dataset)", isPublish:false },
	  { slug: "network-tool", title: "Network-tool", desc: "IPv4/IPv6 utilities, MAC helpers, and quick math — client-side", isPublish:true },
    ],
  },
  {
    title: "Threat Intelligence",
    icon: Search,
    color: "bg-purple-50",
    tools: [
      { slug: "ioc", title: "IOC Extractor", desc: "Extract IPs, URLs, hashes, emails", isPublish:true },
      { slug: "cve", title: "CVE Lookup", desc: "Fetch details from CIRCL CVE", isPublish:true },
      { slug: "cve-feed", title: "CVE Feed Viewer", desc: "Browse latest CVEs from NVD", isPublish:false },
      { slug: "threat", title: "Threat Intel Check", desc: "VirusTotal/AbuseIPDB" , isPublish:true},
      { slug: "whois", title: "WHOIS / RDAP", desc: "Ownership & registration", isPublish:true},
    ],
  },
  {
    title: "Analysis Tools",
    icon: FileSearch,
    color: "bg-teal-50",
    tools: [
      { slug: "logs", title: "Log Beautifier", desc: "Format JSON, Apache, Nginx", isPublish:true },
      { slug: "pcap", title: "PCAP Decoder", desc: "View timestamps, sizes, hex", isPublish:true },
      { slug: "timestamp", title: "Timestamp Converter", desc: "Unix ↔ Human time" , isPublish:true},
      { slug: "subdomain", title: "Subdomain Finder", desc: "Dictionary-based", isPublish:true },
      { slug: "json-xml", title: "JSON/XML Formatter", desc: "Beautify and validate structured data", isPublish:true },
      { slug: "regex", title: "Regex Tester", desc: "Build and test regex patterns", isPublish:false },
    ],
  },
  {
    title: "Testing & Payloads",
    icon: FlaskConical,
    color: "bg-yellow-50",
    tools: [
      { slug: "payloads", title: "XSS/SQLi Payloads", desc: "Encoders and test payloads" , isPublish:true},
      { slug: "cheatsheets", title: "Cheatsheets", desc: "OWASP Top 10, MITRE ATT&CK", isPublish:true },
      { slug: "wordlist", title: "Wordlist Generator", desc: "Custom password/wordlists", isPublish:false },
    ],
  },
  {
    title: "Web & Cloud Security",
    icon: Cloud,
    color: "bg-pink-50",
    tools: [
      { slug: "headers-check", title: "Security Headers Checker", desc: "Inspect CSP, HSTS, X-Frame-Options", isPublish:true },
      { slug: "url-trace", title: "URL Unshortener & Redirect Tracer", desc: "Expand and trace redirects", isPublish:false },
      { slug: "cvss", title: "CVE Severity Calculator", desc: "Compute CVSS scores" , isPublish:true},
      { slug: "aws-s3", title: "AWS S3 Checker", desc: "Test for public/misconfigured buckets", isPublish:false },
    ],
  },
  {
    title: "Learning",
    icon: Code,
    color: "bg-green-50",
    tools: [
      { slug: "tips", title: "Daily Security Tips", desc: "Flashcards & rotating advice", isPublish:true },
    ],
  },
];


/* ---------- helpers ---------- */
const FAVORITES_KEY = "secu_favs_v1";
const RECENT_KEY = "secu_recent_v1";

function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function saveJSON(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/* Very small rule to add a simple tag */
function toolTags(slug: string) {
  const clientOnly = new Set([
    "hash", "jwt", "password", "logs", "timestamp", "pcap", "subdomain", "payloads", "cheatsheets"
  ]);
  const apiNeeded = new Set(["ip-dns", "cve", "threat", "whois", "headers-check", "aws-s3"]);
  const tags: string[] = [];
  if (clientOnly.has(slug)) tags.push("client-only");
  if (apiNeeded.has(slug)) tags.push("api");
  if (slug === "pcap") tags.push("upload");
  return tags;
}

/* ---------- component ---------- */
export default function HomePage() {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadJSON<string[]>(FAVORITES_KEY) ?? [];
  });
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadJSON<string[]>(RECENT_KEY) ?? [];
  });

  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // persist favorites
    saveJSON(FAVORITES_KEY, favorites);
  }, [favorites]);

  useEffect(() => {
    saveJSON(RECENT_KEY, recent);
  }, [recent]);

  // keyboard shortcut to focus search (Cmd/Ctrl+K)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // filtered view
  const filteredCategories = useMemo(
    () =>
      categories.map((cat) => ({
        ...cat,
        tools: cat.tools.filter((t) =>
          [t.title, t.desc, cat.title].some((field) =>
            field.toLowerCase().includes(query.toLowerCase())
          )
        ),
      })),
    [query]
  );

  // All tools flat (for favorites UI)
  const allToolsFlat: Tool[] = useMemo(() => categories.flatMap((c) => c.tools), []);

  function toggleFavorite(slug: string) {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev];
      return next.slice(0, 20);
    });
  }

  function recordRecent(slug: string) {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)];
      return next.slice(0, 12);
    });
  }

  // helper to render icon components stored in category.icon
  function RenderIcon({ icon: IconComp, className = "w-5 h-5" }: { icon: any; className?: string }) {
    const Comp = IconComp as any;
    return <Comp className={className} aria-hidden />;
  }

  // quick favorites resolved to tool objects
  const favoritesResolved = favorites.map((s) => allToolsFlat.find((t) => t.slug === s)).filter(Boolean) as Tool[];
  const recentResolved = recent.map((s) => allToolsFlat.find((t) => t.slug === s)).filter(Boolean) as Tool[];

  return (
    <div className="space-y-10 px-4 sm:px-8 lg:px-24 py-8">
      {/* Hero */}
      <section className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold">Cybersecurity Handy Tools</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Practical tools for SOC analysts, pentesters, and students — fast, privacy-friendly, and open.
        </p>
      </section>

      {/* Search & Favorites row */}
      <section className="max-w-4xl mx-auto space-y-4">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              aria-label="Search tools"
              className="w-full border rounded-lg p-3 shadow-sm pr-20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-2">
              <span className="hidden sm:inline">Press</span>
              <kbd className="bg-slate-100 border rounded px-2 py-0.5 text-xs">⌘K</kbd>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="text-sm text-slate-600 hidden sm:block">Favorites</div>
            <div className="flex gap-2">
              {favoritesResolved.length === 0 ? (
                <div className="text-sm text-slate-400 px-3 py-2 rounded border">No favorites</div>
              ) : (
                favoritesResolved.slice(0, 6).map((t) => (
                  <Link
                    key={t.slug}
                    href={`/${t.slug}`}
                    onClick={() => recordRecent(t.slug)}
                    className="px-3 py-2 rounded border bg-white text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2"
                    title={t.title}
                  >
                    <span className="font-medium">{t.title}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recently used */}
        {recentResolved.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-1">
            {recentResolved.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                onClick={() => recordRecent(t.slug)}
                className="text-xs whitespace-nowrap px-3 py-1 border rounded bg-white flex items-center gap-2"
              >
                <span>{t.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Categories (2 per row) */}
      <section className="grid md:grid-cols-2 gap-6">
        {filteredCategories.map(
          (cat, idx) =>
            cat.tools.length > 0 && (
              <div key={idx} className={`space-y-4 p-4 rounded-lg shadow-sm ${cat.color}`}>
                <div className="flex items-center gap-3">
                  <RenderIcon icon={cat.icon} />
                  <h2 className="text-lg font-semibold uppercase tracking-wide">{cat.title}</h2>
                  <div className="ml-auto text-sm text-slate-500">{cat.tools.length} tools</div>
                </div>

                <div className="grid gap-3">
                  {cat.tools.map((t) => {
                    const tags = toolTags(t.slug);
                    const isFav = favorites.includes(t.slug);
                    return (
                      <div
                        key={t.slug}
                        className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-3 shadow-sm flex items-start gap-3"
                      >
                        {/* left: title + desc */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{t.title}</div>
                            <div className="flex gap-1 ml-1">
                              {tags.map((tg) => (
                                <span key={tg} className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{tg}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">{t.desc}</div>
                        </div>

                        {/* right: actions */}
                      <div className="flex flex-col items-end gap-2">
  {t.isPublish === false ? (
    // 🔧 In Development Badge
    <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">
      🚧 In Development
    </div>
  ) : (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => toggleFavorite(t.slug)}
          aria-pressed={isFav}
          aria-label={
            isFav
              ? `Remove ${t.title} from favorites`
              : `Add ${t.title} to favorites`
          }
          className="p-1 rounded hover:bg-slate-100"
          title={isFav ? "Unfavorite" : "Add to favorites"}
        >
          {isFav ? (
            <Star className="w-4 h-4 text-amber-500" />
          ) : (
            <StarOff className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <Link
          href={`/${t.slug}`}
          onClick={() => recordRecent(t.slug)}
          className="px-2 py-1 rounded border text-xs bg-white hover:bg-slate-50"
          title={`Open ${t.title}`}
        >
          Open
        </Link>
      </div>
      <a
        href={`/${t.slug}`}
        onClick={() => recordRecent(t.slug)}
        className="text-xs text-slate-400 hover:text-slate-600"
      >
        Learn <ExternalLink className="inline w-3 h-3" />
      </a>
    </>
  )}
</div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </section>

      {/* Learning resources */}
      <section>
        <div className="rounded-lg border p-4 bg-white shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Learning Resources</h3>
              <p className="text-sm text-slate-600">Hand-picked tutorials and labs for hands-on cybersecurity practice.</p>
            </div>
            <div className="text-sm text-slate-500">Updated weekly</div>
          </div>

          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <a href="https://owasp.org/Top10/" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
              OWASP Top 10 <div className="text-xs text-slate-500">Web app risks</div>
            </a>
            <a href="https://portswigger.net/web-security" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
              PortSwigger Web Security Academy <div className="text-xs text-slate-500">Free labs & tutorials</div>
            </a>
            <a href="https://tryhackme.com/" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
              TryHackMe <div className="text-xs text-slate-500">Guided hands-on rooms</div>
            </a>
            <a href="https://attack.mitre.org/" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
              MITRE ATT&CK <div className="text-xs text-slate-500">Tactics & techniques</div>
            </a>
          </div>
        </div>
      </section>
	  <section>	  <NewsFeedSection /></section>
	  {/* <section> <NetworkTools/></section> */}

    </div>
  );
}
