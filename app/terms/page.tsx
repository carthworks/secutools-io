// File: app/terms/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle, Scale, FileText, AlertTriangle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Effective Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Intro Box */}
      <div className="p-4 sm:p-6 mb-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
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
              You must not use SecuTools.io to conduct unlawful cyberattacks, unauthorized port scanning, denial-of-service attempts, credential stuffing, data theft, or any activity that violates applicable local, national, or international computer crime laws (e.g., the US Computer Fraud and Abuse Act, UK Computer Misuse Act, or regional equivalents).
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
            Cybersecurity tooling outputs (such as CVE lookups, regex results, password entropy calculations, or header validations) should not be considered a substitute for professional penetration tests or formal security compliance audits.
          </p>
        </section>

        {/* Section 3: Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            3. Limitation of Liability
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            To the maximum extent permitted by applicable law, SecuTools.io, its developers, contributors, and operators shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages, including loss of profits, goodwill, data, system outages, or regulatory penalties resulting from:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
            <li>Your access to, use of, or inability to access or use the tools;</li>
            <li>Any unauthorized access or alteration of your transmissions or data;</li>
            <li>Actions taken based on vulnerability reports or security analyses generated on the platform.</li>
          </ul>
        </section>

        {/* Section 4: Intellectual Property & Open Source */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            4. Intellectual Property & License
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            The core SecuTools.io web application and open-source components are licensed under the <a href="https://github.com/carthworks/secutools-io/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">MIT License</a>. All third-party trademarks, logos, and APIs (e.g., VirusTotal, CIRCL, NVD, AWS) are the properties of their respective owners.
          </p>
        </section>

        {/* Section 5: Third-Party Links & Services */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            5. Third-Party Integrations
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Our platform may link to or pull public feeds from external services. We have no control over the privacy practices, content, or availability of third-party systems and assume no responsibility for them.
          </p>
        </section>

        {/* Section 6: Modifications & Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            6. Changes to Terms & Contact
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            We reserve the right to revise or replace these terms at any time. Significant revisions will be noted on this page with an updated effective date.
          </p>
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
