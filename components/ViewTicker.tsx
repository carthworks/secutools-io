"use client";

import React, { useEffect, useState } from "react";

/**
 * ViewTicker (Client-Only)
 * - Tracks local view count in localStorage
 * - Fetches public IP via ipify (client-side only)
 * - Always shows view count
 * - Hides IP ticker if the IP is 115.96.3.71
 * - Fully responsive (mobile/tablet/desktop)
 */

export default function ViewTicker() {
  const [ip, setIp] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hideIp, setHideIp] = useState<boolean>(false);

  useEffect(() => {
    // 🔹 Always track local view count
    try {
      const prev = parseInt(localStorage.getItem("view_count") || "0", 10);
      const newCount = prev + 1;
      localStorage.setItem("view_count", String(newCount));
      setCount(newCount);
    } catch {
      setCount(1);
    }

    // 🔹 Fetch public IP (for ticker)
    (async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        const currentIp = data.ip ?? null;

        // hide ticker if this is your IP
        if (currentIp === "115.96.3.71") {
          setHideIp(true);
        } else {
          setIp(currentIp);
        }
      } catch (e) {
        setError("Cannot fetch IP");
      }
    })();
  }, []);

  const maskedIp =
    ip?.replace(/\.\d+$/, ".***") || (error ? "unavailable" : "loading…");

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 px-3 sm:px-0 w-full">
      {/* Always show local count */}
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

      {/* Show IP ticker unless hidden */}
      {!hideIp && (
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
      )}

      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          animation: marquee 14s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
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
