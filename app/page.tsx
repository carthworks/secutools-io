"use client";

import {
  ExternalLink,
  Star,
} from "lucide-react";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories } from "./data";
import { recordToolOpen } from "@/lib/useToolUsage";
import TrendingTools from "@/components/TrendingTools";
import GalaxyGlobeBackground from "@/components/GalaxyGlobeBackground";



/* ----------------------------- Types & Constants ---------------------------- */
type Tool = { slug: string; title: string; desc: string; isPublish: boolean };
type Category = { title: string; icon: any; color: string; tools: Tool[] };

const FAVORITES_KEY = "secu_favs_v1";

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
    "qr-code-generator",
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



/* ------------------------------- Main component ------------------------------- */
export default function HomePage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    categories.reduce<Record<string, boolean>>((acc, c, idx) => {
      acc[c.title] = idx < 2;
      return acc;
    }, {})
  );
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // mount
  useEffect(() => {
    setMounted(true);
    const favs = loadJSON<string[]>(FAVORITES_KEY) ?? [];
    setFavorites(Array.isArray(favs) ? favs : []);
  }, []);

  // persist
  useEffect(() => {
    if (!mounted) return;
    saveJSON(FAVORITES_KEY, favorites);
  }, [favorites, mounted]);



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

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev];
      return next.slice(0, 20);
    });
  }, []);

  const recordRecent = useCallback((slug: string) => {
    recordToolOpen(slug);
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
      <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg shadow-indigo-500/5 group">
        {/* Animated Galaxy & Color-shifting 3D Globe */}
        <GalaxyGlobeBackground />

        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-emerald-400 bg-clip-text text-transparent">
            SecuTools.io
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
            Free, fast, and privacy-preserving utilities for cybersecurity researchers, SOC analysts, and students.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3.5 py-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero Server Storage &middot; Client-Side Execution</span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-1 sticky top-24 h-fit space-y-3">

          {/* ── CATEGORIES card ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Categories</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-full font-semibold border border-indigo-100 dark:border-indigo-900">
                Quick Jump
              </span>
            </div>

            <div className="px-2 py-2 space-y-0.5">
              {categories.map((c) => (
                <button
                  key={c.title}
                  onClick={() => scrollToCategory(c.title)}
                  className="group w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  <div className="shrink-0 p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 transition-all">
                    <RenderIcon icon={c.icon} className="w-3.5 h-3.5" />
                  </div>
                  <span className="flex-1 text-xs font-medium truncate text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {c.title}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                    {c.tools.filter(t => t.isPublish).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── FILTER TAGS card ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Filter Tags</span>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-1.5">
              {allTags.map((tg) => {
                const active = activeTagFilters.includes(tg);
                return (
                  <button
                    key={tg}
                    onClick={() => toggleTagFilter(tg)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    }`}
                  >
                    {tg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── FAVORITES card ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Favorites
              </span>
              {favoritesResolved.length > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  {favoritesResolved.length}
                </span>
              )}
            </div>
            <div className="px-2 py-2">
              {favoritesResolved.length === 0 ? (
                <div className="m-2 py-4 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border border-dashed border-amber-200 dark:border-amber-900 flex flex-col items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-400" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    Click <span className="text-amber-500">★</span> on any tool
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {favoritesResolved.slice(0, 6).map((t) => (
                    <div
                      key={t.slug}
                      className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                    >
                      <Link
                        href={`/${t.slug}`}
                        onClick={() => recordRecent(t.slug)}
                        className="text-xs font-medium flex-1 truncate text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors"
                      >
                        {t.title}
                      </Link>
                      <button
                        onClick={() => toggleFavorite(t.slug)}
                        title="Unfavorite"
                        className="shrink-0 p-1 rounded-md text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                        aria-label={`Unfavorite ${t.title}`}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── TRENDING card ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500" />
            <div className="px-4 py-4">
              <TrendingTools onToolOpen={recordRecent} compact />
            </div>
          </div>

        </aside>

        {/* Main column */}
        <main className="md:col-span-3 space-y-6">

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
