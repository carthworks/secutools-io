// File: app/terms/page.tsx
import React from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle, Scale, FileText, AlertTriangle } from "lucide-react";

export const dynamic = "force-static";

export const metadata = {
  title: "Terms of Service — SecuTools.io",
  description: "Terms of Service and ethical use policies for SecuTools.io cybersecurity utilities.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Effective Date: September 2026
        </p>
      </div>

      {/* Intro Box */}
      <div className="p-4 sm:p-6 mb-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          Welcome to <strong className="text-slate-900 dark:text-white">SecuTools.io</strong>. By accessing or using our platform, tools, or educational resources, you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use immediately.
        </p>
      </div>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed">
        {/* Section 1: Ethical & Acceptable Use */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            1. Authorized & Ethical Use Policy
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            SecuTools.io provides security utilities, encoders, cryptographic demos, and intelligence lookups created strictly for <strong>educational, research, auditing, and defensive security purposes</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              You agree to test and scan only network systems, domains, IP addresses, or assets that you own or have explicit, documented authorization to test.
            </li>
            <li>
              You must not use SecuTools.io to conduct unlawful cyberattacks, unauthorized port scanning, denial-of-service attempts, credential stuffing, data theft, or any activity that violates applicable local, national, or international computer crime laws.
            </li>
            <li>
              You agree not to abuse, overload, or reverse engineer any public API integration endpoints provided through this service.
            </li>
          </ul>
        </section>

        {/* Section 2: Disclaimer of Warranties */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            2. Disclaimer of Warranties (&ldquo;AS IS&rdquo;)
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            SecuTools.io and its contents are provided on an <strong>&ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo;</strong> basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, or accuracy of analysis results.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Cybersecurity tooling outputs should not be considered a substitute for professional penetration tests or formal security compliance audits.
          </p>
        </section>

        {/* Section 3: Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            3. Limitation of Liability
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            To the maximum extent permitted by applicable law, SecuTools.io, its developers, contributors, and operators shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages resulting from tool usage.
          </p>
        </section>

        {/* Section 4: Intellectual Property & Open Source */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            4. Intellectual Property & License
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            The core SecuTools.io web application is open-source under the <a href="https://github.com/carthworks/secutools-io/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">MIT License</a>. Third-party trademarks, logos, and public API data remain the property of their respective owners.
          </p>
        </section>

        {/* Section 5: Modifications & Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            5. Contact
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Questions regarding these Terms of Service can be directed to{" "}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              our Contact Page
            </Link>{" "}
            or emailed to <a href="mailto:tkarthikeyan@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">tkarthikeyan@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
