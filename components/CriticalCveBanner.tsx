"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, X, ShieldAlert } from "lucide-react";

type CriticalCve = {
  id: string;
  vendor: string;
  product: string;
  name: string;
  summary: string;
  cvssScore: number;
  severity: "CRITICAL" | "HIGH";
  dateAdded: string;
  isActivelyExploited: boolean;
};

const DISMISS_STORAGE_KEY = "secutools_dismiss_cve_alert";

export default function CriticalCveBanner() {
  const [cve, setCve] = useState<CriticalCve | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAlert() {
      try {
        const res = await fetch("/api/cve/critical");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.cve && isMounted) {
          const item: CriticalCve = data.cve;
          // Check if user dismissed this specific CVE alert in this session
          const dismissedId = sessionStorage.getItem(DISMISS_STORAGE_KEY);
          if (dismissedId !== item.id) {
            setCve(item);
            setIsVisible(true);
          }
        }
      } catch {
        // Silent fail for network issues
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAlert();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    if (cve) {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, cve.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !cve) return null;

  return (
    <aside
      role="alert"
      aria-label="Critical Security Alert"
      className="relative z-40 bg-gradient-to-r from-rose-950/90 via-red-900/90 to-amber-950/90 text-rose-100 border-b border-rose-700/40 text-xs shadow-md transition-all duration-300"
    >
      <div className="container-page py-2 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Left Side: Status + CVE info */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold uppercase tracking-wider text-[10px] shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            {cve.isActivelyExploited ? (
              <>
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Active Threat</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                <span>Critical Advisory</span>
              </>
            )}
          </div>

          <span className="font-mono font-bold text-rose-200 tracking-tight shrink-0">
            {cve.id}
          </span>

          <span className="hidden md:inline-block text-rose-400/80">•</span>

          <span className="text-rose-100/90 truncate font-medium max-w-[280px] sm:max-w-md md:max-w-xl">
            <span className="font-semibold text-white">{cve.vendor} {cve.product}:</span>{" "}
            {cve.name}
          </span>

          {cve.cvssScore && (
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 font-mono font-semibold text-[10px]">
              CVSS {cve.cvssScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* Right Side: CTA & Dismiss */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            href={`/cve?id=${encodeURIComponent(cve.id)}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-white font-medium hover:text-white transition-colors border border-rose-400/30 hover:border-rose-400/60 shadow-sm"
          >
            <span>Analyze</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss security alert"
            className="p-1 rounded-md text-rose-300 hover:text-white hover:bg-rose-800/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
