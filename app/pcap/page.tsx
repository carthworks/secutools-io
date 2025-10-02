"use client";

import React, { useState, useRef } from "react";
import Section from "@/components/Section"; // your existing Section
import { Copy, Share2, Trash2, FileText, File } from "lucide-react";

/**
 * Lightweight PCAP parser (MVP) - enhanced UI wrapper
 * - drag & drop or file input
 * - file validation & error handling
 * - summary cards (magic, snaplen, network, packet count)
 * - packet table with first bytes (hex) + timestamp + sizes
 * - per-item copy + export JSON / TXT / MD
 * - "Print / Save as PDF" via print window
 * - Web Share API integration when available
 *
 * Note: parser is intentionally small and avoids external libs. It's fine for small PCAPs.
 */

/* ----- Low-level PCAP parser (same logic with small improvements) ----- */
function readUint32(view: DataView, offset: number, le: boolean) {
  return le ? view.getUint32(offset, true) : view.getUint32(offset, false);
}
function readUint16(view: DataView, offset: number, le: boolean) {
  return le ? view.getUint16(offset, true) : view.getUint16(offset, false);
}

function parsePcap(buf: ArrayBuffer) {
  try {
    const view = new DataView(buf);
    // Check we have at least global header
    if (view.byteLength < 24) return { error: "File too small to be a valid PCAP" };

    const magicRaw = view.getUint32(0, false);
    let le = false;
    if (magicRaw === 0xa1b2c3d4) le = false;
    else if (magicRaw === 0xd4c3b2a1) le = true;
    else return { error: "Not a PCAP file (magic mismatch)" };

    const versionMajor = readUint16(view, 4, le);
    const versionMinor = readUint16(view, 6, le);
    const thiszone = readUint32(view, 8, le); // usually 0
    const sigfigs = readUint32(view, 12, le);
    const snaplen = readUint32(view, 16, le);
    const network = readUint32(view, 20, le);

    let offset = 24;
    const packets: any[] = [];
    let index = 0;

    while (offset + 16 <= view.byteLength) {
      const tsSec = readUint32(view, offset + 0, le);
      const tsUsec = readUint32(view, offset + 4, le);
      const inclLen = readUint32(view, offset + 8, le);
      const origLen = readUint32(view, offset + 12, le);
      offset += 16;

      // safety check
      if (inclLen < 0 || offset + inclLen > view.byteLength) {
        // truncated packet: stop parsing further to avoid infinite loop
        packets.push({
          ts: new Date(tsSec * 1000 + Math.floor(tsUsec / 1000)).toISOString(),
          inclLen,
          origLen,
          truncated: true,
          firstBytes: "",
        });
        break;
      }

      const data = new Uint8Array(buf, offset, Math.min(inclLen, snaplen));
      const firstBytes = Array.from(data.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      packets.push({
        index,
        ts: new Date(tsSec * 1000 + Math.floor(tsUsec / 1000)).toISOString(),
        inclLen,
        origLen,
        firstBytes,
      });
      offset += inclLen;
      index += 1;

      // safety: cap to avoid hanging on huge files in browser
      if (packets.length > 5000) {
        packets.push({ notice: "Too many packets — stopped at 5000 for performance" });
        break;
      }
    }

    return {
      magic: "0x" + magicRaw.toString(16),
      version: `${versionMajor}.${versionMinor}`,
      thiszone,
      sigfigs,
      snaplen,
      network,
      packetCount: packets.length,
      packets,
    };
  } catch (err) {
    return { error: "Parsing error: " + String(err) };
  }
}

/* ----- Utilities: copy, download, share, print ----- */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
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
function openPrintWindow(html: string) {
  const w = window.open("", "_blank", "noopener");
  if (!w) {
    alert("Unable to open print window (popup blocked). Try using your browser's Print -> Save as PDF.");
    return;
  }
  w.document.open();
  w.document.body.innerHTML = html;
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 300);
}

