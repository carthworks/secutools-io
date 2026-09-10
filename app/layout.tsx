// File: app/layout.tsx
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "SecuTools.io — Free, Privacy-First Cybersecurity Tools",
  description: "Fast, privacy-friendly online utilities for cybersecurity students, SOC analysts, and security researchers. Zero client data tracking.",
  authors: [{ name: "Karthikeyan T", url: "https://github.com/carthworks" }],
  creator: "SecuTools",
  openGraph: {
    title: "SecuTools.io — Cybersecurity Handy Tools",
    description: "Free, privacy-friendly tools and utilities for security students and professionals.",
    url: "https://secutools.io",
    siteName: "SecuTools",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SecuTools.io — Cybersecurity Handy Tools",
    description: "Free, privacy-friendly tools for students and professionals.",
    creator: "@SecuTools"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const siteUrl = "https://secutools.io";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "name": "SecuTools",
    "description": "Free, privacy-friendly tools and utilities for security students and professionals.",
    "publisher": {
      "@type": "Organization",
      "name": "SecuTools",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    }
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>

      <body className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
        <SpeedInsights />
        <Analytics />
        <Navigation />
        <main className="container-page py-8 flex-1">{children}</main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 transition-colors">
          <div className="container-page py-8 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="text-center md:text-left space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  ⚡ SecuTools.io — Built for education, defensive research, and daily security operations.
                </p>
                <p>
                  Zero server-side logging of cryptographic data. All calculations run client-side in your browser.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookie Policy</Link>
                <a href="https://github.com/carthworks/secutools-io" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <p>&copy; {new Date().getFullYear()} SecuTools.io. Open source under MIT License.</p>
              <p>For ethical security research & educational use only.</p>
            </div>
          </div>
        </footer>

        <CookieConsent />
      </body>
    </html>
  );
}
