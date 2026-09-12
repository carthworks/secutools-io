"use client";
/*
OSINTDomainIntelligence.jsx
Next.js client-side React component (single-file) using Tailwind CSS.

Quick start:
- Place this file in a Next.js app (e.g., /components/OSINTDomainIntelligence.jsx).
- Ensure Tailwind CSS is configured for your project.
- This component runs completely client-side and shows a demo/mock scan by default.
- To enable real scans, provide server-side endpoints that perform WHOIS/DNS/website analysis and update `performRealScan` with your API paths.

Features implemented:
- Responsive, accessible UI with Tailwind
- Domain input with validation and suggestions
- Mock "Run Scan" that simulates WHOIS, DNS, Website Scan, Historical, IP Lookup
- One-click copy
- Export: TXT, Markdown, JSON, and Print-to-PDF (print-friendly view)
- Share (navigator.share) fallback to copy
- Syntax-highlighted result panel (simple highlighter) + real-time preview
- Error detection with suggestions
- Minimal external dependencies (no libraries required)
- Lightweight and performant
*/

import { useRef, useState } from 'react';

function validateDomain(domain: string) {
  // Basic domain validation (not bulletproof)
  const d = domain.trim().toLowerCase();
  if (!d) return { ok: false, msg: 'Please enter a domain.' };
  // simple regex for domain-like strings
  const re = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (re.test(d)) return { ok: true, msg: '' };
  // suggestion: maybe user omitted www or .com
  if (!d.includes('.')) return { ok: false, msg: 'Domain looks incomplete — did you forget the TLD (e.g. .com)?' };
  return { ok: false, msg: 'Invalid domain format. Example: example.com' };
}

function simpleHighlight(text: string) {
  // Lightweight highlighting: wrap headers and common tokens
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let out = esc(text)
    .replace(/(WHOIS:)/g, '<span class="font-semibold">$1</span>')
    .replace(/(DNS:)/g, '<span class="font-semibold">$1</span>')
    .replace(/(Website:)/g, '<span class="font-semibold">$1</span>')
    .replace(/(IP Lookup:)/g, '<span class="font-semibold">$1</span>')
    .replace(/(Historical:)/g, '<span class="font-semibold">$1</span>');
  // highlight domain-like tokens
  out = out.replace(/([a-z0-9-]+\.[a-z]{2,})/gi, '<span class="underline">$1</span>');
  return out.replace(/\n/g, '<br/>');
}

