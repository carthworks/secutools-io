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

// --- Component ---
export default function WhoisPage() {
  const [query, setQuery] = useState("example.com");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`https://rdap.org/domain/${query}`);
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
        return {
          registrar: data?.registrar?.name || data?.name || "Unknown",
          created,
          updated,
          expires,
          expiryDays,
          privacy: isPrivacyProxy(data),
          abuse: getAbuseContact(data),
          status: (data?.status || []).join(", ") || "Unknown",
        };
      })()
    : null;

  return (
    <div className="space-y-8">
      <Section
        title="WHOIS / RDAP Lookup"
        subtitle="Check domain registration, ownership, registrar, and expiry details"
      >
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter domain (example.com)"
            className="flex-1 bg-white border border-slate-300 rounded p-2"
          />
          <button
            onClick={lookup}
            disabled={loading}
            className="px-3 py-1 rounded bg-primary text-white font-medium flex items-center gap-1"
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

        {error && (
          <div className="mt-3 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {summary && (
          <div className="mt-4 space-y-3">
            {/* Parsed summary card */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm space-y-2">
              <div>
                <span className="font-semibold">Registrar:</span>{" "}
                {summary.registrar}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {summary.status}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {summary.created?.toISOString() || "Unknown"}
              </div>
              <div>
                <span className="font-semibold">Updated:</span>{" "}
                {summary.updated?.toISOString() || "Unknown"}
              </div>
              <div>
                <span className="font-semibold">Expiry:</span>{" "}
                {summary.expires?.toISOString() || "Unknown"}{" "}
                {summary.expiryDays !== null && (
                  <span
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
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold">Privacy/Proxy:</span>{" "}
                {summary.privacy ? "Enabled 🔴" : "No"}
              </div>
              <div>
                <span className="font-semibold">Abuse Contact:</span>{" "}
                {summary.abuse ? (
                  <a
                    href={`mailto:${summary.abuse}`}
                    className="text-primary underline"
                  >
                    {summary.abuse}
                  </a>
                ) : (
                  "Not found"
                )}
              </div>
            </div>

            {/* Raw JSON */}
            <pre className="text-xs whitespace-pre-wrap bg-black-950 text-black-100 border border-slate-800 rounded p-2 max-h-96 overflow-y-auto">
              {JSON.stringify(data, null, 2)}
            </pre>

            {/* Actions */}
            <div className="flex gap-2 mt-2 flex-wrap">
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
        )}
      </Section>

      <Section title="What is WHOIS / RDAP?">
        <p className="text-sm text-slate-600">
          WHOIS / RDAP provides ownership and registration details of domain
          names. Key insights include registrar info, creation & expiry dates,
          status flags, and abuse contacts.
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
