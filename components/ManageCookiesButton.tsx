"use client";

import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";

export default function ManageCookiesButton() {
  const [currentPrefs, setCurrentPrefs] = useState<{ analytics: boolean } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("secutools_cookie_consent_v1");
      if (stored) setCurrentPrefs(JSON.parse(stored));
    } catch {}

    const handleSaved = (e: any) => {
      if (e.detail) setCurrentPrefs(e.detail);
    };
    window.addEventListener("cookie-preferences-saved", handleSaved);
    return () => window.removeEventListener("cookie-preferences-saved", handleSaved);
  }, []);

  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  };

  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm"
      >
        <Settings className="w-4 h-4" />
        Manage Cookie Preferences
      </button>
      {currentPrefs && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Status: {currentPrefs.analytics ? "Analytics Accepted" : "Analytics Rejected"}
        </span>
      )}
    </div>
  );
}
