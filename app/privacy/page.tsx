// File: app/privacy/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Shield, Lock, EyeOff, FileText, UserCheck, Server } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Intro */}
      <div className="p-4 sm:p-6 mb-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          At <strong className="text-slate-900 dark:text-white">SecuTools.io</strong>, we operate with a strict <strong>zero-knowledge, client-side first architecture</strong>. We believe cybersecurity tools must respect the privacy and security of the practitioners and students who use them.
        </p>
      </div>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed">
        {/* 1. Core Architecture */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            1. Client-Side Processing & Data Minimization
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Unlike many online converters and security utilities, SecuTools.io executes cryptographic calculations, string transformations, and file inspections directly inside your browser using Web APIs, Web Crypto, and JavaScript.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
            <li><strong>Cryptographic Hashes & Keys:</strong> Passwords, JWTs, hashes, and RSA keys processed in these tools never leave your device and are never sent to our servers.</li>
            <li><strong>PCAP & File Uploads:</strong> Files provided to tools like the PCAP decoder or Certificate Parser are read locally in memory via the browser File API; no file payload is uploaded to remote storage.</li>
            <li><strong>No User Accounts:</strong> We do not require registration, login, or personal profile creation.</li>
          </ul>
        </section>

        {/* 2. External API Queries */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            2. External Public APIs & Third-Party Queries
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Certain intelligence lookups inherently require querying external public databases (such as CVE feeds, ASN records, DNS lookups, or VirusTotal hashes). These queries occur only upon your explicit request.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse mt-2">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <th className="p-2 font-medium">Service / Integration</th>
                  <th className="p-2 font-medium">Purpose</th>
                  <th className="p-2 font-medium">Data Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="p-2 font-semibold">CIRCL / NVD</td>
                  <td className="p-2">Vulnerability (CVE) lookups</td>
                  <td className="p-2 font-mono">CVE Identifier string</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">VirusTotal / AbuseIPDB</td>
                  <td className="p-2">Threat intelligence verification</td>
                  <td className="p-2 font-mono">Target IP/domain/hash query</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">RDAP / WHOIS Providers</td>
                  <td className="p-2">Domain registration lookup</td>
                  <td className="p-2 font-mono">Target domain name</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Vercel (Hosting & Performance)</td>
                  <td className="p-2">Global CDN delivery & aggregated performance telemetry</td>
                  <td className="p-2 font-mono">Anonymized HTTP request headers & page load latency</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Legal Bases (GDPR / CCPA) */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            3. Legal Bases for Processing (GDPR & International Privacy)
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Under the EU General Data Protection Regulation (GDPR Art. 6) and California Consumer Privacy Act (CCPA/CPRA), we process minimal data based on:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
            <li><strong>Legitimate Interests:</strong> Operating a secure, performant, and resilient website infrastructure and protecting against denial-of-service abuse.</li>
            <li><strong>Consent:</strong> For aggregated performance telemetry (where accepted via our Cookie/Consent banner).</li>
          </ul>
        </section>

        {/* 4. Data Subject Rights */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            4. Your Privacy Rights
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Depending on your jurisdiction, you have the right to request access, rectification, deletion, restriction, and portability of personal data, as well as the right to lodge a complaint with a data protection supervisory authority.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Because SecuTools.io does not maintain user databases, accounts, or persistent personal logs, we generally store no identifiable data linking to your identity. If you submit a query via our contact form, your name and email are used solely to respond to your inquiry.
          </p>
        </section>

        {/* 5. Contact & Data Controller */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            5. Contact Information & Data Protection
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            For any privacy inquiries or rights requests, please contact:
          </p>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">
            <p><strong>Entity / Operator:</strong> SecuTools.io / Karthikeyan T</p>
            <p><strong>Email:</strong> <a href="mailto:tkarthikeyan@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">tkarthikeyan@gmail.com</a></p>
            <p><strong>GitHub:</strong> <a href="https://github.com/carthworks/secutools-io" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">github.com/carthworks/secutools-io</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
