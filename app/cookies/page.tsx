// File: app/cookies/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings, ShieldCheck, Info } from "lucide-react";

export default function CookiePolicyPage() {
  const [currentPrefs, setCurrentPrefs] = useState<{ analytics: boolean; timestamp?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("secutools_cookie_consent_v1");
      if (stored) {
        setCurrentPrefs(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleOpenConsentModal = () => {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-3">
          <Cookie className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Cookie Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Intro */}
      <div className="p-4 sm:p-6 mb-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          This Cookie Policy explains how <strong className="text-slate-900 dark:text-white">SecuTools.io</strong> uses cookies and similar client-side storage technologies (such as <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">localStorage</code>). We are committed to transparency and data minimization.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleOpenConsentModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Manage Cookie Preferences
          </button>
          {currentPrefs && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Current status: {currentPrefs.analytics ? "Analytics Accepted" : "Analytics Rejected"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed">
        {/* Section 1: What Are Cookies */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            1. What Are Cookies and Local Storage?
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Cookies are small text files stored on your device when you load websites. Local storage (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code>) is a standard web browser mechanism that lets web applications store client-side preferences without sending them to a server on every network request.
          </p>
        </section>

        {/* Section 2: What We Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            2. Categories of Storage We Use
          </h2>

          {/* Strictly Necessary */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Strictly Necessary Storage (Always Active)
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
              Essential for the site to function properly and remember your local interface preferences (e.g. Dark Mode, tool favorites, consent decision). These do not collect personal identifiers.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-2 font-medium">Storage Key</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium">Purpose</th>
                    <th className="p-2 font-medium">Lifespan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400">site_theme / secu_dark</td>
                    <td className="p-2">localStorage</td>
                    <td className="p-2">Stores your chosen light or dark theme</td>
                    <td className="p-2">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400">secu_favs_v1</td>
                    <td className="p-2">localStorage</td>
                    <td className="p-2">Stores your pinned/bookmarked tools locally</td>
                    <td className="p-2">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400">secu_recent_v1</td>
                    <td className="p-2">localStorage</td>
                    <td className="p-2">Stores recently accessed tools locally for quick navigation</td>
                    <td className="p-2">Persistent</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400">secutools_cookie_consent_v1</td>
                    <td className="p-2">localStorage</td>
                    <td className="p-2">Records your cookie & analytics preferences</td>
                    <td className="p-2">1 Year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance & Analytics */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" />
              Performance & Telemetry (Opt-In / Configurable)
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
              We use aggregated, privacy-preserving performance telemetry (Vercel Speed Insights & Analytics) to diagnose page errors and loading performance. No personal profiling or behavioral ad tracking is conducted.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-2 font-medium">Provider</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium">Purpose</th>
                    <th className="p-2 font-medium">Lifespan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="p-2 font-semibold">Vercel Analytics & Speed Insights</td>
                    <td className="p-2">First-party telemetry</td>
                    <td className="p-2">Measures aggregated Core Web Vitals (LCP, CLS, FID) and page load latency</td>
                    <td className="p-2">Session / Anonymous</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Managing Cookies in Browser */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            3. How to Manage Cookies in Your Browser
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            You can modify your browser settings to decline or delete cookies and clear local storage anytime. Note that clearing local storage will reset your saved theme and favorites.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
            <li><strong>Chrome:</strong> Settings &rarr; Privacy and security &rarr; Cookies and other site data</li>
            <li><strong>Firefox:</strong> Settings &rarr; Privacy & Security &rarr; Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences &rarr; Privacy &rarr; Manage Website Data</li>
            <li><strong>Edge:</strong> Settings &rarr; Cookies and site permissions</li>
          </ul>
        </section>

        {/* Section 4: Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            4. Questions and Contact
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            For questions regarding our use of cookies or privacy practices, please contact us via our{" "}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Contact Page
            </Link>{" "}
            or email <a href="mailto:tkarthikeyan@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">tkarthikeyan@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
