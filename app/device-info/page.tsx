// File: components/DeviceInfo.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  Share2,
  FileText,
  Printer,
  RefreshCw,
  Info,
  AlertTriangle,
} from "lucide-react";

/* Minimal helper: escape for HTML */
function escapeHtml(s: string) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/* Small syntax highlighter for JSON-like results (no libs) */
function highlightJSON(obj: any) {
  try {
    const json = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    return escapeHtml(json).replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-indigo-700"; // string
        if (/^"/.test(match)) {
          cls = /:\s*$/.test(match) ? "font-semibold text-slate-800" : "text-emerald-700";
        } else if (/true|false/.test(match)) cls = "text-rose-600";
        else if (/null/.test(match)) cls = "text-slate-500 italic";
        else cls = "text-orange-600";
        return `<span class="${cls}">${match}</span>`;
      }
    );
  } catch {
    return `<span class="text-slate-600">Unable to render preview</span>`;
  }
}

/* Download helper */
function downloadBlob(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // noop
  }
}

/* Try Web Share API */
async function tryWebShare(data: { title?: string; text?: string; url?: string }) {
  try {
    if ((navigator as any).share) {
      await (navigator as any).share(data);
      return true;
    }
  } catch {
    // fallback handled by caller
  }
  return false;
}

/* Device info collector (safe guards) */
function getScreenInfo(win: Window | undefined) {
  const screenObj = (win && win.screen) || ({} as Screen);
  return {
    width: screenObj?.width ?? null,
    height: screenObj?.height ?? null,
    availWidth: screenObj?.availWidth ?? null,
    availHeight: screenObj?.availHeight ?? null,
    colorDepth: screenObj?.colorDepth ?? null,
    orientation: (screenObj && (screenObj as any).orientation && (screenObj as any).orientation.type) || null,
    devicePixelRatio: typeof win !== "undefined" && win.devicePixelRatio ? win.devicePixelRatio : null,
    viewport: { width: win?.innerWidth ?? null, height: win?.innerHeight ?? null },
  };
}

function getNavigatorInfo(nav: Navigator, win: Window | undefined) {
  return {
    userAgent: String(nav.userAgent ?? "Unknown"),
    platform: (nav as any).userAgentData?.platform
      ? String((nav as any).userAgentData.platform)
      : "Unknown",
    languages: Array.isArray(nav.languages) ? nav.languages : [nav.language || "Unknown"],
    online: typeof nav.onLine === "boolean" ? nav.onLine : null,
    cookieEnabled: typeof nav.cookieEnabled === "boolean" ? nav.cookieEnabled : null,
    hardwareConcurrency: (nav && (nav as any).hardwareConcurrency) || null,
    deviceMemory: (nav && (nav as any).deviceMemory) || null,
    maxTouchPoints: (nav && (nav as any).maxTouchPoints) ?? (win && "ontouchstart" in win ? 1 : 0),
    connection: (nav && (nav as any).connection) || null,
  };
}

function getConnectionInfo(connection: any) {
  return {
    effectiveType: connection?.effectiveType ?? null,
    downlink: connection?.downlink ?? null,
    saveData: connection?.saveData ?? null,
  };
}

function getPreferences(win: Window | undefined, nav: Navigator) {
  const prefersReducedMotion =
    typeof win !== "undefined" && typeof win.matchMedia === "function"
      ? win.matchMedia("(prefers-reduced-motion: reduce)").matches
      : null;
  const prefersDark =
    typeof win !== "undefined" && typeof win.matchMedia === "function"
      ? win.matchMedia("(prefers-color-scheme: dark)").matches
      : null;
  let timeZone = null;
  try {
    timeZone = typeof Intl !== "undefined" ? new Intl.DateTimeFormat().resolvedOptions().timeZone ?? null : null;
  } catch {
    timeZone = null;
  }
  const locale = typeof Intl !== "undefined" ? new Intl.DateTimeFormat().resolvedOptions().locale ?? (nav.language ?? null) : (nav.language ?? null);
  return { prefersReducedMotion, prefersDark, timeZone, locale };
}

