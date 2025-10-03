// File: app/layout.tsx (or wherever your RootLayout lives)
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Home, Link } from "lucide-react";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  title: "Cybersecurity Handy Tools",
  description: "Free, privacy-friendly tools and utilities for security students and professionals — ASN lookup, CVE lookup, hash tools, network analysis, and more.",
  keywords: [
    "cybersecurity tools",
    "ASN lookup",
    "ISP lookup",
    "offline ASN",
    "network tools",
    "CVE lookup",
    "hash tools",
    "pcap decoder",
    "web security tools",
    "pentesting utilities",
    "security learning",
    "SOC tools",
    "security education"
  ].join(", "),
  authors: [{ name: "SecuTools", url: "https://secutools.io" }],
  creator: "SecuTools",
  // useful for some frameworks / prerenderers
  viewport: "width=device-width, initial-scale=1",
  // fallback open graph info
  openGraph: {
    title: "Cybersecurity Handy Tools — SecuTools",
    description: "Free, privacy-friendly tools and utilities for security students and professionals.",
    url: "https://secutools.io",
    siteName: "SecuTools",
    images: [
      {
        url: "https://secutools.io/og.png",
        width: 1200,
        height: 630,
        alt: "SecuTools — Cybersecurity Handy Tools"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Cybersecurity Handy Tools",
    description: "Free, privacy-friendly tools for students and professionals.",
    images: ["https://secutools.io/og.png"],
    creator: "@SecuTools"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const siteUrl = "https://secutools.io"; // <- replace with your real domain
  const ogImage = `${siteUrl}/og.png`; // recommended 1200x630

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
        <meta name="viewport" content={metadata.viewport} />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content="tkarthikeyan@gmail.com" />
        <meta name="robots" content="index,follow" />
        <meta name="developer" content="Karthikeyan T" />
        <link rel="canonical" href={siteUrl} />

        {/* Open Graph */}
        <meta property="og:type" content={metadata.openGraph.type} />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
        <meta property="og:locale" content={metadata.openGraph.locale} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content={metadata.twitter.card} />
        <meta name="twitter:title" content={metadata.twitter.title} />
        <meta name="twitter:description" content={metadata.twitter.description} />
        <meta name="twitter:image" content={metadata.twitter.images[0]} />
        <meta name="twitter:creator" content={metadata.twitter.creator} />

        {/* Favicons / PWA hint (replace with your icons) */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>

      <body className="bg-white text-slate-800">
        <SpeedInsights/>
        <Navigation />
        <main className="container-page py-8">{children}</main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="container-page py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              ⚡ Built for learning. No tracking. All processing runs client-side unless a checker needs a public API.
            </p>
            <div className="flex gap-4">
                    <a href="/" className="hover:bg-slate-50" title="Home" aria-label="Home">
                              {/* <Home className="w-5 h-5 text-sky-600" /> */}
                              Home
                    </a>
              <a href="/about" className="hover:text-slate-700">About</a>
              <a href="/privacy" className="hover:text-slate-700">Privacy</a>
              <a href="https://github.com/carthworks" target="_blank" rel="noreferrer" className="hover:text-slate-700">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
