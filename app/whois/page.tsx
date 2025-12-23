"use client";
import { useState } from "react";
import Section from "@/components/Section";
import {
  Copy,
  Download,
  Share2,
  RefreshCw,
  Globe,
  AlertCircle,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Lock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Mail,
  Info,
} from "lucide-react";

// --- Helpers to parse RDAP ---
function getRdapDates(rdap: any) {
  const events = rdap?.events || [];
  let created = null,
    updated = null,
    expires = null;
  for (const ev of events) {
    const action = (ev.eventAction || "").toLowerCase();
    const when = ev.eventDate;
    if (!when) continue;
    if (action.includes("registration")) created = created || new Date(when);
    if (action.includes("update") || action.includes("changed"))
      updated = new Date(when);
    if (action.includes("expiration")) expires = new Date(when);
  }
  return { created, updated, expires };
}

function daysTo(d: Date | null) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isPrivacyProxy(rdap: any) {
  const ents = rdap?.entities || [];
  return ents.some((e: any) => {
    const name =
      (e?.vcardArray &&
        e?.vcardArray[1]?.find((p: any) => p[0] === "fn")?.[3]) ||
      e?.handle ||
      "";
    return /privacy|proxy|redacted|whoisguard|contactprivacy/i.test(name);
  });
}

function getAbuseContact(rdap: any) {
  const ents = rdap?.entities || [];
  for (const e of ents) {
    if ((e.roles || []).includes("abuse")) {
      const email =
        e?.vcardArray?.[1]?.find((p: any) => p[0] === "email")?.[3] || null;
      return email;
    }
  }
  return null;
}

function extractNameservers(rdap: any) {
  // RDAP responses vary — try multiple shapes
  if (!rdap) return [];
  if (Array.isArray(rdap.nameservers)) {
    return rdap.nameservers.map((n: any) =>
      typeof n === "string" ? n : n.ldhName || n.handle || n.objectClassName || ""
    );
  }
  // Some RDAP responses include nsLdhNames etc
  if (rdap?.nsLdhNames && Array.isArray(rdap.nsLdhNames)) return rdap.nsLdhNames;
  // fallback: search entities for 'nameserver' role
  const ns: string[] = [];
  (rdap.entities || []).forEach((e: any) => {
    if ((e.roles || []).includes("nameserver")) {
      const name =
        (e?.vcardArray &&
          e?.vcardArray[1]?.find((p: any) => p[0] === "fn")?.[3]) ||
        e?.handle ||
        "";
      if (name) ns.push(name);
    }
  });
  return ns;
}

function getDnssecIndicator(rdap: any) {
  // RDAP may not provide DNSSEC info; attempt to infer from publicSuffix or secure DNS extension — fallback false
  if (!rdap) return false;
  if (rdap.secureDNS && typeof rdap.secureDNS?.delegationSigned === "boolean")
    return rdap.secureDNS.delegationSigned;
  return false;
}

// --- Validation ---
// Domain regex: enforces labels + TLD, no protocol, no path. Case-insensitive.
const DOMAIN_REGEX =
  /^(?=.{1,253}$)(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.)+[a-z]{2,63}$/i;

// attempt to normalize user input to a bare domain (example.com)
function normalizeToDomain(input: string): { domain: string | null; reason?: string } {
  if (!input) return { domain: null, reason: "Empty input" };

  const trimmed = input.trim();

  // If it already matches domain pattern, return it lowercased
  if (DOMAIN_REGEX.test(trimmed)) return { domain: trimmed.toLowerCase() };

  // Try to parse as URL (handles https://www.example.com/ or //example.com/path)
  try {
    // If user entered missing protocol but with slashes (e.g., //example.com), new URL requires protocol; prefix http:
    let maybe = trimmed;
    if (maybe.startsWith("//")) maybe = "http:" + maybe;
    if (!/^[a-z]+:\/\//i.test(maybe)) {
      // If it looks like URL because contains '/' or ':' maybe add protocol
      if (maybe.includes("/") || maybe.includes("?") || maybe.includes(":")) {
        maybe = "http://" + maybe;
      }
    }
    const url = new URL(maybe);
    // hostname may include 'www.' — strip 'www.' to enforce bare domain unless user typed subdomain intentionally
    let host = url.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    if (DOMAIN_REGEX.test(host)) return { domain: host };
    return { domain: null, reason: "Could not extract valid domain from URL" };
  } catch (e) {
    // not a URL — maybe user typed something like 'example .com' with spaces -> remove spaces and try
    const compact = trimmed.replace(/\s+/g, "");
    if (DOMAIN_REGEX.test(compact)) return { domain: compact.toLowerCase() };
    // try remove scheme-like prefixes
    const cleaned = trimmed.replace(/^(https?:\/\/|ftp:\/\/)/i, "").replace(/\/.*$/, "");
    if (DOMAIN_REGEX.test(cleaned)) return { domain: cleaned.toLowerCase() };
  }

  return { domain: null, reason: "Invalid domain format" };
}

