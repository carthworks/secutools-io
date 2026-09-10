"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie, X } from "lucide-react";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "secutools_cookie_consent_v1";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay to prevent layout jump on load
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      } else {
        setHasConsented(true);
      }
    } catch {
      // localStorage may be disabled
    }
  }, []);

  // Listen for custom trigger to open cookie settings anytime
  useEffect(() => {
    const handleOpenModal = () => setIsVisible(true);
    window.addEventListener("open-cookie-preferences", handleOpenModal);
    return () => window.removeEventListener("open-cookie-preferences", handleOpenModal);
  }, []);

  const savePreferences = (analytics: boolean) => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    setHasConsented(true);
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent("cookie-preferences-saved", { detail: prefs }));
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      role="region"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-5 text-slate-800 dark:text-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Cookie className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            Privacy & Cookie Preferences
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            SecuTools is privacy-first. We run processing locally in your browser. We only use minimal telemetry to measure site speed and stability. No advertising cookies are used.
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          aria-label="Close cookie notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <Link
          href="/cookies"
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          Cookie Policy & Details
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => savePreferences(false)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 transition-colors"
          >
            Reject Analytics
          </button>
          <button
            onClick={() => savePreferences(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </aside>
  );
}
