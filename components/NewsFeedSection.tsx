"use client";

import React, { useEffect, useState } from "react";

/**
 * NewsFeedSection
 * - Fetches multiple RSS feeds via AllOrigins (CORS-friendly)
 * - Parses RSS XML in-browser with DOMParser
 * - Caches results in localStorage with TTL
 * - Shows latest N items, with source, time, excerpt, and link
 * - Graceful errors & UI fallback
 */

type FeedItem = {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string | null;
  source: string;
  excerpt?: string;
};

const FEEDS: { url: string; source: string }[] = [
  { url: "https://krebsonsecurity.com/feed/", source: "KrebsOnSecurity" },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer" },
  { url: "https://thehackernews.com/feeds/posts/default?alt=rss", source: "The Hacker News" },
  { url: "https://owasp.org/blog/rss/", source: "OWASP" },
  { url: "https://www.darkreading.com/rss.xml", source: "DarkReading" },
  // add or remove feeds as you like
];

const CACHE_KEY = "secu_news_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

function parseRss(xmlText: string, source: string): FeedItem[] {
  if (typeof window === "undefined") return [];
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  // if errors
  if (doc.querySelector("parsererror")) return [];

  // RSS <item> or Atom <entry>
  const items = Array.from(doc.querySelectorAll("item, entry")).slice(0, 20);
  const out: FeedItem[] = items.map((el) => {
    const title = (el.querySelector("title")?.textContent || "").trim();
    const link =
      (el.querySelector("link")?.getAttribute("href") ||
        el.querySelector("link")?.textContent ||
        el.querySelector("guid")?.textContent ||
        "") + "";
    const pubDate = (el.querySelector("pubDate")?.textContent ||
      el.querySelector("updated")?.textContent ||
      el.querySelector("dc\\:date")?.textContent ||
      "") as string;
    // excerpt: use description or summary or content:encoded
    const rawExcerpt =
      el.querySelector("description")?.textContent ||
      el.querySelector("summary")?.textContent ||
      el.querySelector("content\\:encoded")?.textContent ||
      "";
    const excerpt = rawExcerpt ? stripHtml(rawExcerpt).slice(0, 280) : "";
    const id = `${source}::${title.slice(0, 80)}::${link.slice(0, 80)}`;

    return { id, title, link: link || "#", pubDate, isoDate: pubDate ? new Date(pubDate).toISOString() : null, source, excerpt };
  });

  return out;
}

function stripHtml(html: string) {
  // quick strip tags
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function loadCache(): { at: number; items: FeedItem[] } | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveCache(payload: { at: number; items: FeedItem[] }) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

export default function NewsFeedSection({ max = 8 }: { max?: number }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    const cached = loadCache();
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setItems(cached.items.slice(0, max));
      setLastUpdated(cached.at);
      // fetch in background to refresh cache
      void fetchAll(false);
      return;
    }
    void fetchAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
useEffect(() => {
  setMounted(true);
}, []);
if (!mounted) return null; // or a small loading skeleton


  async function fetchAll(showLoading = true) {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      // fetch feeds in parallel
      const fetches = FEEDS.map(async (f) => {
        // using AllOrigins free CORS proxy — replace with your own proxy if needed
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(f.url)}`;
        try {
          const res = await fetch(proxied);
          if (!res.ok) throw new Error(`${res.status}`);
          const text = await res.text();
          const parsed = parseRss(text, f.source);
          return parsed;
        } catch (err) {
          // individual feed error — return empty
          console.warn("feed error", f.url, err);
          return [] as FeedItem[];
        }
      });

      const results = await Promise.all(fetches);
      const merged = results.flat().sort((a, b) => {
        // sort by isoDate if available; otherwise keep order
        const da = a.isoDate ? Date.parse(a.isoDate) : 0;
        const db = b.isoDate ? Date.parse(b.isoDate) : 0;
        return db - da;
      });

      // dedupe by id (title+link)
      const seen = new Set<string>();
      const uniq: FeedItem[] = [];
      for (const it of merged) {
        if (!it.title || !it.link) continue;
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        uniq.push(it);
      }

      saveCache({ at: Date.now(), items: uniq });
      setItems(uniq.slice(0, max));
      setLastUpdated(Date.now());
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch feeds — check network or CORS.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Latest Security News</h3>
          <p className="text-sm text-slate-600">Aggregated from community security feeds (client-side). Click an item to open the source.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => void fetchAll(true)}
            className="px-2 py-1 border rounded text-xs bg-white"
            title="Refresh feeds"
          >
            Refresh
          </button>
          <div>{loading ? "Loading…" : lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : ""}</div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <a
            key={it.id}
            href={it.link}
            target="_blank"
            rel="noreferrer"
            className="block p-3 border rounded hover:shadow-md bg-white min-h-[64px]"
            title={`${it.title} — ${it.source}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                  {it.source.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-slate-500 mt-1">{it.excerpt || it.source}</div>
                <div className="text-xs text-slate-400 mt-1">{it.isoDate ? new Date(it.isoDate).toLocaleString() : ""} • {it.source}</div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="text-xs text-slate-400 mt-2">
        Tip: if some feeds fail due to CORS or rate-limits, add a small serverless proxy (Netlify/ Vercel function) or replace the AllOrigins proxy with your own.
      </div>
    </section>
  );
}
