"use client";

import {
  ExternalLink,
  Info,
  Star,
  StarOff,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories } from "./data";

const PasswordStrengthTicker = dynamic(() => import("./password-strength/page"), { ssr: false });

/* ----------------------------- Types & Constants ---------------------------- */
type Tool = { slug: string; title: string; desc: string; isPublish: boolean };
type Category = { title: string; icon: any; color: string; tools: Tool[] };

const FAVORITES_KEY = "secu_favs_v1";
const RECENT_KEY = "secu_recent_v1";

/* ------------------------------- Helpers -------------------------------- */
function loadJSON<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function saveJSON(key: string, value: any) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function toolTags(slug: string) {
  const clientOnly = new Set([
    "hash",
    "jwt",
    "password",
    "logs",
    "timestamp",
    "pcap",
    "subdomain",
    "payloads",
    "cheatsheets",
    "base64",
    "pgp",
    "aes-rsa",
    "converter",
    "obfuscator",
    "hash-id",
    "hash-collision",
    "cert-parser",
  ]);
  const apiNeeded = new Set(["ip-dns", "cve", "threat", "whois", "headers-check", "aws-s3", "cors-check", "qr-code-check", "email-analyzer"]);
  const tags: string[] = [];
  if (clientOnly.has(slug)) tags.push("client-only");
  if (apiNeeded.has(slug)) tags.push("api");
  if (slug === "pcap") tags.push("upload");
  if (slug === "payloads") tags.push("payloads");
  if (slug === "cve" || slug === "cve-feed") tags.push("vuln");
  if (slug === "subdomain") tags.push("discovery");
  if (slug === "logs" || slug === "json-xml") tags.push("analysis");
  return tags;
}

