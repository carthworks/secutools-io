"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Trash2 } from "lucide-react";

const regexes = {
  ip: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  url: /\bhttps?:\/\/[^\s"'>)]+/gi,
  hash: /\b[a-f0-9]{32}\b|\b[a-f0-9]{40}\b|\b[a-f0-9]{64}\b|\b[a-f0-9]{128}\b/gi,
  email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
};

export default function IOCPage() {
  const [text, setText] = useState("Paste text/logs here");
  const [result, setResult] = useState<any>(null);

  function extract() {
    const r = {
      ips: text.match(regexes.ip) || [],
      urls: text.match(regexes.url) || [],
      hashes: text.match(regexes.hash) || [],
      emails: text.match(regexes.email) || [],
    };
    setResult(r);
  }

  function copyToClipboard(data: string) {
    navigator.clipboard.writeText(data);
  }

  function downloadFile(type: "json" | "txt") {
    if (!result) return;
    let content = "";
    let mime = "text/plain";
    if (type === "json") {
      content = JSON.stringify(result, null, 2);
      mime = "application/json";
    } else {
      content = Object.entries(result)
        .map(([k, v]) => `${k.toUpperCase()}:\n${(v as string[]).join("\n")}`)
        .join("\n\n");
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ioc.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <Section
        title="IOC Extractor"
        subtitle="Extract IPs, URLs, hashes, and emails from raw logs or text"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Paste logs or raw text below. The tool will extract common Indicators
          of Compromise (IOCs) such as IPs, URLs, hashes, and emails. Useful for
          SOC investigations and threat hunting.
        </p>

        {/* Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          placeholder="Paste logs or text containing IPs, URLs, hashes, or emails..."
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={extract}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            Extract IOCs
          </button>
          <button
            onClick={() => setText("")}
            className="px-3.5 py-2 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            {Object.entries(result).map(([key, values]) => (
              <div key={key}>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">
                  {key.toUpperCase()} ({(values as string[]).length})
                </h3>
                {(values as string[]).length > 0 ? (
                  <ul className="space-y-1.5 text-xs font-mono">
                    {(values as string[]).map((v, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 shadow-sm"
                      >
                        <span className="truncate mr-2">{v}</span>
                        <button
                          onClick={() => copyToClipboard(v)}
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Copy"
                        >
                          <Copy size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No matches</p>
                )}
              </div>
            ))}

            {/* Export buttons */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Copy size={13} /> Copy JSON
              </button>
              <button
                onClick={() => downloadFile("json")}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Download size={13} /> Export JSON
              </button>
              <button
                onClick={() => downloadFile("txt")}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Download size={13} /> Export TXT
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