function hasWebGL(win: Window | undefined) {
  try {
    if (!win) return false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

function getSuggestions(devicePixelRatio: number | null, maxTouchPoints: number, saveData: boolean | null, online: boolean | null) {
  const suggestions: string[] = [];
  if (devicePixelRatio && devicePixelRatio < 1) suggestions.push("Unusually low devicePixelRatio.");
  if (devicePixelRatio && devicePixelRatio > 2.5) suggestions.push("High pixel-ratio present — large screen density.");
  if (maxTouchPoints === 0) suggestions.push("No touch input detected. Mobile layout may be limited.");
  if (saveData) suggestions.push("User prefers reduced data usage (Save-Data enabled).");
  if (online === false) suggestions.push("Device appears offline.");
  return suggestions;
}

function collectDeviceInfo() {
  const win = typeof window !== "undefined" ? window : undefined;
  const nav = typeof navigator !== "undefined" ? navigator : ({} as Navigator);

  const screenInfo = getScreenInfo(win);
  const navigatorInfo = getNavigatorInfo(nav, win);
  const connectionInfo = getConnectionInfo(navigatorInfo.connection);
  const preferences = getPreferences(win, nav);
  const webGLAvailable = hasWebGL(win);
  const suggestions = getSuggestions(
    screenInfo.devicePixelRatio,
    navigatorInfo.maxTouchPoints,
    connectionInfo.saveData,
    navigatorInfo.online
  );

  return {
    timestamp: new Date().toISOString(),
    viewport: screenInfo.viewport,
    screen: {
      width: screenInfo.width,
      height: screenInfo.height,
      availWidth: screenInfo.availWidth,
      availHeight: screenInfo.availHeight,
      colorDepth: screenInfo.colorDepth,
    },
    devicePixelRatio: screenInfo.devicePixelRatio,
    orientation: screenInfo.orientation,
    userAgent: navigatorInfo.userAgent,
    platform: navigatorInfo.platform,
    languages: navigatorInfo.languages,
    locale: preferences.locale,
    timeZone: preferences.timeZone,
    online: navigatorInfo.online,
    cookieEnabled: navigatorInfo.cookieEnabled,
    hardwareConcurrency: navigatorInfo.hardwareConcurrency,
    deviceMemory: navigatorInfo.deviceMemory,
    connection: connectionInfo,
    maxTouchPoints: navigatorInfo.maxTouchPoints,
    prefersReducedMotion: preferences.prefersReducedMotion,
    prefersDark: preferences.prefersDark,
    hasWebGL: webGLAvailable,
    suggestions,
  } as const;
}

/* -------------------
   Component
   ------------------- */

export default function DeviceInfo() {
  const [mounted, setMounted] = useState(false);
  const [info, setInfo] = useState<Record<string, any> | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // collect on mount and on resize/orientation changes
  useEffect(() => {
    setMounted(true);
    const read = () => {
      try {
        setInfo(collectDeviceInfo() as any);
      } catch (e) {
        console.error("Failed to collect device info:", e);
        setInfo({ error: "Failed to collect device info.", details: String(e) });
      }
    };
    read();
    function onResize() {
      read();
    }
    function onVisibility() {
      read();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // formatters
  const jsonText = useMemo(() => (info ? JSON.stringify(info, null, 2) : ""), [info]);
  const prettyHtml = useMemo(() => (info ? highlightJSON(info) : `<span class="text-slate-500">No data</span>`), [info]);

  // actions
  async function copyText() {
    try {
      const text = jsonText || "";
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers (deprecated)
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        // document.execCommand is deprecated, but used as a last resort fallback
        try {
          document.execCommand("copy");
        } catch {
          // If copy fails, do nothing
        }
        ta.remove();
      }
      setLastAction("Copied JSON");
    } catch {
      setLastAction("Copy failed");
    } finally {
      setTimeout(() => setLastAction(null), 1400);
    }
  }

  function exportText() {
    downloadBlob("device-info.txt", jsonText, "text/plain;charset=utf-8");
    setLastAction("Exported .txt");
    setTimeout(() => setLastAction(null), 1400);
  }
  function exportJSON() {
    downloadBlob("device-info.json", jsonText, "application/json");
    setLastAction("Exported .json");
    setTimeout(() => setLastAction(null), 1400);
  }
  function exportMarkdown() {
    const md = `# Device Info\n\n\`\`\`json\n${jsonText}\n\`\`\`\n`;
    downloadBlob("device-info.md", md, "text/markdown");
    setLastAction("Exported .md");
    setTimeout(() => setLastAction(null), 1400);
  }
  function printPDF() {
    try {
      const html = `
        <html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
        <style>body{font-family:Inter,system-ui,Arial;padding:20px;color:#0f172a}pre{white-space:pre-wrap}</style>
        </head><body>
        <h1>Device Info</h1>
        <div><pre>${escapeHtml(jsonText)}</pre></div>
        </body></html>`;
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) {
        setLastAction("Unable to open print window");
        setTimeout(() => setLastAction(null), 1400);
        return;
      }
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          // ignore
        }
      }, 300);
      setLastAction("Opened print dialog");
    } catch {
      setLastAction("Print failed");
    } finally {
      setTimeout(() => setLastAction(null), 1400);
    }
  }

  async function shareResult() {
    try {
      const text = jsonText || "";
      const ok = await tryWebShare({ title: "Device Info", text });
      if (!ok) {
        // fallback: copy
        await copyText();
        setLastAction("Copied (share fallback)");
      } else {
        setLastAction("Shared via Web Share");
      }
    } catch {
      setLastAction("Share failed");
    } finally {
      setTimeout(() => setLastAction(null), 1400);
    }
  }

  function refreshNow() {
    try {
      setInfo(collectDeviceInfo() as any);
      setLastAction("Refreshed");
    } catch {
      setLastAction("Refresh failed");
    } finally {
      setTimeout(() => setLastAction(null), 900);
    }
  }

  // small accessible summary + suggestions
  const summary = useMemo(() => {
    if (!info) return "No device data collected yet.";
    const lines: string[] = [];
    lines.push(`${info.viewport?.width ?? "?"}×${info.viewport?.height ?? "?"} viewport`);
    if (info.devicePixelRatio) lines.push(`${info.devicePixelRatio} DPR`);
    if (info.platform) lines.push(String(info.platform));
    if (info.connection?.effectiveType) lines.push(`Network: ${info.connection.effectiveType}`);
    if (Array.isArray(info.suggestions) && info.suggestions.length > 0) {
      lines.push(`Notes: ${info.suggestions.join("; ")}`);
    }
    return lines.join(" · ");
  }, [info]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Device Information</h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Quick snapshot of your current device — screen, DPR, user agent, network hints, accessibility preferences. Data is processed in your browser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshNow}
            title="Refresh"
            className="inline-flex items-center gap-2 px-3 py-1 rounded border text-sm"
            aria-label="Refresh device info"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={copyText}
            title="Copy JSON"
            className="inline-flex items-center gap-2 px-3 py-1 rounded border text-sm"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button
            onClick={shareResult}
            title="Share"
            className="inline-flex items-center gap-2 px-3 py-1 rounded border text-sm"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </header>

      <main className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* left: controls & small summary */}
        <section className="md:col-span-1 bg-white p-4 rounded border shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-sm font-medium">Summary</h2>
              <div className="text-xs text-slate-600 mt-1">{summary}</div>
            </div>
            <div className="text-xs text-slate-400">{info?.timeZone ?? ""}</div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-xs text-slate-500">Export</div>
            <div className="flex gap-2">
              <button onClick={exportText} className="px-2 py-1 rounded border text-xs" aria-label="Export text">TXT</button>
              <button onClick={exportJSON} className="px-2 py-1 rounded border text-xs" aria-label="Export json">JSON</button>
              <button onClick={exportMarkdown} className="px-2 py-1 rounded border text-xs" aria-label="Export markdown">MD</button>
              <button onClick={printPDF} className="px-2 py-1 rounded border text-xs" aria-label="Print PDF"><Printer className="inline w-3 h-3" /> Print</button>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 space-y-1">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <div>All data stays in your browser. Use exports to save/share.</div>
            </div>
            {Array.isArray(info?.suggestions) && info.suggestions.length > 0 ? (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <div>
                  <div className="font-medium">Suggestions</div>
                  <ul className="list-disc pl-5">
                    {(info.suggestions as string[]).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* right: preview & formatted */}
        <section className="md:col-span-2 space-y-3">
          <div className="bg-white p-4 rounded border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Live Preview</h3>
                <div className="text-xs text-slate-500">{mounted ? "Updated live" : "Loading..."}</div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div>{info ? new Date(info.timestamp).toLocaleString() : "-"}</div>
                <div className="px-2">|</div>
                <div>{info?.platform ?? "Unknown platform"}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Key fields card */}
              <div className="p-3 rounded border bg-slate-50">
                <div className="text-xs text-slate-500">Screen</div>
                <div className="font-medium">
                  {info ? `${info.screen?.width ?? "?"}×${info.screen?.height ?? "?"}` : "—"}
                </div>
                <div className="text-xs text-slate-500 mt-2">Viewport / DPR</div>
                <div className="font-medium">
                  {info ? `${info.viewport?.width ?? "?"}×${info.viewport?.height ?? "?"} · ${info.devicePixelRatio ?? "?"} DPR` : "—"}
                </div>

                <div className="text-xs text-slate-500 mt-2">Network</div>
                <div className="text-sm">{info?.connection?.effectiveType ?? "unknown"} {info?.connection?.saveData ? "· Save-Data" : ""}</div>

                <div className="text-xs text-slate-500 mt-2">Touch</div>
                {(() => {
                  let touchInfo = "—";
                  if (info) {
                    touchInfo = info.maxTouchPoints > 0
                      ? `Supports touch (${info.maxTouchPoints})`
                      : "No touch";
                  }
                  return <div className="text-sm">{touchInfo}</div>;
                })()}
              </div>

              {/* Quick metadata */}
              <div className="p-3 rounded border bg-slate-50">
                <div className="text-xs text-slate-500">Platform</div>
                <div className="font-medium">{info?.platform ?? "—"}</div>

                <div className="text-xs text-slate-500 mt-2">Locale</div>
                <div className="font-medium">{info?.locale ?? "—"}</div>

                <div className="text-xs text-slate-500 mt-2">Timezone</div>
                <div className="font-medium">{info?.timeZone ?? "—"}</div>

                <div className="text-xs text-slate-500 mt-2">WebGL</div>
                <div className="font-medium">{info?.hasWebGL ? "Available" : "Unavailable"}</div>

                  <div className="text-xs text-slate-500 mt-2">timeZone</div>
                <div className="font-medium">{Intl.DateTimeFormat().resolvedOptions().timeZone }</div>
              </div>
            </div>

            {/* formatted JSON preview */}
            <div className="mt-3 rounded border p-3 bg-white">
              <div ref={previewRef} className="prose-pre max-h-72 overflow-auto text-sm" aria-live="polite" dangerouslySetInnerHTML={{ __html: prettyHtml }} />
            </div>
          </div>

          {/* quick actions row */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Lightweight • Client-side only • No tracking</div>
            <div className="flex items-center gap-2">
              <button onClick={copyText} className="px-2 py-1 rounded border text-sm" aria-label="Copy JSON">
                <Copy className="w-4 h-4 inline" /> Copy
              </button>
              <button onClick={exportJSON} className="px-2 py-1 rounded border text-sm" aria-label="Export JSON">
                <Download className="w-4 h-4 inline" /> JSON
              </button>
              <button onClick={exportMarkdown} className="px-2 py-1 rounded border text-sm" aria-label="Export Markdown">
                <FileText className="w-4 h-4 inline" /> MD
              </button>
              <button onClick={printPDF} className="px-2 py-1 rounded border text-sm" aria-label="Print">
                <Printer className="w-4 h-4 inline" /> Print
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* bottom note */}
      <footer className="mt-6 text-xs text-slate-500">
        ⚡ Device details are collected in your browser only. For privacy, avoid sharing full User-Agent or other sensitive fields in public.
      </footer>

      {/* transient last-action */}
      {lastAction && (
        <div className="fixed right-4 bottom-6 bg-slate-800 text-white text-sm px-3 py-2 rounded shadow">
          {lastAction}
        </div>
      )}
    </div>
  );
}
