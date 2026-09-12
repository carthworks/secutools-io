"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Section from "@/components/Section";
import { Search, Loader2 } from "lucide-react";

function CVEContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "CVE-2023-12345";
  const [id, setId] = useState(initialId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(targetId?: string) {
    const queryId = (targetId || id).trim();
    if (!queryId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: queryId }),
      });
      setData(await res.json());
    } catch {
      setData({ error: "Failed to connect to CVE lookup service." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const paramId = searchParams.get("id");
    if (paramId) {
      setId(paramId);
      lookup(paramId);
    }
  }, [searchParams]);

  return (
    <div className="space-y-8">
      <Section title="CVE Lookup" subtitle="Real-time vulnerability analysis using CIRCL & NVD data">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. CVE-2024-6387"
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-sm"
            />
            <button
              onClick={() => lookup()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Analyze</span>
            </button>
          </div>

          {data && (
            <div className="mt-4">
              <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-800 dark:text-slate-200 max-h-[600px] overflow-auto shadow-sm">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

export default function CVEPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading CVE tool...</div>}>
      <CVEContent />
    </Suspense>
  );
}