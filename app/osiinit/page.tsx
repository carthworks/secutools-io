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

function validateDomain(domain:any) {
  // Basic domain validation (not bulletproof)
  const d = domain.trim().toLowerCase();
  if (!d) return { ok: false, msg: 'Please enter a domain.' };
  // simple regex for domain-like strings
  const re = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (re.test(d)) return { ok: true };
  // suggestion: maybe user omitted www or .com
  if (!d.includes('.')) return { ok: false, msg: 'Domain looks incomplete — did you forget the TLD (e.g. .com)?' };
  return { ok: false, msg: 'Invalid domain format. Example: example.com' };
}

function simpleHighlight(text:any) {
  // Lightweight highlighting: wrap headers and common tokens
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

  function createMockResult(d) {
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

  async function performRealScan(domain:any) {
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

  async function runScan(e) {
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

  function copyToClipboard(text) {
    navigator.clipboard?.writeText(text).then(() => {
      // optionally show toast (simple alert here)
      // In production replace with non-blocking toast
      alert('Copied to clipboard');
    }).catch(() => alert('Copy failed — please copy manually'));
  }

  function download(filename, content) {
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
      navigator.share({ title: `OSINT scan — ${domain}`, text: result }).catch(() => {});
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
        <h1 className="text-2xl sm:text-3xl font-extrabold">OSINT Method 3 — Domain & Website Intelligence</h1>
        <p className="mt-2 text-sm text-gray-300">Collect information about a target's domain, websites, and hosting. Safe, privacy-respecting demo mode by default.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-surface p-4 rounded-lg border border-gray-700">
          <form onSubmit={runScan} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Domain</span>
              <input
                aria-label="Domain to scan"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1 block w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="example.com"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={status === 'running'}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 rounded-md text-white disabled:opacity-50"
              >
                {status === 'running' ? 'Scanning…' : 'Run Scan'}
              </button>

              <button
                type="button"
                onClick={() => { setDomain(''); setResult(''); setStatus('idle'); setError(''); }}
                className="px-3 py-2 bg-gray-800 rounded-md text-sm"
              >Clear</button>

              <button
                type="button"
                onClick={() => setDomain(suggestion())}
                className="ml-auto text-sm px-2 py-1 border rounded-md"
              >Suggest</button>
            </div>

            <div className="text-sm">
              <strong>Status:</strong> <span className={`ml-2 ${status === 'done' ? 'text-green-400' : status === 'running' ? 'text-yellow-400' : 'text-red-400'}`}>{status}</span>
            </div>

            {error && <div role="alert" className="text-sm text-red-400">{error}</div>}

            <details className="text-sm text-gray-300">
              <summary className="cursor-pointer">Tool description & quick start</summary>
              <div className="mt-2">
                <p className="text-xs">This tool helps you gather domain-level information (WHOIS, DNS, website fingerprints, historical snapshots, and IP lookups). For real scans, connect a backend WHOIS/DNS provider — performing these queries directly in the browser is limited by CORS and privacy constraints.</p>
                <ol className="mt-2 list-decimal list-inside text-xs">
                  <li>Enter domain (e.g., example.com)</li>
                  <li>Click "Run Scan" (demo mode runs by default)</li>
                  <li>Export or share results using the buttons</li>
                </ol>
              </div>
            </details>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="px-3 py-2 border rounded-md text-sm" onClick={() => copyToClipboard(result)}>Copy</button>
              <button className="px-3 py-2 border rounded-md text-sm" onClick={exportText}>Export TXT</button>
              <button className="px-3 py-2 border rounded-md text-sm" onClick={exportMarkdown}>Export MD</button>
              <button className="px-3 py-2 border rounded-md text-sm" onClick={exportJSON}>Export JSON</button>
              <button className="px-3 py-2 border rounded-md text-sm" onClick={printPDF}>Export PDF</button>
              <button className="px-3 py-2 border rounded-md text-sm" onClick={shareResult}>Share</button>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              Technical notes: Lightweight, no third-party libraries required. To enable real scanning, add a secure server-side API and swap performRealScan() with your fetch implementation.
            </div>
          </form>
        </section>

        <section className="lg:col-span-2 bg-surface p-4 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold">Result Preview</h2>
            <div className="text-sm text-gray-300">Real-time preview • Syntax highlighting • Accessible</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Raw output</label>
              <textarea
                ref={resultRef}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={12}
                className="mt-1 w-full rounded-md p-3 bg-transparent border border-gray-600 focus:outline-none"
                placeholder="Scan results will appear here (demo mode)..."
              />

              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1 border rounded-md text-sm" onClick={() => copyToClipboard(result)}>Copy Output</button>
                <button className="px-3 py-1 border rounded-md text-sm" onClick={() => setResult(createMockResult(domain))}>Generate Demo</button>
                <button className="px-3 py-1 border rounded-md text-sm" onClick={() => { setResult(''); }}>Clear</button>
              </div>
            </div>

            <div>
              <label className="text-sm">Formatted preview</label>
              <div aria-live="polite" className="mt-1 min-h-[12rem] rounded-md p-3 border border-gray-600 bg-black/40 overflow-auto">
                {result ? (
                  <div className="prose prose-invert text-sm" dangerouslySetInnerHTML={{ __html: simpleHighlight(result) }} />
                ) : (
                  <div className="text-sm text-gray-400">No results yet — run a scan or generate a demo.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium">Quick insights (auto-detection)</h3>
            <div className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2 border rounded-md">
                <strong>Possible issues</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  {result.includes('Outdated') ? <li>Outdated plugin detected — review versions</li> : <li>—</li>}
                </ul>
              </div>
              <div className="p-2 border rounded-md">
                <strong>Actionable suggestions</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
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
          <pre className="whitespace-pre-wrap mt-4">{result}</pre>
        </div>
      </aside>

      <footer className="mt-8 text-xs text-gray-400">
        <div>Security note: This component runs in demo mode. WHOIS and DNS queries should be done from a trusted backend service to avoid exposing sensitive queries and API keys to the browser.</div>
      </footer>
    </div>
  );
}
