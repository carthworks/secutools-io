"use client";

import { Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type Period, useTopTools } from "@/lib/useToolUsage";
import { categories } from "@/app/data";

/* Build a slug → title/category map from the registry */
const slugToTitle: Record<string, string> = {};
const slugToCategory: Record<string, string> = {};
for (const cat of categories) {
  for (const t of cat.tools) {
    slugToTitle[t.slug] = t.title;
    slugToCategory[t.slug] = cat.title;
  }
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

/** Medal colours for rank 1-3, muted for the rest */
const rankMedal = (i: number) => {
  if (i === 0) return { dot: "bg-amber-400", num: "text-amber-500 font-extrabold" };
  if (i === 1) return { dot: "bg-slate-400", num: "text-slate-400 font-bold" };
  if (i === 2) return { dot: "bg-orange-400", num: "text-orange-400 font-bold" };
  return { dot: "bg-slate-200 dark:bg-slate-700", num: "text-slate-400 dark:text-slate-500 font-semibold" };
};

interface TrendingToolsProps {
  onToolOpen?: (slug: string) => void;
  limit?: number;
  compact?: boolean;
}

export default function TrendingTools({
  onToolOpen,
  limit = 8,
  compact = false,
}: TrendingToolsProps) {
  const [period, setPeriod] = useState<Period>("week");
  const stats = useTopTools(period, limit);
  const maxCount = stats[0]?.count ?? 1;

  return (
    <div className="space-y-3">

      {/* ── Section label row ── */}
      <div className="flex items-center gap-1.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-orange-400 to-rose-500 shadow-sm">
          <Flame className="w-3 h-3 text-white" />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
          Trending
        </span>
      </div>

      {/* ── Period pill tabs ── */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full p-0.5 gap-0.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1 rounded-full text-[11px] font-semibold transition-all ${
              period === p.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            aria-pressed={period === p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── List / empty state ── */}
      {stats.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700">
          <TrendingUp className="w-6 h-6 text-indigo-300 dark:text-indigo-700" />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed px-3">
            Use tools to see what&apos;s{" "}
            <span className="font-semibold text-indigo-500">trending</span>{" "}
            {period === "day" ? "today" : `this ${period}`}.
          </p>
        </div>
      ) : (
        <ol className="space-y-0.5" aria-label={`Top tools this ${period}`}>
          {stats.map((s, i) => {
            const title = slugToTitle[s.slug] ?? s.slug;
            const category = slugToCategory[s.slug];
            const { dot, num } = rankMedal(i);
            /** width % of the bar relative to top item */
            const barPct = Math.round((s.count / maxCount) * 100);

            return (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}`}
                  onClick={() => onToolOpen?.(s.slug)}
                  className="group relative flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all overflow-hidden"
                >
                  {/* Subtle usage bar background */}
                  <span
                    className="absolute inset-y-0 left-0 bg-indigo-100/60 dark:bg-indigo-900/20 rounded-lg transition-all duration-500"
                    style={{ width: `${barPct}%` }}
                    aria-hidden
                  />

                  {/* Rank dot + number */}
                  <span className="relative z-10 flex items-center justify-center w-5 shrink-0">
                    <span className={`text-xs ${num}`}>{i + 1}</span>
                  </span>

                  {/* Tool name + category */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors truncate">
                      {title}
                    </div>
                    {!compact && category && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {category}
                      </div>
                    )}
                  </div>

                  {/* Count badge */}
                  <span className="relative z-10 shrink-0 tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white shadow-sm">
                    {s.count}×
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
