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
  } catch { }

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
  ]);
  const apiNeeded = new Set(["ip-dns", "cve", "threat", "whois", "headers-check", "aws-s3"]);
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
  // Render placeholder on server to avoid SSR/CSR SVG markup mismatches (hydration errors)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const Comp = IconComp as any;
  if (!mounted) return <span className={`${className} inline-block`} aria-hidden />;
  return <Comp className={className} aria-hidden />;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="bg-slate-100 border rounded px-2 py-0.5 text-xs">{children}</kbd>;
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
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // mount
  useEffect(() => {
    setMounted(true);

    const favs = loadJSON<string[]>(FAVORITES_KEY) ?? [];
    const rec = loadJSON<string[]>(RECENT_KEY) ?? [];
    setFavorites(Array.isArray(favs) ? favs : []);
    setRecent(Array.isArray(rec) ? rec : []);

    try {
      const dm = typeof window !== "undefined" && localStorage.getItem("secu_dark") === "1";
      setDarkMode(Boolean(dm));
      if (dm) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch { }
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

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("secu_dark", darkMode ? "1" : "0");
      if (darkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch { }
  }, [darkMode, mounted]);

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
    <div className="min-h-screen px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SecuTools.io
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Practical utilities for cybersecurity engineers & researchers
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border-2 border-slate-300 hover:border-indigo-400 text-xs sm:text-sm font-medium transition-all hover:shadow-md"
            aria-pressed={darkMode}
            title="Toggle dark mode"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-1 sticky top-24 h-fit">
          <div className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Categories</div>
              <div className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-full">Quick Jump</div>
            </div>

            <div className="space-y-1">
              {categories.map((c, idx) => (
                <button
                  key={c.title}
                  onClick={() => scrollToCategory(c.title)}
                  className="group w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 text-sm flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  style={{ animation: `slideIn 0.3s ease-out ${idx * 0.05}s both` }}
                >
                  <div className={`p-2 rounded-lg ${c.color} group-hover:scale-110 transition-transform duration-200`}>
                    <RenderIcon icon={c.icon} className="w-4 h-4" />
                  </div>
                  <span className="flex-1 font-medium group-hover:text-indigo-700 transition-colors">{c.title}</span>
                  <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-semibold px-2 py-1 bg-slate-100 group-hover:bg-indigo-100 rounded-full transition-all">
                    {c.tools.filter(t => t.isPublish).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                Filter Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tg) => {
                  const active = activeTagFilters.includes(tg);
                  return (
                    <button
                      key={tg}
                      onClick={() => toggleTagFilter(tg)}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all duration-200 hover:scale-105 ${active
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                    >
                      {tg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Favorites
              </div>
              <div className="space-y-1">
                {favoritesResolved.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2 px-3 bg-slate-50 rounded-lg">
                    No favorites yet. Click ⭐ to add!
                  </div>
                ) : (
                  favoritesResolved.slice(0, 6).map((t, idx) => (
                    <div
                      key={t.slug}
                      className="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200"
                      style={{ animation: `slideIn 0.2s ease-out ${idx * 0.05}s both` }}
                    >
                      <Link
                        href={`/${t.slug}`}
                        onClick={() => recordRecent(t.slug)}
                        className="text-sm hover:text-indigo-600 transition-colors flex-1 font-medium group-hover:translate-x-1 transition-transform duration-200"
                      >
                        {t.title}
                      </Link>
                      <button
                        onClick={() => toggleFavorite(t.slug)}
                        title="Unfavorite"
                        className="p-1 rounded-lg hover:bg-amber-100 transition-all duration-200 hover:scale-110"
                      >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </aside>

        {/* Main column */}
        <main className="md:col-span-3 space-y-4 sm:space-y-6">
          <section className="rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 lg:p-6 shadow-sm">
            <PasswordStrengthTicker />
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools..."
                  aria-label="Search tools"
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-lg p-3 sm:p-3.5 shadow-sm pr-16 sm:pr-20 text-sm sm:text-base outline-none transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-2">
                  <span className="hidden sm:inline">Press</span>
                  <Kbd>⌘K</Kbd>
                </div>
              </div>

              {/* Favorites - Hidden on mobile, shown on tablet+ */}
              <div className="hidden lg:flex gap-2 items-center">
                <div className="text-sm text-slate-600 font-medium">Favorites</div>
                <div className="flex gap-2">
                  {favoritesResolved.length === 0 ? (
                    <div className="text-sm text-slate-400 px-3 py-2 rounded-lg border bg-slate-50">No favorites</div>
                  ) : (
                    favoritesResolved.slice(0, 4).map((t) => (
                      <Link
                        key={t.slug}
                        href={`/${t.slug}`}
                        onClick={() => recordRecent(t.slug)}
                        className="px-3 py-2 rounded-lg border-2 border-slate-200 hover:border-indigo-400 bg-white text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                        title={t.title}
                      >
                        <span className="font-medium truncate max-w-[120px]">{t.title}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {recentResolved.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <div className="text-xs sm:text-sm text-slate-500 mb-2 font-medium">Recently Used</div>
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
                  {recentResolved.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${t.slug}`}
                      onClick={() => recordRecent(t.slug)}
                      className="text-xs sm:text-sm whitespace-nowrap px-3 py-1.5 border-2 border-slate-200 hover:border-indigo-400 rounded-lg bg-white hover:bg-indigo-50 transition-all flex items-center gap-2"
                    >
                      <span>{t.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredCategories.map((cat, catIdx) => (
              <div
                key={cat.title}
                ref={(el) => {
                  categoryRefs.current[cat.title] = el;
                }}
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 ${cat.color} border-2 border-white/50 backdrop-blur-sm bg-opacity-70 hover:scale-[1.01]`}
                style={{ animation: `fadeInUp 0.5s ease-out ${catIdx * 0.1}s both` }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-md">
                      <RenderIcon icon={cat.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      {cat.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="text-xs sm:text-sm text-slate-600 font-semibold px-2 sm:px-3 py-1 bg-white/70 rounded-full shadow-sm flex-1 sm:flex-none text-center">
                      {(cat.tools || []).filter(t => t.isPublish).length} tools
                    </div>
                    <button
                      onClick={() => toggleCategory(cat.title)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${openCategories[cat.title]
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                          : "bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                        }`}
                      aria-expanded={!!openCategories[cat.title]}
                    >
                      {openCategories[cat.title] ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>

                <div className={`grid gap-3 ${openCategories[cat.title] ? "block" : "hidden"}`}>
                  {(cat.tools || []).map((t, toolIdx) => {
                    const tags = toolTags(t.slug);
                    const isFav = (favorites || []).includes(t.slug);
                    return (
                      <div
                        key={t.slug}
                        className="group rounded-lg sm:rounded-xl border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white hover:border-indigo-300 p-3 sm:p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                        style={{ animation: `slideInUp 0.3s ease-out ${toolIdx * 0.05}s both` }}
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <div className="font-semibold text-sm sm:text-base group-hover:text-indigo-700 transition-colors">
                                {t.title}
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {tags.map((tg) => (
                                  <span
                                    key={tg}
                                    className="text-xs px-2 py-0.5 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full text-slate-700 font-medium border border-slate-300 group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:border-indigo-300 transition-all duration-200"
                                  >
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t.desc}</div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                            {t.isPublish === false ? (
                              <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 text-xs font-semibold border-2 border-amber-200 shadow-sm w-full sm:w-auto text-center">
                                🚧 Coming Soon
                              </div>
                            ) : (
                              <>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => toggleFavorite(t.slug)}
                                    aria-pressed={isFav}
                                    aria-label={isFav ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`}
                                    className={`p-2 sm:p-2.5 rounded-lg transition-all duration-200 hover:scale-110 ${isFav
                                        ? "bg-amber-100 hover:bg-amber-200"
                                        : "bg-slate-100 hover:bg-slate-200"
                                      }`}
                                    title={isFav ? "Unfavorite" : "Add to favorites"}
                                  >
                                    {isFav ? (
                                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    ) : (
                                      <StarOff className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>
                                  <Link
                                    href={`/${t.slug}`}
                                    onClick={() => recordRecent(t.slug)}
                                    className={`px-4 py-2 rounded-lg ${cat.color} border-2 border-white text-slate-900 text-xs font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1 flex-1 sm:flex-none`}
                                    title={`Open ${t.title}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="hidden sm:inline">Open</span>
                                  </Link>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!openCategories[cat.title] && (
                  <div className="mt-3 text-center">
                    <div className="text-xs sm:text-sm text-slate-600 italic bg-white/50 rounded-lg py-2 px-4 inline-block">
                      Click "Expand" to view {cat.tools.filter(t => t.isPublish).length} tools
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>

          <style jsx>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </main>
      </div>
    </div>
  );
}
