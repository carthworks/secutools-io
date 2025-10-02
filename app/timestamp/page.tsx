"use client";

import { useEffect, useState } from "react";
import Section from "@/components/Section";
import { Copy, RefreshCw } from "lucide-react";

// Utility
function toUnix(d: Date) {
  return Math.floor(d.getTime() / 1000);
}

const timezones = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
];

export default function TimestampPage() {
  const [unix, setUnix] = useState<number>(() => toUnix(new Date()));
  const [human, setHuman] = useState<string>("");
  const [tz, setTz] = useState<string>("UTC");
  const [copied, setCopied] = useState<string | null>(null);

  // Batch converter
  const [batchInput, setBatchInput] = useState<string>("");
  const [batchOutput, setBatchOutput] = useState<string[]>([]);

  // Update human string when unix or timezone changes
  useEffect(() => {
    const d = new Date(unix * 1000);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      dateStyle: "full",
      timeStyle: "long",
    });
    setHuman(fmt.format(d));
  }, [unix, tz]);

  // Parse back from human
  function fromHuman() {
    const t = Date.parse(human);
    if (!isNaN(t)) setUnix(Math.floor(t / 1000));
  }

  // Copy helper
  function copy(val: string, label: string) {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  // Batch convert
  function convertBatch() {
    const lines = batchInput.split("\n").map((l) => l.trim()).filter(Boolean);
    const results = lines.map((line) => {
      let ts: number | null = null;
      if (/^\d{10,13}$/.test(line)) {
        // Unix seconds or ms
        ts = line.length === 13 ? Math.floor(Number(line) / 1000) : Number(line);
      } else {
        const parsed = Date.parse(line);
        if (!isNaN(parsed)) ts = Math.floor(parsed / 1000);
      }
      if (ts) {
        const d = new Date(ts * 1000);
        const fmt = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          dateStyle: "short",
          timeStyle: "medium",
        });
        return `${line}  →  Unix: ${ts}, ${fmt.format(d)}`;
      }
      return `${line}  →  ❌ Invalid`;
    });
    setBatchOutput(results);
  }

  return (
    <div className="space-y-10">
      {/* Single Converter */}
      <Section title="Timestamp Converter" subtitle="Unix ↔ Human">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400">Unix Timestamp</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={unix}
                onChange={(e) => setUnix(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2"
              />
              <button
                onClick={() => copy(String(unix), "unix")}
                className="p-2 border rounded hover:bg-slate-800"
              >
                <Copy size={16} />
              </button>
            </div>
            {copied === "unix" && (
              <p className="text-xs text-green-500">Copied!</p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400">Human Readable</label>
            <div className="flex gap-2">
              <input
                value={human}
                onChange={(e) => setHuman(e.target.value)}
                onBlur={fromHuman}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2"
              />
              <button
                onClick={() => copy(human, "human")}
                className="p-2 border rounded hover:bg-slate-800"
              >
                <Copy size={16} />
              </button>
            </div>
            {copied === "human" && (
              <p className="text-xs text-green-500">Copied!</p>
            )}
          </div>
        </div>

        {/* Timezone + Reset */}
        <div className="flex gap-3 items-center mt-4">
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded p-2"
          >
            {timezones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <button
            onClick={() => setUnix(toUnix(new Date()))}
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-slate-800"
          >
            <RefreshCw size={14} /> Now
          </button>
        </div>
      </Section>

      {/* Batch Converter */}
      <Section
        title="Batch Converter"
        subtitle="Paste multiple Unix or date strings (one per line)"
      >
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          rows={6}
          className="w-full bg-slate-950 border border-slate-800 rounded p-2"
          placeholder="1706932000
1706932123
2025-10-02T18:47:03Z"
        />
        <button
          onClick={convertBatch}
          className="mt-3 px-4 py-2 border rounded bg-blue-500 hover:bg-slate-800"
        >
          Convert
        </button>

        {batchOutput.length > 0 && (
          <div className="mt-4 space-y-2 text-sm bg-white-900 p-3 rounded border border-slate-700">
            {batchOutput.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
