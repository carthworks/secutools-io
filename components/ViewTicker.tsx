"use client";

import React, { useEffect, useState } from "react";


/**
 * Pure client-side ViewTicker
 * - Fetches visitor IP using https://api.ipify.org
 * - Stores and increments view count in localStorage
 * - Displays both as a smooth ticker at the footer
 */

export default function ViewTicker() {
  const [ip, setIp] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // load & increment view count from localStorage
    try {
      const prev = parseInt(localStorage.getItem("view_count") || "0", 10);
      const newCount = prev + 1;
      localStorage.setItem("view_count", String(newCount));
      setCount(newCount);
    } catch {
      setCount(1);
    }

    // fetch public IP from ipify
    (async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIp(data.ip ?? null);
      } catch (e: any) {
        setError("Cannot fetch IP");
      }
    })();
  }, []);

  const maskedIp =
    ip?.replace(/\.\d+$/, ".***") || (error ? "unavailable" : "loading…");

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <div className="flex items-center gap-1">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className="opacity-70"
          aria-hidden
        >
          <path
            d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v6a6 6 0 0012 0V7l-4 2z"
            fill="currentColor"
          />
        </svg>
        <span>Local views: {count}</span>
      </div>

      <div className="overflow-hidden flex-1 text-center sm:text-right">
        {ip && (
          <div className="inline-block whitespace-nowrap animate-marquee">
            <span className="px-2">Your IP (masked):</span>
            <span className="font-mono px-1">{maskedIp}</span>
            <span className="px-2">• Thanks for visiting SecuTools ⚡</span>
          </div>
        )}
        {!ip && !error && <div className="text-slate-400">Fetching IP…</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>

      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          animation: marquee 14s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
