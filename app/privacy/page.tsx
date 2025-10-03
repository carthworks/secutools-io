// File: app/privacy/page.tsx
"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      {/* Intro */}
      <section className="mb-8">
        <p className="text-lg">
          At <span className="font-semibold">SecuTools.io</span>, your privacy
          matters. This site is built for cybersecurity students and
          professionals and designed to be{" "}
          <span className="font-semibold">fast, safe, and tracking-free</span>.
          Most tools run entirely on your device.
        </p>
      </section>

      {/* What data we collect */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Data Collection</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No personal information is required to use our tools.</li>
          <li>
            Tools like hash calculators, encoders, and regex testers process all
            data locally in your browser.
          </li>
          <li>
            Tools that rely on public APIs (e.g., CVE lookup, VirusTotal) may
            send queries externally, but this happens only when you explicitly
            use them.
          </li>
        </ul>
      </section>

      {/* Cookies */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Cookies & Storage</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            We do not use analytics, advertising, or tracking cookies.
          </li>
          <li>
            Only minimal local storage may be used (e.g., to remember your
            favorites or dark mode setting).
          </li>
        </ul>
      </section>

      {/* Third-party APIs */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. Third-Party Services</h2>
        <p>
          Some tools may connect to external services (e.g., WHOIS, VirusTotal,
          NVD CVE feeds). These requests are direct from your browser to the
          provider and not logged by us.
        </p>
      </section>

      {/* Security */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Security</h2>
        <p>
          We follow secure-by-default principles. The site is served over HTTPS,
          avoids unnecessary libraries, and ensures processing happens
          client-side whenever possible.
        </p>
      </section>

      {/* Your Rights */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Your Rights</h2>
        <p>
          You have the right to transparency, privacy, and control. Since no
          accounts are created, we have no personal data to modify or delete.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
        <p>
          For any privacy-related questions, please{" "}
          <Link href="/contact" className="text-indigo-600 hover:underline">
            contact us
          </Link>
          .
        </p>
      </section>

      {/* Footer note */}
      <p className="text-xs text-slate-500 mt-8">
        ⚡ This policy may be updated periodically to reflect changes in tools or
        legal requirements.
      </p>
    </div>
  );
}
