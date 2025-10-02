"use client";

import { useState, useMemo } from "react";
import { Copy, Download, RefreshCw } from "lucide-react";
import Section from "@/components/Section";

/* -----------------------
   CVSS Weights & Functions
   ----------------------- */
const metrics = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.5 },
  },
  UI: { N: 0.85, R: 0.62 },
  C: { H: 0.56, L: 0.22, N: 0.0 },
  I: { H: 0.56, L: 0.22, N: 0.0 },
  A: { H: 0.56, L: 0.22, N: 0.0 },
};

type Selection = {
  AV: keyof typeof metrics.AV;
  AC: keyof typeof metrics.AC;
  PR: keyof typeof metrics.PR.U;
  UI: keyof typeof metrics.UI;
  S: "U" | "C";
  C: keyof typeof metrics.C;
  I: keyof typeof metrics.I;
  A: keyof typeof metrics.A;
};

const defaultSel: Selection = {
  AV: "N",
  AC: "L",
  PR: "N",
  UI: "N",
  S: "U",
  C: "N",
  I: "N",
  A: "N",
};

/* Calculate CVSS score */
function calculate(sel: Selection) {
  const iss = 1 - (1 - metrics.C[sel.C]) * (1 - metrics.I[sel.I]) * (1 - metrics.A[sel.A]);

  const impact =
    sel.S === "U"
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);

  const exploitability =
    8.22 *
    metrics.AV[sel.AV] *
    metrics.AC[sel.AC] *
    metrics.PR[sel.S][sel.PR] *
    metrics.UI[sel.UI];

  let baseScore = 0;
  if (impact <= 0) baseScore = 0;
  else if (sel.S === "U") baseScore = Math.min(impact + exploitability, 10);
  else baseScore = Math.min(1.08 * (impact + exploitability), 10);

  return Math.ceil(baseScore * 10) / 10;
}

function severity(score: number) {
  if (score === 0) return { label: "None", color: "bg-gray-500" };
  if (score <= 3.9) return { label: "Low", color: "bg-green-500" };
  if (score <= 6.9) return { label: "Medium", color: "bg-yellow-500 text-black" };
  if (score <= 8.9) return { label: "High", color: "bg-orange-500" };
  return { label: "Critical", color: "bg-red-600" };
}

/* -----------------------
   Component
   ----------------------- */
export default function CVSSCalculator() {
  const [sel, setSel] = useState<Selection>(defaultSel);

  const score = useMemo(() => calculate(sel), [sel]);
  const sev = severity(score);

  const vector = useMemo(
    () =>
      `CVSS:3.1/AV:${sel.AV}/AC:${sel.AC}/PR:${sel.PR}/UI:${sel.UI}/S:${sel.S}/C:${sel.C}/I:${sel.I}/A:${sel.A}`,
    [sel]
  );

  function copyVector() {
    navigator.clipboard.writeText(vector);
    alert("Vector copied to clipboard!");
  }

  function exportFile(type: "txt" | "json") {
    let content = "";
    let mime = "text/plain";
    if (type === "txt") {
      content = `${vector}\nScore: ${score} (${sev.label})`;
    } else {
      content = JSON.stringify({ vector, score, severity: sev.label }, null, 2);
      mime = "application/json";
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cvss.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <Section
        title="CVE Severity Calculator"
        subtitle="Compute CVSS v3.1 Base Score from vulnerability metrics"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Enter vulnerability characteristics below to calculate the CVSS v3.1
          Base Score. The calculator outputs a severity rating (None, Low,
          Medium, High, Critical) along with the vector string.
        </p>

        {/* Score Preview */}
        <div className="p-4 border rounded bg-slate-900 text-white flex items-center justify-between">
          <div className="text-xl font-semibold">Score: {score}</div>
          <div className={`px-3 py-1 rounded text-sm font-bold ${sev.color}`}>
            {sev.label}
          </div>
        </div>

        {/* Metric Inputs */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {(
            [
              ["Attack Vector (AV)", "AV", { N: "Network", A: "Adjacent", L: "Local", P: "Physical" }],
              ["Attack Complexity (AC)", "AC", { L: "Low", H: "High" }],
              ["Privileges Required (PR)", "PR", { N: "None", L: "Low", H: "High" }],
              ["User Interaction (UI)", "UI", { N: "None", R: "Required" }],
              ["Scope (S)", "S", { U: "Unchanged", C: "Changed" }],
              ["Confidentiality (C)", "C", { H: "High", L: "Low", N: "None" }],
              ["Integrity (I)", "I", { H: "High", L: "Low", N: "None" }],
              ["Availability (A)", "A", { H: "High", L: "Low", N: "None" }],
            ] as [string, keyof Selection, Record<string, string>][]
          ).map(([label, key, options]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <select
                value={sel[key]}
                onChange={(e) =>
                  setSel((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full border rounded p-2 bg-white"
              >
                {Object.entries(options).map(([val, name]) => (
                  <option key={val} value={val}>
                    {val} — {name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Vector + Actions */}
        <div className="mt-6 space-y-3">
          <div className="bg-slate-800 text-green-200 rounded p-3 text-sm font-mono overflow-x-auto">
            {vector}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyVector}
              className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-slate-100"
            >
              <Copy size={14} /> Copy Vector
            </button>
            <button
              onClick={() => exportFile("txt")}
              className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-slate-100"
            >
              <Download size={14} /> Export TXT
            </button>
            <button
              onClick={() => exportFile("json")}
              className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-slate-100"
            >
              <Download size={14} /> Export JSON
            </button>
            <button
              onClick={() => setSel(defaultSel)}
              className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-slate-100"
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