export default function OSINTDomainIntelligence() {
  const [domain, setDomain] = useState('example.com');
  const [status, setStatus] = useState('idle'); // idle|running|done|error
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const resultRef = useRef(null);

  const suggestion = () => {
    const v = domain.trim();
    if (!v) return '';
    if (!v.includes('.')) return `${v}.com`;
    if (!v.startsWith('www.') && v.split('.').length === 2) return `www.${v}`;
    return '';
  };

  function createMockResult(d: string) {
    const now = new Date().toISOString();
    return `WHOIS:
Domain: ${d}
Registrar: DemoRegistrar Ltd
Registrant Email: owner@${d}
Created: 2015-04-12
Expires: 2028-04-12

DNS:
A: 203.0.113.45
MX: mail.${d}
TXT: v=spf1 include:_spf.example.com ~all
Subdomains found: admin.${d}, dev.${d}, old.${d}

Website:
CMS: WordPress (detected)
Outdated plugins: contact-form-7 (version 4.8.1)
Exposed directories: /backup/, /old-admin/

Historical:
Snapshots found (Wayback): 2007, 2011, 2018
Notable change: 2018 removed legacy blog

IP Lookup:
IP: 203.0.113.45
ASN: AS12345 DemoNet
Hosting: DemoHost CDN
Shared on same IP: other-example.com, testsite.org

Scan notes:
- Possible hidden admin at admin.${d}
- Outdated plugin may be vulnerable; recommend version review
- Verify mail server configuration (SPF/DKIM)

Scan run at: ${now}
`;
  }

  async function performRealScan(domain: string) {
    // Placeholder: implement server-side APIs that perform WHOIS/DNS/Website scans
    // Example: POST /api/osint/scan { domain }
    // Then fetch results and return.
    // For security and CORS reasons, WHOIS/DNS scanning normally belongs on server-side.

    // Example fetch (commented):
    // const res = await fetch('/api/osint/scan', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({domain}) });
    // if (!res.ok) throw new Error('Scan API failed');
    // return await res.text();

    // For this component we return a simulated result after a short delay.
    await new Promise((r) => setTimeout(r, 900));
    return createMockResult(domain);
  }

  async function runScan(e?: React.FormEvent) {
    e?.preventDefault?.();
    setError('');
    const v = domain.trim().toLowerCase();
    const val = validateDomain(v);
    if (!val.ok) {
      setError(val.msg);
      setStatus('error');
      return;
    }
    setStatus('running');
    try {
      // switch to performRealScan(v) to enable real API integration
      const out = await performRealScan(v);
      setResult(out);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError('Unable to complete scan. Check server integration.');
      setStatus('error');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      // optionally show toast (simple alert here)
      // In production replace with non-blocking toast
      alert('Copied to clipboard');
    }).catch(() => alert('Copy failed — please copy manually'));
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportMarkdown() {
    const md = `# OSINT Domain & Website Intelligence\n\n**Target:** ${domain}\n\n\`\`\`\n${result}\n\`\`\`\n`;
    download(`${domain || 'scan'}.md`, md);
  }

  function exportText() {
    download(`${domain || 'scan'}.txt`, result);
  }

  function exportJSON() {
    const payload = {
      domain,
      result_text: result,
      timestamp: new Date().toISOString(),
    };
    download(`${domain || 'scan'}.json`, JSON.stringify(payload, null, 2));
  }

  function shareResult() {
    if (navigator.share) {
      navigator.share({ title: `OSINT scan — ${domain}`, text: result }).catch(() => { });
    } else {
      copyToClipboard(result);
      alert('Share not supported — result copied to clipboard.');
    }
  }

  function printPDF() {
    // Toggle a print-friendly view and call print
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 500);
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">OSINT Method 3 — Domain & Website Intelligence</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Collect information about a target's domain, websites, and hosting. Safe, privacy-respecting demo mode by default.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <form onSubmit={runScan} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Domain</span>
              <input
                aria-label="Domain to scan"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1 block w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="example.com"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={status === 'running'}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium text-sm disabled:opacity-50 transition"
              >
                {status === 'running' ? 'Scanning…' : 'Run Scan'}
              </button>

              <button
                type="button"
                onClick={() => { setDomain(''); setResult(''); setStatus('idle'); setError(''); }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-medium transition"
              >Clear</button>

              <button
                type="button"
                onClick={() => setDomain(suggestion())}
                className="ml-auto text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md font-medium transition"
              >Suggest</button>
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Status:</strong> <span className={`ml-2 font-medium ${status === 'done' ? 'text-green-600 dark:text-green-400' : status === 'running' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>{status}</span>
            </div>

            {error && <div role="alert" className="text-sm text-rose-600 dark:text-rose-400">⚠ {error}</div>}

            <details className="text-sm text-slate-600 dark:text-slate-400">
              <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">Tool description & quick start</summary>
              <div className="mt-2 text-xs leading-relaxed space-y-2">
                <p>This tool helps you gather domain-level information (WHOIS, DNS, website fingerprints, historical snapshots, and IP lookups). For real scans, connect a backend WHOIS/DNS provider — performing these queries directly in the browser is limited by CORS and privacy constraints.</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Enter domain (e.g., example.com)</li>
                  <li>Click "Run Scan" (demo mode runs by default)</li>
                  <li>Export or share results using the buttons</li>
                </ol>
              </div>
            </details>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={() => copyToClipboard(result)}>Copy</button>
              <button className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={exportText}>Export TXT</button>
              <button className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={exportMarkdown}>Export MD</button>
              <button className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={exportJSON}>Export JSON</button>
              <button className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={printPDF}>Export PDF</button>
              <button className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={shareResult}>Share</button>
            </div>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Technical notes: Lightweight, no third-party libraries required. To enable real scanning, add a secure server-side API and swap performRealScan() with your fetch implementation.
            </div>
          </form>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Result Preview</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400">Real-time preview • Syntax highlighting • Accessible</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Raw output</label>
              <textarea
                ref={resultRef}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={12}
                className="mt-1 w-full rounded-xl p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Scan results will appear here (demo mode)..."
              />

              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={() => copyToClipboard(result)}>Copy Output</button>
                <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={() => setResult(createMockResult(domain))}>Generate Demo</button>
                <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition" onClick={() => { setResult(''); }}>Clear</button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Formatted preview</label>
              <div aria-live="polite" className="mt-1 min-h-[12rem] max-h-[18rem] rounded-xl p-3 border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-xs overflow-auto">
                {result ? (
                  <div className="prose prose-sm dark:prose-invert text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: simpleHighlight(result) }} />
                ) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500">No results yet — run a scan or generate a demo.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Quick insights (auto-detection)</h3>
            <div className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <strong className="text-slate-900 dark:text-white text-xs">Possible issues</strong>
                <ul className="mt-1 list-disc list-inside text-xs text-slate-600 dark:text-slate-400">
                  {result.includes('Outdated') ? <li>Outdated plugin detected — review versions</li> : <li>—</li>}
                </ul>
              </div>
              <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <strong className="text-slate-900 dark:text-white text-xs">Actionable suggestions</strong>
                <ul className="mt-1 list-disc list-inside text-xs text-slate-600 dark:text-slate-400">
                  <li>Check subdomains for forgotten services</li>
                  <li>Review mail server SPF/DKIM</li>
                </ul>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Print-friendly hidden view */}
      <aside className={`print:p-8 ${showPrintView ? '' : 'hidden print:block'}`}>
        <div className="max-w-4xl mx-auto bg-white text-black p-6 rounded shadow">
          <h1 className="text-xl font-bold">OSINT Domain Scan — {domain}</h1>
          <pre className="whitespace-pre-wrap mt-4 font-mono text-xs">{result}</pre>
        </div>
      </aside>

      <footer className="mt-8 text-xs text-slate-500 dark:text-slate-400">
        <div>Security note: This component runs in demo mode. WHOIS and DNS queries should be done from a trusted backend service to avoid exposing sensitive queries and API keys to the browser.</div>
      </footer>
    </div>
  );
}
