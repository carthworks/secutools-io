"use client";

import React, { useState } from "react";
import {
  Copy,
  Download,
  Share2,
  Trash2,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Shield,
  Clock
} from "lucide-react";

type Hop = {
  url: string;
  status: number;
  location?: string;
  timestamp?: number;
};

async function copyText(text: string, onSuccess: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onSuccess();
  } catch {
    alert("Copy failed");
  }
}

function downloadBlob(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (status >= 300 && status < 400) return "bg-blue-100 text-blue-700 border-blue-300";
  if (status >= 400 && status < 500) return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-red-100 text-red-700 border-red-300";
}

function getStatusIcon(status: number) {
  if (status >= 200 && status < 300) return <CheckCircle2 className="w-4 h-4" />;
  if (status >= 300 && status < 400) return <ArrowRight className="w-4 h-4" />;
  return <AlertTriangle className="w-4 h-4" />;
}

export default function UrlTracer() {
  const [url, setUrl] = useState("");
  const [hops, setHops] = useState<Hop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function trace() {
    setError(null);
    setLoading(true);
    setHops([]);
    try {
      if (!/^https?:\/\//i.test(url)) {
        setError("Please enter a valid URL starting with http:// or https://");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setHops(json.hops || []);
    } catch (err: any) {
      setError("Failed to trace: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  function exportFile(type: "json" | "txt" | "md") {
    if (!hops.length) return;
    if (type === "json") {
      downloadBlob(JSON.stringify({ url, hops }, null, 2), "redirect-trace.json", "application/json");
    } else if (type === "txt") {
      const txt = hops.map((h, i) => `${i + 1}. [${h.status}] ${h.url}${h.location ? " → " + h.location : ""}`).join("\n");
      downloadBlob(txt, "redirect-trace.txt");
    } else {
      const md = `# Redirect Trace for ${url}\n\n${hops
        .map((h, i) => `- **${i + 1}. [${h.status}]** ${h.url}${h.location ? ` → ${h.location}` : ""}`)
        .join("\n")}`;
      downloadBlob(md, "redirect-trace.md", "text/markdown");
    }
  }

  async function share() {
    if (!hops.length) return;
    const text = `Redirect trace for ${url}\n${hops
      .map((h, i) => `${i + 1}. [${h.status}] ${h.url}${h.location ? " → " + h.location : ""}`)
      .join("\n")}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Redirect Trace", text });
      } catch {
        copyText(text, () => setCopied(true));
      }
    } else {
      copyText(text, () => setCopied(true));
    }
  }

  const finalDestination = hops.length > 0 ? hops[hops.length - 1].url : null;
  const redirectCount = hops.filter(h => h.status >= 300 && h.status < 400).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-indigo-200 shadow-sm">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">URL Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            URL Unshortener & Redirect Tracer
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Expand shortened links, trace redirect chains, and detect suspicious URLs.
            See the complete journey from source to final destination.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && trace()}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  placeholder="https://bit.ly/example or any shortened URL..."
                />
              </div>
              <button
                onClick={trace}
                disabled={loading || !url}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Tracing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Trace URL
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {hops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-emerald-100 text-sm font-medium mb-1">Total Hops</div>
              <div className="text-4xl font-bold">{hops.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-blue-100 text-sm font-medium mb-1">Redirects</div>
              <div className="text-4xl font-bold">{redirectCount}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-purple-100 text-sm font-medium mb-1">Final Status</div>
              <div className="text-4xl font-bold">{hops[hops.length - 1]?.status || "—"}</div>
            </div>
          </div>
        )}

        {/* Redirect Chain */}
        {hops.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">Redirect Chain</h2>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                  {hops.length} {hops.length === 1 ? "hop" : "hops"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyText(JSON.stringify({ url, hops }, null, 2), () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  })}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => exportFile("json")}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {hops.map((hop, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5"
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      {index < hops.length - 1 && (
                        <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-300 to-purple-300 my-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${getStatusColor(hop.status)}`}>
                          {getStatusIcon(hop.status)}
                          {hop.status}
                        </span>
                        {index === hops.length - 1 && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-300">
                            Final Destination
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-slate-500 font-medium mt-1 flex-shrink-0">URL:</span>
                          <a
                            href={hop.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-mono break-all group-hover:underline flex items-center gap-1"
                          >
                            {hop.url}
                            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>

                        {hop.location && (
                          <div className="flex items-start gap-2 pl-4 border-l-2 border-purple-200">
                            <ArrowRight className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-slate-500 font-medium">Redirects to:</span>
                              <div className="text-sm text-purple-600 font-mono break-all mt-0.5">
                                {hop.location}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Destination Summary */}
            {finalDestination && (
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-emerald-900 mb-1">Final Destination</div>
                    <div className="text-sm text-emerald-700 font-mono break-all">{finalDestination}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            <div className="px-6 py-4 bg-slate-50 border-t flex flex-wrap gap-2">
              <button
                onClick={() => exportFile("txt")}
                className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export TXT
              </button>
              <button
                onClick={() => exportFile("md")}
                className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Markdown
              </button>
              <button
                onClick={share}
                className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <strong className="text-slate-900">Privacy First:</strong> All URL tracing happens server-side with no logging.
              Use this tool to verify shortened links before clicking, detect phishing attempts, and understand redirect chains.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
