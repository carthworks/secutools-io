"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Share2, ExternalLink } from "lucide-react";

const owaspTop10 = [
  "A01: Broken Access Control",
  "A02: Cryptographic Failures",
  "A03: Injection",
  "A04: Insecure Design",
  "A05: Security Misconfiguration",
  "A06: Vulnerable and Outdated Components",
  "A07: Identification and Authentication Failures",
  "A08: Software and Data Integrity Failures",
  "A09: Security Logging and Monitoring Failures",
  "A10: Server-Side Request Forgery",
];

const learningLinks = [
  { title: "OWASP Top 10 Official", url: "https://owasp.org/Top10/" },
  { title: "MITRE ATT&CK Matrix", url: "https://attack.mitre.org/" },
  { title: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security" },
  { title: "TryHackMe Labs", url: "https://tryhackme.com/" },
  { title: "HackTheBox Academy", url: "https://academy.hackthebox.com/" },
  { title: "Cybrary Security Courses", url: "https://www.cybrary.it/" },
  { title: "Google Gruyere (Web Security Lab)", url: "https://google-gruyere.appspot.com/" },
];

export default function CheatsheetsPage() {
  const [copied, setCopied] = useState(false);

  const copyOWASP = async () => {
    await navigator.clipboard.writeText(owaspTop10.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportFile = (type: "txt" | "md") => {
    const content =
      type === "txt"
        ? owaspTop10.join("\n")
        : `# OWASP Top 10 (2021)\n\n${owaspTop10.map((o) => `- ${o}`).join("\n")}`;
    const blob = new Blob([content], { type: type === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `owasp-top10.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = "Check out OWASP Top 10 (2021) and MITRE ATT&CK for cybersecurity learning!";
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Cybersecurity Cheatsheets", text, url: window.location.href });
      } catch {
        alert("Share cancelled");
      }
    } else {
      await copyOWASP();
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Intro */}
      <section className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Cybersecurity Cheatsheets & Learning Hub</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          A quick-access reference for students and professionals to learn the most important 
          security frameworks, top risks, and hands-on tutorials.
        </p>
      </section>

      {/* OWASP Top 10 */}
      <Section title="OWASP Top 10 (2021)" subtitle="The most critical web application security risks">
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>
            <a className="text-primary" href="https://owasp.org/Top10/" target="_blank" rel="noreferrer">
              OWASP Top 10 official site
            </a>
          </li>
          {owaspTop10.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={copyOWASP}
            className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-slate-100"
          >
            <Copy size={14} /> {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => exportFile("txt")}
            className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-slate-100"
          >
            <Download size={14} /> Export TXT
          </button>
          <button
            onClick={() => exportFile("md")}
            className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-slate-100"
          >
            <Download size={14} /> Export MD
          </button>
          <button
            onClick={share}
            className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-slate-100"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </Section>

      {/* MITRE ATT&CK */}
      <Section title="MITRE ATT&CK" subtitle="Adversary tactics and techniques">
        <p className="text-sm text-slate-600">
          Quick lookup:{" "}
          <a className="text-primary" href="https://attack.mitre.org/" target="_blank" rel="noreferrer">
            MITRE ATT&CK Matrix
          </a>
        </p>
      </Section>

      {/* Extra Learning Resources */}
      <Section title="Cybersecurity Learning Resources" subtitle="Hand-picked tutorials and labs for hands-on skills">
        <ul className="space-y-2 text-sm">
          {learningLinks.map((l, i) => (
            <li key={i}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                {l.title} <ExternalLink size={14} />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
