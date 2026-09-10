/**
 * useToolUsage – privacy-first, localStorage-only tool usage tracker.
 *
 * Schema stored at USAGE_KEY:
 *   Record<slug, number[]>  – array of UTC epoch timestamps (ms) per slug.
 *   We keep at most MAX_ENTRIES entries per slug (oldest dropped).
 *   Entries older than PRUNE_MS are dropped on each write.
 */
"use client";

import { useCallback, useEffect, useState } from "react";

const USAGE_KEY = "secu_usage_v1";
const MAX_ENTRIES = 200; // per slug
const PRUNE_MS = 31 * 24 * 60 * 60 * 1000; // 31 days

type UsageStore = Record<string, number[]>;

export type Period = "day" | "week" | "month";

const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 31 * 24 * 60 * 60 * 1000,
};

function readStore(): UsageStore {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UsageStore;
  } catch {
    return {};
  }
}

function writeStore(store: UsageStore) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(USAGE_KEY, JSON.stringify(store));
  } catch {}
}

/** Prune entries older than PRUNE_MS and cap per-slug to MAX_ENTRIES */
function pruneStore(store: UsageStore): UsageStore {
  const cutoff = Date.now() - PRUNE_MS;
  const pruned: UsageStore = {};
  for (const [slug, times] of Object.entries(store)) {
    const kept = times.filter((t) => t > cutoff).slice(-MAX_ENTRIES);
    if (kept.length > 0) pruned[slug] = kept;
  }
  return pruned;
}

export function recordToolOpen(slug: string) {
  const store = pruneStore(readStore());
  const existing = store[slug] ?? [];
  store[slug] = [...existing, Date.now()].slice(-MAX_ENTRIES);
  writeStore(store);
  // Emit an event so any mounted component can re-read.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tool-usage-updated"));
  }
}

export type ToolStat = { slug: string; count: number };

export function getTopTools(period: Period, limit = 8): ToolStat[] {
  const store = pruneStore(readStore());
  const cutoff = Date.now() - PERIOD_MS[period];
  const stats: ToolStat[] = Object.entries(store).map(([slug, times]) => ({
    slug,
    count: times.filter((t) => t > cutoff).length,
  }));
  return stats
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getTotalOpens(): number {
  const store = readStore();
  return Object.values(store).reduce((sum, arr) => sum + arr.length, 0);
}

/** React hook – returns top tools for a period, re-renders on usage change. */
export function useTopTools(period: Period, limit = 8): ToolStat[] {
  const [stats, setStats] = useState<ToolStat[]>([]);

  const refresh = useCallback(() => {
    setStats(getTopTools(period, limit));
  }, [period, limit]);

  useEffect(() => {
    refresh();
    window.addEventListener("tool-usage-updated", refresh);
    return () => window.removeEventListener("tool-usage-updated", refresh);
  }, [refresh]);

  return stats;
}
