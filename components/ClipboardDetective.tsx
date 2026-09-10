"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Clipboard, X, ArrowRight, Sparkles } from "lucide-react";

/* ── Pattern matchers → { tool slug, label, matched value } ── */
type Detection = { slug: string; label: string; value: string; confidence: "high" | "medium" };

const PATTERNS: { re: RegExp; slug: string; label: string; confidence: "high" | "medium" }[] = [
  // JWT: three base64url segments separated by dots
  {
    re: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    slug: "jwt",
    label: "JWT Token",
    confidence: "high",
  },
  // CVE ID
  {
    re: /CVE-\d{4}-\d{4,7}/i,
    slug: "cve",
    label: "CVE ID",
    confidence: "high",
  },
  // SHA-512 (128 hex)
  {
    re: /^[0-9a-fA-F]{128}$/,
    slug: "hash-id",
    label: "SHA-512 Hash",
    confidence: "high",
  },
  // SHA-256 (64 hex)
  {
    re: /^[0-9a-fA-F]{64}$/,
    slug: "hash-id",
    label: "SHA-256 Hash",
    confidence: "high",
  },
  // SHA-1 (40 hex)
  {
    re: /^[0-9a-fA-F]{40}$/,
    slug: "hash-id",
    label: "SHA-1 Hash",
    confidence: "high",
  },
  // MD5 (32 hex)
  {
    re: /^[0-9a-fA-F]{32}$/,
    slug: "hash-id",
    label: "MD5 Hash",
    confidence: "high",
  },
  // IPv4
  {
    re: /^(\d{1,3}\.){3}\d{1,3}$/,
    slug: "network-tool",
    label: "IPv4 Address",
    confidence: "high",
  },
  // IPv6
  {
    re: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    slug: "network-tool",
    label: "IPv6 Address",
    confidence: "high",
  },
  // CIDR notation
  {
    re: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
    slug: "network-tool",
    label: "CIDR Block",
    confidence: "high",
  },
  // Domain (rough)
  {
    re: /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    slug: "network-tool",
    label: "Domain Name",
    confidence: "medium",
  },
  // URL
  {
    re: /^https?:\/\/.{4,}/,
    slug: "url-trace",
    label: "URL",
    confidence: "medium",
  },
  // PEM / PGP block
  {
    re: /-----BEGIN (PGP|RSA|EC|CERTIFICATE|PRIVATE KEY)/,
    slug: "pgp",
    label: "PEM / PGP Block",
    confidence: "high",
  },
  // Base64-ish (long encoded string)
  {
    re: /^[A-Za-z0-9+/]{40,}={0,2}$/,
    slug: "base64",
    label: "Base64 Data",
    confidence: "medium",
  },
];

function detect(text: string): Detection | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 4096) return null;

  for (const p of PATTERNS) {
    if (p.re.test(trimmed)) {
      return {
        slug: p.slug,
        label: p.label,
        value: trimmed.length > 48 ? trimmed.slice(0, 45) + "…" : trimmed,
        confidence: p.confidence,
      };
    }
  }
  return null;
}

export default function ClipboardDetective() {
  const [detection, setDetection] = useState<Detection | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    if (dismissed) return;
    try {
      if (!navigator?.clipboard?.readText) return;
      const text = await navigator.clipboard.readText();
      const result = detect(text);
      if (result) {
        setDetection(result);
        setVisible(true);
      }
    } catch {
      // Permission denied or unavailable — silent fail
    }
  }, [dismissed]);

  /* Check on paste event anywhere on the page */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (dismissed) return;
      const text = e.clipboardData?.getData("text") ?? "";
      const result = detect(text);
      if (result) {
        setDetection(result);
        setVisible(true);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [dismissed]);

  /* Check once on window focus (user switches back to tab) */
  useEffect(() => {
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [check]);

  /* Auto-dismiss after 10 s */
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 10_000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || !detection) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4"
    >
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-2xl shadow-indigo-500/10 animate-in slide-in-from-bottom-4 duration-300">
        {/* Icon */}
        <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Clipboard className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Clipboard detected
            </span>
            {detection.confidence === "high" && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                High confidence
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0.5">
            Looks like a <span className="text-indigo-700 dark:text-indigo-300">{detection.label}</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
            {detection.value}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/${detection.slug}`}
          onClick={() => { setVisible(false); setDismissed(true); }}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
        >
          Open <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* Dismiss */}
        <button
          onClick={() => { setVisible(false); setDismissed(true); }}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
