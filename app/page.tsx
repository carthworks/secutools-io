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
    <div className="min-h-screen px-4 sm:px-2 lg:px-2 py-8 space-y-8">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">Cybersecurity Handy Tools</h1>
        <div className="text-slate-500 hidden sm:block">Practical utilities for cybersecurity engineers, researchers and prompt engineers.</div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="px-3 py-1 rounded border text-sm"
            aria-pressed={darkMode}
            title="Toggle dark mode"
          >
            {darkMode ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-1 sticky top-24 h-fit">
          <div className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">Categories</div>
              <div className="text-xs text-slate-500">Jump</div>
            </div>

            <div className="mt-3 space-y-2">
              {categories.map((c) => (
                <button
                  key={c.title}
                  onClick={() => scrollToCategory(c.title)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 text-sm flex items-center gap-2"
                >
                  <RenderIcon icon={c.icon} className="w-4 h-4" />
                  <span className="flex-1">{c.title}</span>
                  <span className="text-xs text-slate-400">{c.tools.length}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="text-sm font-medium">Filter tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {allTags.map((tg) => {
                  const active = activeTagFilters.includes(tg);
                  return (
                    <button
                      key={tg}
                      onClick={() => toggleTagFilter(tg)}
                      className={`text-xs px-2 py-1 rounded-full border ${active ? "bg-slate-800 text-white" : "bg-white text-slate-700"}`}
                    >
                      {tg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="text-sm font-medium">Favorites</div>
              <div className="mt-2">
                {favoritesResolved.length === 0 ? (
                  <div className="text-xs text-slate-400">No favorites yet</div>
                ) : (
                  favoritesResolved.slice(0, 6).map((t) => (
                    <div key={t.slug} className="flex items-center justify-between text-sm py-1">
                      <Link href={`/${t.slug}`} onClick={() => recordRecent(t.slug)} className="hover:underline">
                        {t.title}
                      </Link>
                      <button onClick={() => toggleFavorite(t.slug)} title="Unfavorite">
                        <Star className="w-4 h-4 text-amber-500" />
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
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <PasswordStrengthTicker />
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools, descriptions, or categories..."
                  aria-label="Search tools"
                  className="w-full border rounded-lg p-3 shadow-sm pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-2">
                  <span className="hidden sm:inline">Press</span>
                  <Kbd>⌘K</Kbd>
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

            {recentResolved.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-2">Recently Used</div>
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
              </div>
            )}
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            {filteredCategories.map((cat) => (
              <div
                key={cat.title}
                ref={(el) => {
                  categoryRefs.current[cat.title] = el;
                }}
                className={`rounded-lg p-4 shadow-sm ${cat.color} border bg-opacity-60`}
              >
                <div className="flex items-center gap-3">
                  <RenderIcon icon={cat.icon} />
                  <h2 className="text-lg font-semibold uppercase tracking-wide">{cat.title}</h2>
                  <div className="ml-auto text-sm text-slate-500">{(cat.tools || []).length} tools</div>
                  <div className="ml-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleCategory(cat.title)}
                      className="text-xs px-2 py-1 rounded border bg-white"
                      aria-expanded={!!openCategories[cat.title]}
                    >
                      {openCategories[cat.title] ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>

                <div className={`mt-4 grid gap-3 ${openCategories[cat.title] ? "block" : "hidden"}`}>
                  {(cat.tools || []).map((t) => {
                    const tags = toolTags(t.slug);
                    const isFav = (favorites || []).includes(t.slug);
                    return (
                      <div
                        key={t.slug}
                        className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-3 shadow-sm flex items-start gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-base">{t.title}</div>
                            <div className="flex gap-1 ml-1">
                              {tags.map((tg) => (
                                <span key={tg} className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                                  {tg}
                                </span>
                              ))}
                            </div>
                            <span className="ml-2 text-xs text-slate-400" title={t.desc}>
                              <Info className="inline w-3 h-3" />
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">{t.desc}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {t.isPublish === false ? (
                            <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">🚧 In Development</div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleFavorite(t.slug)}
                                  aria-pressed={isFav}
                                  aria-label={isFav ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`}
                                  className="p-1 rounded hover:bg-slate-100"
                                  title={isFav ? "Unfavorite" : "Add to favorites"}
                                >
                                  {isFav ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4 text-slate-400" />}
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
                              <a href={`/${t.slug}`} onClick={() => recordRecent(t.slug)} className="text-xs text-slate-400 hover:text-slate-600">
                                Learn <ExternalLink className="inline w-3 h-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!openCategories[cat.title] && (
                  <div className="mt-2 md:hidden">
                    <div className="text-xs text-slate-500">Tap "Expand" to view tools</div>
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