/* ----- React component ----- */
export default function PCAPPage() {
  const [summary, setSummary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  /* handle file selection */
  async function handleFileSelected(file: File | undefined) {
    setError(null);
    setSummary(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pcap") && !file.type) {
      // type may be empty; check content size and warn but still attempt
      // We'll allow other extensions but show a warning
      setError("Warning: file does not have .pcap extension. Attempting to parse anyway.");
    }
    setLoading(true);
    try {
      const ab = await file.arrayBuffer();
      const res = parsePcap(ab);
      setSummary(res);
      setFileName(file.name);
      // If parse returned error, reflect it
      if ((res && res.error) || (!res || typeof res.packets === "undefined")) {
        setError(res.error || "Unknown parsing result");
      }
    } catch (err: any) {
      setError("File read error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  /* on input change */
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    handleFileSelected(f);
  }

  /* drag & drop behavior */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    handleFileSelected(f);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  /* Export handlers */
  function exportJSON() {
    if (!summary) return;
    downloadBlob(JSON.stringify(summary, null, 2), (fileName || "pcap") + ".json", "application/json");
  }
  function exportTXT() {
    if (!summary) return;
    let out = `PCAP Summary - ${fileName || "file"}\n\n`;
    out += `Magic: ${summary.magic}\nVersion: ${summary.version}\nSnaplen: ${summary.snaplen}\nNetwork: ${summary.network}\nPackets: ${summary.packetCount}\n\n`;
    out += "Packets:\n";
    for (const p of summary.packets || []) {
      if (p.notice) {
        out += `- NOTE: ${p.notice}\n`;
        continue;
      }
      out += `#${p.index} ${p.ts} incl=${p.inclLen} orig=${p.origLen}\n`;
      out += `  ${p.firstBytes}\n`;
    }
    downloadBlob(out, (fileName || "pcap") + ".txt", "text/plain");
  }
  function exportMarkdown() {
    if (!summary) return;
    let md = `# PCAP Summary - ${fileName || "file"}\n\n`;
    md += `- **Magic:** ${summary.magic}\n- **Version:** ${summary.version}\n- **Snaplen:** ${summary.snaplen}\n- **Network:** ${summary.network}\n- **Packets:** ${summary.packetCount}\n\n`;
    md += `## Packets\n\n`;
    for (const p of summary.packets || []) {
      if (p.notice) {
        md += `> **NOTE:** ${p.notice}\n\n`;
        continue;
      }
      md += `### Packet #${p.index}\n- Timestamp: ${p.ts}\n- inclLen: ${p.inclLen}\n- origLen: ${p.origLen}\n\n\`\`\`hex\n${p.firstBytes}\n\`\`\`\n\n`;
    }
    downloadBlob(md, (fileName || "pcap") + ".md", "text/markdown");
  }

  function printAsPDF(summary: any, fileName: string | null) {
  if (!summary) return;

  const html = `
    <html>
      <head>
        <title>PCAP - ${fileName || "file"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          pre { background: #f6f8fa; padding: 10px; border-radius: 6px; overflow-x: auto; }
          .meta { margin-bottom: 10px; }
          .packet { margin-bottom: 8px; }
          .hex { font-family: monospace; white-space: pre-wrap; word-break: break-word; background:#f0f0f0; padding:8px; border-radius:4px; }
        </style>
      </head>
      <body>
        <h1>PCAP - ${fileName || "file"}</h1>
        <div class="meta">
          <p><strong>Magic:</strong> ${summary.magic}</p>
          <p><strong>Version:</strong> ${summary.version}</p>
          <p><strong>Snaplen:</strong> ${summary.snaplen}</p>
          <p><strong>Network:</strong> ${summary.network}</p>
          <p><strong>Packets:</strong> ${summary.packetCount}</p>
        </div>
        <hr/>
        ${(summary.packets && Array.isArray(summary.packets) ? summary.packets.map((p: any) => {
          if (p.notice) return `<div class="packet"><em>${p.notice}</em></div>`;
          return `<div class="packet">
            <h4>Packet #${p.index} — ${p.ts} (incl:${p.inclLen} orig:${p.origLen})</h4>
            <pre class="hex">${p.firstBytes}</pre>
          </div>`;
        }).join("") : "")}
      </body>
    </html>
  `;

  // Create a blob URL
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Create an iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    URL.revokeObjectURL(url);
    document.body.removeChild(iframe);
  };
}


  /* Print: generate simple HTML */
  function printAsPDF0() {
    if (!summary) return;
    const html = `
      <html>
      <head>
        <title>PCAP - ${fileName || "file"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          pre { background: #f6f8fa; padding: 10px; border-radius: 6px; overflow-x: auto; }
          .meta { margin-bottom: 10px; }
          .packet { margin-bottom: 8px; }
          .hex { font-family: monospace; white-space: pre-wrap; word-break: break-word; background:#f0f0f0; padding:8px; border-radius:4px; }
        </style>
      </head>
      <body>
        <h1>PCAP - ${fileName || "file"}</h1>
        <div class="meta">
          <p><strong>Magic:</strong> ${summary.magic}</p>
          <p><strong>Version:</strong> ${summary.version}</p>
          <p><strong>Snaplen:</strong> ${summary.snaplen}</p>
          <p><strong>Network:</strong> ${summary.network}</p>
          <p><strong>Packets:</strong> ${summary.packetCount}</p>
        </div>
        <hr/>
        ${(summary.packets && Array.isArray(summary.packets) ? summary.packets.map((p: any) => {
          if (p.notice) return `<div class="packet"><em>${p.notice}</em></div>`;
          return `<div class="packet"><h4>Packet #${p.index} — ${p.ts} (incl:${p.inclLen} orig:${p.origLen})</h4><pre class="hex">${p.firstBytes}</pre></div>`;
        }).join("") : "")}
      </body>
      </html>
    `;
    openPrintWindow(html);
  }

  /* Share using Web Share API if available */
  async function shareSummary() {
    if (!summary) return;
    const text = `PCAP Summary: ${fileName || "file"} — ${summary.packetCount} packets.`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `PCAP: ${fileName || "file"}`,
          text,
        });
      } catch (err) {
        alert("Share cancelled or failed.");
      }
    } else {
      // fallback: copy short summary
      await copyText(text);
      alert("Share API not available — summary copied to clipboard.");
    }
  }

  /* render helpers */
  function renderFirstBytes(hex: string) {
    // simple highlight: group by byte, colorize every 8 bytes using spans
    if (!hex) return null;
    const parts = hex.split(" ");
    return (
      <div className="text-xs font-mono leading-tight break-words">
        {parts.map((b: string, i: number) => (
          <span
            key={i}
            className={`px-0.5 ${i % 8 === 7 ? "mr-2" : ""}`}
            aria-hidden
          >
            <span className="inline-block w-6 text-slate-200">{b}</span>
          </span>
        ))}
      </div>
    );
  }

  /* Accessibility: keyboard-friendly file input label */
  return (
    <div className="space-y-8">
      <Section
        title="PCAP Decoder"
        subtitle="Client-side PCAP summary & quick triage — timestamps, sizes, and first bytes"
      >
        {/* Tool description */}
        <p className="text-sm text-muted-foreground max-w-2xl">
          Upload a PCAP file (no upload to server). This tool quickly parses the
          global header and packet headers to show timestamps, captured/original
          sizes, and the first bytes of each packet — useful for fast triage and
          sharing findings. Features: drag & drop, copy/export, print-to-PDF,
          and Web Share API.
        </p>

        {/* file input + drag-drop area */}
      {/* file input + drag-drop area */}
<div
  ref={dropRef}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  className="mt-4 rounded border-2 border-dashed border-slate-700 p-4 text-center bg-slate-950"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      document.getElementById("pcap-file-input")?.click();
    }
  }}
  aria-label="Drop PCAP file here or click to select"
>
  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
    <div className="text-sm">Drag & drop a <strong>.pcap</strong> file here</div>
    <div className="text-sm">or</div>

    {/* Fixed: label directly acts as button */}
    <label
      htmlFor="pcap-file-input"
      className="px-4 py-2 border rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
    >
      Choose file
    </label>

    <input
      id="pcap-file-input"
      type="file"
      accept=".pcap,.pcapng"
      onChange={handleFileInput}
      className="hidden"
    />
  </div>
  <div className="mt-2 text-xs text-slate-400">
    Max recommended size: 10 MB. Large files may be slow or truncated.
  </div>
</div>


        {/* feedback */}
        <div className="flex items-center gap-3 mt-3">
          {loading && <div className="text-sm">Parsing…</div>}
          {error && <div className="text-sm text-amber-400">⚠ {error}</div>}
          {summary && !error && (
            <div className="text-sm text-green-400">Parsed successfully</div>
          )}
          {fileName && <div className="ml-auto text-xs text-slate-400">File: {fileName}</div>}
        </div>

        {/* summary cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded border bg-slate-900 text-sm">
              <div className="text-xs text-slate-400">Magic</div>
              <div className="font-medium text-green-300">{summary.magic}</div>
            </div>
            <div className="p-3 rounded border bg-slate-900 text-sm">
              <div className="text-xs text-slate-400">Version</div>
              <div className="font-medium  text-green-300">{summary.version}</div>
            </div>
            <div className="p-3 rounded border bg-slate-900 text-sm">
              <div className="text-xs text-slate-400">Snaplen</div>
              <div className="font-medium  text-green-300">{summary.snaplen}</div>
            </div>
            <div className="p-3 rounded border bg-slate-900 text-sm">
              <div className="text-xs text-slate-400">Packets</div>
              <div className="font-medium  text-green-300">{summary.packetCount}</div>
            </div>
          </div>
        )}

        {/* actions: copy/export/share/print/clear */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={async () => {
              if (!summary) return;
              const ok = await copyText(JSON.stringify(summary, null, 2));
              if (ok) alert("Summary JSON copied to clipboard");
            }}
            className="flex items-center gap-2 px-3 py-2 border rounded"
            aria-label="Copy summary JSON"
          >
            <Copy size={16} /> Copy JSON
          </button>

          <button onClick={exportJSON} className="flex items-center gap-2 px-3 py-2 border rounded">
            <FileText size={16} /> Download JSON
          </button>

          <button onClick={exportTXT} className="flex items-center gap-2 px-3 py-2 border rounded">
            <File size={16} /> Download TXT
          </button>

          <button onClick={exportMarkdown} className="flex items-center gap-2 px-3 py-2 border rounded">
            <FileText size={16} /> Download MD
          </button>

          <button
            onClick={() => printAsPDF(summary, fileName)}
            className="flex items-center gap-2 px-3 py-2 border rounded"
          >
            Print / Save as PDF
          </button>

          <button onClick={shareSummary} className="flex items-center gap-2 px-3 py-2 border rounded ml-auto">
            <Share2 size={16} /> Share
          </button>

          <button
            onClick={() => {
              setSummary(null);
              setFileName(null);
              setError(null);
            }}
            className="flex items-center gap-2 px-3 py-2 border rounded"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>

        {/* packets table */}
        {summary && summary.packets && (
          <div className="mt-6">
            <div className="text-sm text-slate-400 mb-2">Packets (first 5000 shown)</div>
            <div className="overflow-auto rounded border bg-slate-900">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-800 text-green-700">
                  <tr>
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Timestamp</th>
                    <th className="px-2 py-2 text-left">incl / orig</th>
                    <th className="px-2 py-2 text-left">First bytes (hex)</th>
                    <th className="px-2 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {summary.packets.map((p: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-slate-900" : "bg-slate-950/20 text-white"}>
                      <td className="px-2 py-2 align-top text-white">{p.index ?? i}</td>
                      <td className="px-2 py-2 align-top">{p.ts}</td>
                      <td className="px-2 py-2 align-top">{p.inclLen} / {p.origLen}</td>
                      <td className="px-2 py-2 align-top">
                        {p.notice ? <em className="text-xs text-amber-400">{p.notice}</em> : renderFirstBytes(p.firstBytes)}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              copyText(p.firstBytes || "");
                              alert("Hex copied");
                            }}
                            className="px-2 py-1 border rounded text-xs"
                          >
                            Copy hex
                          </button>
                          <button
                            onClick={() => {
                              const single = {
                                file: fileName || "pcap",
                                packet: p,
                                meta: { magic: summary.magic, version: summary.version },
                              };
                              downloadBlob(JSON.stringify(single, null, 2), `${fileName || "pcap"}-pkt-${p.index}.json`, "application/json");
                            }}
                            className="px-2 py-1 border rounded text-xs"
                          >
                            Export pkt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </Section>
    </div>
  );
}
