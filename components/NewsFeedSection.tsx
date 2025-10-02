"use client";

import React, { useEffect, useState } from "react";

type FeedItem = {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string | null;
  source: string;
  excerpt?: string;
};

const FEEDS: { url: string; source: string; color: string }[] = [
  { url: "https://krebsonsecurity.com/feed/", source: "KrebsOnSecurity", color: "bg-red-100 text-red-700" },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer", color: "bg-blue-100 text-blue-700" },
  { url: "https://thehackernews.com/feeds/posts/default?alt=rss", source: "The Hacker News", color: "bg-yellow-100 text-yellow-700" },
  { url: "https://owasp.org/blog/rss/", source: "OWASP", color: "bg-green-100 text-green-700" },
  { url: "https://www.darkreading.com/rss.xml", source: "DarkReading", color: "bg-purple-100 text-purple-700" },
];

const CACHE_KEY = "secu_news_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

function parseRss(xmlText: string, source: string): FeedItem[] {
  if (typeof window === "undefined") return [];
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const items = Array.from(doc.querySelectorAll("item, entry")).slice(0, 20);
  return items.map((el) => {
    const title = (el.querySelector("title")?.textContent || "").trim();
    const link =
      (el.querySelector("link")?.getAttribute("href") ||
        el.querySelector("link")?.textContent ||
        el.querySelector("guid")?.textContent ||
        "") + "";
    const pubDate =
      el.querySelector("pubDate")?.textContent ||
      el.querySelector("updated")?.textContent ||
      el.querySelector("dc\\:date")?.textContent ||
      "";
    const rawExcerpt =
      el.querySelector("description")?.textContent ||
      el.querySelector("summary")?.textContent ||
      el.querySelector("content\\:encoded")?.textContent ||
      "";
    const excerpt = rawExcerpt ? stripHtml(rawExcerpt).slice(0, 200) : "";
    const id = `${source}::${title.slice(0, 80)}::${link.slice(0, 80)}`;

    return {
      id,
      title,
      link: link || "#",
      pubDate,
      isoDate: pubDate ? new Date(pubDate).toISOString() : null,
      source,
      excerpt,
    };
  });
}

function stripHtml(html: string) {
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
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadCache();
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setItems(cached.items.slice(0, max));
      setLastUpdated(cached.at);
      void fetchAll(false);
      return;
    }
    void fetchAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll(showLoading = true) {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const fetches = FEEDS.map(async (f) => {
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(f.url)}`;
        try {
          const res = await fetch(proxied);
          if (!res.ok) throw new Error(`${res.status}`);
          const text = await res.text();
          return parseRss(text, f.source);
        } catch {
          return [] as FeedItem[];
        }
      });

      const results = await Promise.all(fetches);
      const merged = results.flat().sort((a, b) => {
        const da = a.isoDate ? Date.parse(a.isoDate) : 0;
        const db = b.isoDate ? Date.parse(b.isoDate) : 0;
        return db - da;
      });

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
    } catch (err) {
      setError("Failed to fetch feeds. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-indigo-700">🔔 Latest Security News</h3>
          <p className="text-sm text-slate-600">
            Aggregated from trusted cybersecurity feeds. Stay updated with the latest threats and insights.
          </p>
        </div>
        <button
          onClick={() => void fetchAll(true)}
          className="px-3 py-1 text-xs rounded-md border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
        >
          {loading ? "⏳ Loading…" : "🔄 Refresh"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* News Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => {
          const feed = FEEDS.find((f) => f.source === it.source);
          return (
            <a
              key={it.id}
              href={it.link}
              target="_blank"
              rel="noreferrer"
              className="block p-4 rounded-lg shadow hover:shadow-lg transition-all border bg-white group"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`px-2 py-1 text-xs font-semibold rounded ${feed?.color}`}
                >
                  {it.source}
                </div>
              </div>
              <h4 className="font-medium text-slate-800 mt-2 group-hover:text-indigo-700">
                {it.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-3">{it.excerpt}</p>
              <div className="text-xs text-slate-400 mt-2">
                {it.isoDate ? new Date(it.isoDate).toLocaleString() : ""}
              </div>
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-400 mt-2">
        ℹ️ Some feeds may fail due to CORS/rate-limits. Add your own proxy for reliability.
      </div>
    </section>
  );
}