/* ------------------------- Small presentational components ------------------------- */
function RenderIcon({ icon: IconComp, className = "w-5 h-5" }: { icon: any; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const Comp = IconComp as any;
  if (!mounted) return <span className={`${className} inline-block`} aria-hidden="true" />;
  return <Comp className={className} aria-hidden="true" />;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 font-mono">{children}</kbd>;
}

/* ------------------------------- Main component ------------------------------- */
export default function HomePage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    categories.reduce<Record<string, boolean>>((acc, c, idx) => {
      acc[c.title] = idx < 2;
      return acc;
    }, {})
  );
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // mount
  useEffect(() => {
    setMounted(true);
    const favs = loadJSON<string[]>(FAVORITES_KEY) ?? [];
    const rec = loadJSON<string[]>(RECENT_KEY) ?? [];
    setFavorites(Array.isArray(favs) ? favs : []);
    setRecent(Array.isArray(rec) ? rec : []);
  }, []);

  // persist
  useEffect(() => {
    if (!mounted) return;
    saveJSON(FAVORITES_KEY, favorites);
  }, [favorites, mounted]);

  useEffect(() => {
    if (!mounted) return;
    saveJSON(RECENT_KEY, recent);
  }, [recent, mounted]);

  // keyboard shortcut: focus search
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

  const allToolsFlat: Tool[] = useMemo(() => categories.flatMap((c) => c.tools), []);
  const allTags = useMemo(() => {
    const s = new Set<string>();
    allToolsFlat.forEach((t) => toolTags(t.slug).forEach((tg) => s.add(tg)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allToolsFlat]);

  const filteredCategories = useMemo(
    () =>
      categories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter((t) => {
            const q = (query || "").trim().toLowerCase();
            const matchesQuery =
              q.length === 0 || [t.title, t.desc, cat.title].some((field) => String(field || "").toLowerCase().includes(q));
            const tTags = toolTags(t.slug);
            const matchesTags = (activeTagFilters || []).length === 0 || activeTagFilters.every((f) => tTags.includes(f));
            return matchesQuery && matchesTags;
          }),
        }))
        .filter((cat) => (cat.tools || []).length > 0),
    [query, activeTagFilters]
  );

  const favoritesResolved = (favorites || [])
    .map((s) => allToolsFlat.find((t) => t.slug === s))
    .filter(Boolean) as Tool[];
  const recentResolved = (recent || [])
    .map((s) => allToolsFlat.find((t) => t.slug === s))
    .filter(Boolean) as Tool[];

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev];
      return next.slice(0, 20);
    });
  }, []);

  const recordRecent = useCallback((slug: string) => {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)];
      return next.slice(0, 12);
    });
  }, []);

  const scrollToCategory = useCallback((title: string) => {
    const el = categoryRefs.current ? categoryRefs.current[title] : null;
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleCategory = useCallback((title: string) => {
    setOpenCategories((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const toggleTagFilter = useCallback((tag: string) => {
    setActiveTagFilters((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag, ...prev]));
  }, []);

  return (
    <div className="min-h-screen space-y-6 sm:space-y-8">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
            SecuTools.io
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Free, fast, and privacy-preserving utilities for cybersecurity researchers, SOC analysts, and students.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero Server Storage &middot; Client-Side Execution</span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-1 sticky top-24 h-fit space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">Categories</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full font-medium">Quick Jump</div>
            </div>

            <div className="space-y-1">
              {categories.map((c, idx) => (
                <button
                  key={c.title}
                  onClick={() => scrollToCategory(c.title)}
                  className="group w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm flex items-center gap-2.5 transition-all text-slate-700 dark:text-slate-300"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <RenderIcon icon={c.icon} className="w-4 h-4" />
                  </div>
                  <span className="flex-1 font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.title}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                    {c.tools.filter(t => t.isPublish).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Filter Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tg) => {
                  const active = activeTagFilters.includes(tg);
                  return (
                    <button
                      key={tg}
                      onClick={() => toggleTagFilter(tg)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        }`}
                    >
                      {tg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Favorites ({favoritesResolved.length})
              </div>
              <div className="space-y-1">
                {favoritesResolved.length === 0 ? (
                  <div className="text-xs text-slate-400 dark:text-slate-500 italic py-2 px-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    Click ⭐ on any tool to pin here
                  </div>
                ) : (
                  favoritesResolved.slice(0, 6).map((t) => (
                    <div
                      key={t.slug}
                      className="group flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Link
                        href={`/${t.slug}`}
                        onClick={() => recordRecent(t.slug)}
                        className="text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-1 truncate font-medium"
                      >
                        {t.title}
                      </Link>
                      <button
                        onClick={() => toggleFavorite(t.slug)}
                        title="Unfavorite"
                        className="p-1 text-slate-400 hover:text-amber-500"
                        aria-label={`Unfavorite ${t.title}`}
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="md:col-span-3 space-y-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
            <PasswordStrengthTicker />
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools (e.g. hash, CVE, PCAP, ASN, JWT)..."
                  aria-label="Search tools"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl p-3 shadow-sm pr-16 text-sm text-slate-900 dark:text-slate-100 outline-none transition"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-2">
                  <span className="hidden sm:inline">Press</span>
                  <Kbd>⌘K</Kbd>
                </div>
              </div>

              {/* Favorites row */}
              {favoritesResolved.length > 0 && (
                <div className="hidden lg:flex gap-1.5 items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick:</span>
                  {favoritesResolved.slice(0, 3).map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${t.slug}`}
                      onClick={() => recordRecent(t.slug)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 truncate max-w-[110px]"
                      title={t.title}
                    >
                      <span className="truncate">{t.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {recentResolved.length > 0 && (
              <div className="pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Recently Used</div>
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
                  {recentResolved.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${t.slug}`}
                      onClick={() => recordRecent(t.slug)}
                      className="text-xs whitespace-nowrap px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                    >
                      <span>{t.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Categories Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredCategories.map((cat) => (
              <div
                key={cat.title}
                ref={(el) => {
                  categoryRefs.current[cat.title] = el;
                }}
                className="rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <RenderIcon icon={cat.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {cat.title}
                        </h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {(cat.tools || []).filter(t => t.isPublish).length} tools available
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCategory(cat.title)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                      aria-expanded={!!openCategories[cat.title]}
                    >
                      {openCategories[cat.title] ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  <div className={`grid gap-2.5 ${openCategories[cat.title] ? "block" : "hidden"}`}>
                    {(cat.tools || []).map((t) => {
                      const tags = toolTags(t.slug);
                      const isFav = (favorites || []).includes(t.slug);
                      return (
                        <div
                          key={t.slug}
                          className="group rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 p-3.5 transition-all shadow-none hover:shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link
                                  href={`/${t.slug}`}
                                  onClick={() => recordRecent(t.slug)}
                                  className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                >
                                  {t.title}
                                </Link>
                                <div className="flex gap-1 flex-wrap">
                                  {tags.map((tg) => (
                                    <span
                                      key={tg}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                                    >
                                      {tg}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{t.desc}</p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {t.isPublish === false ? (
                                <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-200 dark:border-amber-800">
                                  Soon
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => toggleFavorite(t.slug)}
                                    aria-pressed={isFav}
                                    aria-label={isFav ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`}
                                    className={`p-1.5 rounded-lg border transition ${isFav
                                        ? "border-amber-300 bg-amber-50 dark:bg-amber-950/50 text-amber-500"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                      }`}
                                    title={isFav ? "Unfavorite" : "Add to favorites"}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-500" : ""}`} />
                                  </button>
                                  <Link
                                    href={`/${t.slug}`}
                                    onClick={() => recordRecent(t.slug)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm flex items-center gap-1"
                                    title={`Open ${t.title}`}
                                  >
                                    <span>Open</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!openCategories[cat.title] && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => toggleCategory(cat.title)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Show {cat.tools.filter(t => t.isPublish).length} tools &rarr;
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
