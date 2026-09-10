// File: app/layout.tsx
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";
import CriticalCveBanner from "@/components/CriticalCveBanner";
import ClipboardDetective from "@/components/ClipboardDetective";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

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

  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('site_theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (_) {}
    })();
  `;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>

      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
        <SpeedInsights />
        <Analytics />
        <CriticalCveBanner />
        <Navigation />
        <main className="container-page py-6 sm:py-8 flex-1 w-full">{children}</main>

        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 transition-colors">
          <div className="container-page py-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="text-center md:text-left space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  ⚡ SecuTools.io — Free, privacy-focused security engineering toolkit
                </p>
                <p>
                  Zero server logging of cryptographic inputs. All processing runs locally in your browser.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
                <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
                <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</Link>
                <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookie Policy</Link>
                <a href="https://github.com/carthworks/secutools-io" target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">GitHub</a>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <p>&copy; {new Date().getFullYear()} SecuTools.io. Open source under MIT License.</p>
              <p>For ethical security research & educational use only.</p>
            </div>
          </div>
        </footer>

        <CookieConsent />
        <ClipboardDetective />
      </body>
    </html>
  );
}
