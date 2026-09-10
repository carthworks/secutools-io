"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Hash } from "lucide-react";
import { categories } from "@/app/data";

/* ── flat index of all tools with category name ── */
type IndexedTool = {
  slug: string;
  title: string;
  desc: string;
  category: string;
  isPublish: boolean;
};

const allTools: IndexedTool[] = categories.flatMap((cat) =>
  cat.tools.map((t) => ({ ...t, category: cat.title }))
);

function search(q: string): IndexedTool[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return allTools
    .filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.desc.toLowerCase().includes(s) ||
        t.slug.toLowerCase().includes(s) ||
        t.category.toLowerCase().includes(s)
    )
    .slice(0, 20);
}

/* Group results by category */
function groupByCategory(tools: IndexedTool[]) {
  const map = new Map<string, IndexedTool[]>();
  for (const t of tools) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category)!.push(t);
  }
  return map;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onToolOpen?: (slug: string) => void;
}

export function CommandPalette({ open, onClose, onToolOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = search(query);
  const grouped = groupByCategory(results);

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  /* Keyboard nav */
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[activeIdx]) {
        onToolOpen?.(results[activeIdx].slug);
        onClose();
        window.location.href = `/${results[activeIdx].slug}`;
      }
    },
    [results, activeIdx, onClose, onToolOpen]
  );

  if (!open) return null;

  let flatIdx = 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search tools"
        aria-modal
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKey}
            placeholder="Search tools — hash, CVE, JWT, PCAP…"
            className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            aria-label="Search tools"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {query === "" && (
            <div className="px-4 py-8 text-center">
              <Hash className="w-8 h-8 text-indigo-200 dark:text-indigo-900 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                Start typing to search across all tools…
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                Use ↑↓ to navigate · Enter to open · Esc to close
              </p>
            </div>
          )}

          {query !== "" && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No tools found for <span className="font-semibold text-slate-600 dark:text-slate-300">&ldquo;{query}&rdquo;</span>
            </div>
          )}

          {Array.from(grouped.entries()).map(([cat, tools]) => (
            <div key={cat}>
              {/* Category header */}
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {cat}
                </span>
              </div>
              {tools.map((t) => {
                const idx = flatIdx++;
                const isActive = idx === activeIdx;
                return (
                  <Link
                    key={t.slug}
                    href={`/${t.slug}`}
                    onClick={() => { onToolOpen?.(t.slug); onClose(); }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"}`}>
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {t.desc}
                      </div>
                    </div>
                    {!t.isPublish && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        Soon
                      </span>
                    )}
                    {isActive && (
                      <ArrowRight className="shrink-0 w-4 h-4 text-indigo-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-right">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Trigger button: shows in nav, opens palette on click ── */
interface SearchTriggerProps {
  onOpen: () => void;
}

export function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 transition-colors w-full max-w-xs"
      aria-label="Search tools"
      id="search-trigger"
    >
      <Search className="w-4 h-4 text-indigo-500 shrink-0" />
      <span className="flex-1 text-left truncate">Search tools…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-600 text-slate-400 bg-white dark:bg-slate-900">
        ⌘K
      </kbd>
    </button>
  );
}