// Format date to readable format
function formatDate(date: Date | null): string {
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// --- Component ---
export default function WhoisPage() {
  const [query, setQuery] = useState("example.com");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function lookup(rawInput?: string) {
    setInputError(null);
    setError(null);
    setData(null);

    const source = rawInput ?? query;
    const { domain, reason } = normalizeToDomain(source);

    if (!domain) {
      setInputError(
        reason ||
        "Invalid domain. Enter a bare domain like example.com (no protocol, no path). Example: 'example.com' or 'sub.example.co.uk'"
      );
      return;
    }

    // Only allow bare domain format in the input field — update it (this enforces UI format)
    setQuery(domain);

    setLoading(true);
    try {
      const res = await fetch(`https://rdap.org/domain/${domain}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json);
      showToast("Domain information retrieved successfully!");
    } catch (err: any) {
      setError(err.message || "Lookup failed");
      showToast(err.message || "Lookup failed", "error");
    } finally {
      setLoading(false);
    }
  }

  function copyData() {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast("WHOIS data copied to clipboard!");
  }

  function exportFile(format: "json" | "txt") {
    if (!data) return;
    const content =
      format === "json"
        ? JSON.stringify(data, null, 2)
        : Object.entries(data)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whois-${query}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${format.toUpperCase()}`);
  }

  async function shareData() {
    if (!data) return;
    const text = JSON.stringify(data, null, 2);
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `WHOIS: ${query}`,
          text,
        });
        showToast("Shared successfully!");
      } catch { }
    } else {
      copyData();
    }
  }

  // --- Parsed summary ---
  const summary = data
    ? (() => {
      const { created, updated, expires } = getRdapDates(data);
      const expiryDays = daysTo(expires);
      const ns = extractNameservers(data);
      const dnssec = getDnssecIndicator(data);
      return {
        registrar: data?.registrar?.name || data?.name || "Unknown",
        created,
        updated,
        expires,
        expiryDays,
        privacy: isPrivacyProxy(data),
        abuse: getAbuseContact(data),
        status: (data?.status || []).join(", ") || "Unknown",
        nameservers: ns,
        dnssec,
      };
    })()
    : null;

  // small heuristic security score (0-100)
  function computeSecurityScore(s: any) {
    if (!s) return null;
    let score = 60;
    // privacy lowers score slightly (obfuscated contact)
    if (s.privacy) score -= 15;
    // missing abuse contact lowers score
    if (!s.abuse) score -= 10;
    // expiry close => lower score
    if (typeof s.expiryDays === "number") {
      if (s.expiryDays <= 0) score -= 30;
      else if (s.expiryDays <= 30) score -= 20;
      else if (s.expiryDays <= 90) score -= 10;
      else score += 5;
    }
    // dnssec presence is good
    if (s.dnssec) score += 10;
    // clamp
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return score;
  }

  const securityScore = summary ? computeSecurityScore(summary) : null;

  // Get score color
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number | null) => {
    if (score === null) return "from-slate-400 to-slate-500";
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-amber-600";
    if (score >= 40) return "from-orange-500 to-red-500";
    return "from-red-600 to-rose-700";
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <Section
        title="WHOIS / RDAP Lookup"
        subtitle="Check domain registration, ownership, registrar, and expiry details"
      >
        {/* Search Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") lookup();
              }}
              placeholder="Enter domain (e.g., example.com)"
              className={`w-full bg-white border-2 rounded-lg px-4 py-3 pr-10 transition-all focus:outline-none focus:ring-2 ${inputError
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
                }`}
              aria-invalid={!!inputError}
              aria-describedby="domain-help"
            />
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
          <button
            onClick={() => lookup()}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Lookup</span>
              </>
            )}
          </button>
        </div>

        {/* Input Error */}
        {inputError && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-red-900">Invalid Domain Format</div>
                <div className="text-sm text-red-700 mt-1">{inputError}</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <code className="bg-white px-2 py-1 rounded text-xs text-red-800 border border-red-200">
                    example.com
                  </code>
                  <code className="bg-white px-2 py-1 rounded text-xs text-red-800 border border-red-200">
                    sub.example.co.uk
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="font-medium text-red-900">{error}</div>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {summary && (
          <div className="mt-6 space-y-6">
            {/* Security Score Header */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -z-0" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-600">Domain Information</div>
                      <div className="text-2xl font-bold text-slate-900">{query}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    <span className="font-medium">Registrar:</span> {summary.registrar}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm font-medium text-slate-600 mb-2">Security Score</div>
                  <div
                    className={`text-5xl font-bold bg-gradient-to-br ${getScoreBgColor(
                      securityScore
                    )} bg-clip-text text-transparent`}
                  >
                    {securityScore ?? "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {summary.privacy ? "🔒 Privacy Protected" : "🔓 Public Registration"}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Registration Dates */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Registration Dates</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Created</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(summary.created)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Last Updated</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(summary.updated)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Expires</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(summary.expires)}
                    </div>
                    {summary.expiryDays !== null && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${summary.expiryDays <= 0
                            ? "bg-red-100 text-red-700"
                            : summary.expiryDays <= 30
                              ? "bg-red-100 text-red-700"
                              : summary.expiryDays <= 90
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                      >
                        <Clock className="w-3 h-3" />
                        {summary.expiryDays <= 0
                          ? "Expired"
                          : `${summary.expiryDays} days left`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Contact */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">Status & Contact</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Domain Status</div>
                    <div className="text-sm font-medium text-slate-900 break-words">
                      {summary.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Abuse Contact</div>
                    {summary.abuse ? (
                      <a
                        href={`mailto:${summary.abuse}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                      >
                        <Mail className="w-4 h-4" />
                        {summary.abuse}
                      </a>
                    ) : (
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        Not available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Security Features</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">DNSSEC</span>
                    {summary.dnssec ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Enabled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-medium text-sm">
                        <XCircle className="w-4 h-4" />
                        Not enabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Privacy Protection</span>
                    {summary.privacy ? (
                      <span className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-medium text-sm">
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Nameservers */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Nameservers</h3>
                <span className="text-xs text-slate-500">
                  ({summary.nameservers?.length || 0} found)
                </span>
              </div>
              {summary.nameservers && summary.nameservers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {summary.nameservers.map((ns: string, idx: number) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-slate-50 rounded border border-slate-200 text-sm font-mono text-slate-700"
                    >
                      {ns}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  No nameservers found
                </div>
              )}
            </div>

            {/* Security Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-lg">Security Insights</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs text-slate-500 mb-1">Privacy / Proxy</div>
                  <div className={`font-semibold ${summary.privacy ? "text-blue-600" : "text-slate-600"}`}>
                    {summary.privacy ? "Detected" : "Not detected"}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs text-slate-500 mb-1">Abuse Contact</div>
                  <div className={`font-semibold ${summary.abuse ? "text-green-600" : "text-red-600"}`}>
                    {summary.abuse ? "Available" : "Missing"}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs text-slate-500 mb-1">Expiry Risk</div>
                  <div
                    className={`font-semibold ${summary.expiryDays === null
                        ? "text-slate-400"
                        : summary.expiryDays <= 0
                          ? "text-red-600"
                          : summary.expiryDays <= 30
                            ? "text-red-600"
                            : summary.expiryDays <= 90
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                  >
                    {summary.expiryDays === null
                      ? "Unknown"
                      : summary.expiryDays <= 0
                        ? "Expired"
                        : summary.expiryDays <= 30
                          ? "High"
                          : summary.expiryDays <= 90
                            ? "Medium"
                            : "Low"}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-sm font-medium text-slate-700 mb-2">
                  💡 Recommended Actions
                </div>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Monitor domain expiry and renew before expiration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Use abuse contact for reporting malicious activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Enable DNSSEC for enhanced security if not already enabled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Verify nameserver configuration matches your DNS provider</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={copyData}
                className="px-4 py-2 bg-white border-2 border-slate-300 hover:border-slate-400 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy JSON
              </button>
              <button
                onClick={() => exportFile("json")}
                className="px-4 py-2 bg-white border-2 border-slate-300 hover:border-slate-400 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => exportFile("txt")}
                className="px-4 py-2 bg-white border-2 border-slate-300 hover:border-slate-400 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Export TXT
              </button>
              <button
                onClick={shareData}
                className="px-4 py-2 bg-white border-2 border-slate-300 hover:border-slate-400 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Raw JSON Viewer */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">Raw RDAP Response</span>
                {showRawJson ? (
                  <ChevronUp className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                )}
              </button>
              {showRawJson && (
                <pre className="text-xs whitespace-pre-wrap bg-slate-900 text-green-400 p-4 max-h-96 overflow-y-auto font-mono border-t border-slate-200">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title="What is WHOIS / RDAP?">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600">
            WHOIS / RDAP (Registration Data Access Protocol) provides comprehensive ownership and
            registration details for domain names. This tool helps security professionals,
            researchers, and administrators investigate domains and monitor their status.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl mb-2">🔎</div>
              <h4 className="font-semibold text-slate-900 mb-1">Investigate Domains</h4>
              <p className="text-sm text-slate-600">
                Research suspicious domains and identify their owners, registrars, and registration dates
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl mb-2">📅</div>
              <h4 className="font-semibold text-slate-900 mb-1">Monitor Expiry</h4>
              <p className="text-sm text-slate-600">
                Track domain expiration dates to prevent service disruptions or identify takedown opportunities
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="font-semibold text-slate-900 mb-1">Security Analysis</h4>
              <p className="text-sm text-slate-600">
                Verify DNSSEC status, identify abuse contacts, and assess domain security posture
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
