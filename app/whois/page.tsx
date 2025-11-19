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

// --- Component ---
export default function WhoisPage() {
  const [query, setQuery] = useState("example.com");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function copyData() {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("WHOIS data copied to clipboard ✅");
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
      } catch {}
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

  return (
    <div className="space-y-8">
      <Section
        title="WHOIS / RDAP Lookup"
        subtitle="Check domain registration, ownership, registrar, and expiry details"
      >
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") lookup();
            }}
            placeholder="Enter domain (example.com)"
            className={`flex-1 bg-white border rounded p-2 ${
              inputError ? "border-red-400" : "border-slate-300"
            }`}
            aria-invalid={!!inputError}
            aria-describedby="domain-help"
          />
          <button
            onClick={() => lookup()}
            disabled={loading}
            className="px-3 py-1 rounded bg-primary bg-blue-400 text-white font-medium flex items-center gap-1"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" /> Lookup
              </>
            )}
          </button>
        </div>

        {inputError && (
          <div className="mt-3 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Invalid domain</div>
                <div className="text-xs mt-1">
                  {inputError}
                  <div className="mt-1">
                    Examples: <code className="bg-slate-100 px-1 rounded">example.com</code>,{" "}
                    <code className="bg-slate-100 px-1 rounded">sub.example.co.uk</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Mini Dashboard */}
        {summary && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Big summary card */}
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">Domain</div>
                  <div className="text-xl font-semibold">{query}</div>
                  <div className="text-sm text-slate-600 mt-1">{summary.registrar}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Security score</div>
                  <div className="text-2xl font-bold">{securityScore ?? "—"}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {summary.privacy ? "Privacy/Proxy detected" : "No privacy proxy"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-white rounded border">
                  <div className="font-semibold">Status</div>
                  <div className="mt-1">{summary.status}</div>
                </div>

                <div className="p-2 bg-white rounded border">
                  <div className="font-semibold">Abuse contact</div>
                  <div className="mt-1">
                    {summary.abuse ? (
                      <a className="text-primary underline" href={`mailto:${summary.abuse}`}>
                        {summary.abuse}
                      </a>
                    ) : (
                      <span className="text-slate-500">Not found</span>
                    )}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border">
                  <div className="font-semibold">Created</div>
                  <div className="mt-1">{summary.created?.toISOString() || "Unknown"}</div>
                </div>

                <div className="p-2 bg-white rounded border">
                  <div className="font-semibold">Updated</div>
                  <div className="mt-1">{summary.updated?.toISOString() || "Unknown"}</div>
                </div>

                <div className="p-2 bg-white rounded border col-span-2">
                  <div className="font-semibold">Expiry</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div>{summary.expires?.toISOString() || "Unknown"}</div>
                    {summary.expiryDays !== null && (
                      <div
                        className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          summary.expiryDays <= 30
                            ? "bg-red-100 text-red-700"
                            : summary.expiryDays <= 90
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {summary.expiryDays <= 0
                          ? "Expired"
                          : `Expires in ${summary.expiryDays} days`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border">
                  <div className="font-semibold">DNSSEC</div>
                  <div className="mt-1">{summary.dnssec ? "Enabled" : "Unknown / Not enabled"}</div>
                </div>

                <div className="p-2 bg-white rounded border">
                  <div className="font-semibold">Nameservers</div>
                  <div className="mt-1 text-xs">
                    {summary.nameservers && summary.nameservers.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {summary.nameservers.slice(0, 5).map((n: string) => (
                          <li key={n} className="truncate max-w-full">
                            {n}
                          </li>
                        ))}
                        {summary.nameservers.length > 5 && (
                          <li className="text-slate-500">and more...</li>
                        )}
                      </ul>
                    ) : (
                      <span className="text-slate-500">Not found</span>
                    )}
                  </div>
                </div>
              </div>

              {/* quick actions */}
              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={copyData}
                  className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={() => exportFile("json")}
                  className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" /> Export JSON
                </button>
                <button
                  onClick={() => exportFile("txt")}
                  className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
                >
                  <Download className="w-4 h-4" /> Export TXT
                </button>
                <button
                  onClick={shareData}
                  className="px-3 py-1 border rounded flex items-center gap-1 text-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {/* Small pane with highlights / alerts */}
            <div className="bg-white border border-slate-200 rounded p-4 text-sm space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Security Insights</div>
                  <div className="text-xs text-slate-600">
                    Quick heuristic view of potential concerns.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">Privacy / Proxy</div>
                  <div className="font-medium">{summary.privacy ? "Yes" : "No"}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">Abuse contact</div>
                  <div className="font-medium">{summary.abuse ? "Present" : "Missing"}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">Expiry risk</div>
                  <div className="font-medium">
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

                <div className="pt-2">
                  <div className="text-xs text-slate-500">Recommended actions</div>
                  <ul className="list-disc pl-5 text-xs mt-1 text-slate-600">
                    <li>Monitor expiry if expiry is near.</li>
                    <li>Contact abuse address for malicious activity.</li>
                    <li>Check DNSSEC from authoritative DNS if important.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raw JSON */}
        {summary && (
          <pre className="text-xs whitespace-pre-wrap bg-black-950 text-black-100 border border-slate-800 rounded p-2 max-h-96 overflow-y-auto mt-4">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </Section>

      <Section title="What is WHOIS / RDAP?">
        <p className="text-sm text-slate-600">
          WHOIS / RDAP provides ownership and registration details of domain names.
          Key insights include registrar info, creation & expiry dates, status flags,
          and abuse contacts.
        </p>
        <ul className="list-disc pl-5 text-sm mt-2 text-slate-600">
          <li>🔎 Investigate suspicious domains</li>
          <li>📅 Monitor expiry dates for takedowns</li>
          <li>🛡️ Identify registrar and abuse contacts</li>
        </ul>
      </Section>
    </div>
  );
}
