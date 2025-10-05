"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * TextToVoice - client side TTS component using Web Speech API
 *
 * Notes:
 * - Playback uses window.speechSynthesis and available voices.
 * - Audio file export is disabled (see UI). To export audio you need a server-side TTS or an external TTS API that returns audio files.
 * - No external deps. Lightweight and accessible.
 */

type VoiceType = "male" | "female" | "child" | "aged" | "any";
type ExportFormat = "txt" | "md" | "pdf" | "audio";

function niceNow() {
  return new Date().toLocaleString();
}
function downloadBlob(content: string | Blob, filename: string, mime?: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime ?? "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* heuristics to choose voices by type */
function matchesVoiceType(voice: SpeechSynthesisVoice, type: VoiceType) {
  const name = (voice.name || "").toLowerCase();
  const lang = (voice.lang || "").toLowerCase();
  if (type === "any") return true;
  if (type === "female") {
    if (name.includes("female") || name.includes("zira") || name.includes("samantha") || name.includes("katherine")) return true;
    if (/^en(-|_)?/i.test(lang) && !name.includes("male")) return true;
    // heuristic: voices with typical female names:
    if (name.match(/\b(alex|sara|sarah|anna|emma|olivia|ava|mia|sophia|sofia)\b/)) return true;
  }
  if (type === "male") {
    if (name.includes("male") || name.includes("david") || name.includes("mark") || name.includes("matthew")) return true;
    if (name.match(/\b(david|michael|mark|john|alexander|alex)\b/)) return true;
  }
  if (type === "child") {
    if (name.includes("child") || name.includes("kid") || name.includes("young")) return true;
    // some voices contain "baby" or "child" rarely; fallback to higher pitch selection
  }
  if (type === "aged") {
    if (name.includes("grand") || name.includes("elder") || name.includes("old")) return true;
    // rarely present; fallback to lower pitch selection
  }
  return false;
}

export default function TextToVoice() {
  const [text, setText] = useState<string>(
    "Type or paste text here — use the voice controls and press Play to hear it."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string | null>(null);
  const [voiceType, setVoiceType] = useState<VoiceType>("female");
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [format, setFormat] = useState<ExportFormat>("txt");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastActionAt, setLastActionAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // load voices
  useEffect(() => {
    function load() {
      const v = window.speechSynthesis.getVoices() || [];
      setVoices(v);
      setVoicesLoaded(true);
      // try to pick a default voice if none selected
      if (!selectedVoiceUri && v.length) {
        // try to pick a voice matching the initial voiceType
        const candidate = v.find((vv) => matchesVoiceType(vv, voiceType)) || v[0];
        setSelectedVoiceUri(candidate?.voiceURI ?? candidate?.name ?? null);
      }
    }
    load();
    // some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      load();
    };
    return () => {
      // cleanup
      window.speechSynthesis.onvoiceschanged = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update selectedVoice when voiceType changes (if user hasn't manually chosen another)
  useEffect(() => {
    if (!voices.length) return;
    // pick best match
    const candidate = voices.find((vv) => matchesVoiceType(vv, voiceType)) || voices[0];
    setSelectedVoiceUri(candidate?.voiceURI ?? candidate?.name ?? null);
  }, [voiceType, voices]);

  // find selected voice object
  const selectedVoice = useMemo(() => {
    return voices.find((v) => (v.voiceURI === selectedVoiceUri || v.name === selectedVoiceUri)) ?? null;
  }, [voices, selectedVoiceUri]);

  // speak text
  const speak = async () => {
    setError(null);
    if (!("speechSynthesis" in window)) {
      setError("SpeechSynthesis is not supported in this browser.");
      return;
    }
    if (!text.trim()) {
      setError("Enter some text to speak.");
      return;
    }
    // cancel any existing
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      try {
        // modern browsers support voice by voiceURI or name
        // some voices have identical names or URIs; we try both
        (utt as any).voice = selectedVoice;
      } catch {}
    }
    utt.rate = Math.max(0.1, Math.min(3, rate));
    utt.pitch = Math.max(0, Math.min(2, pitch));
    utt.volume = Math.max(0, Math.min(1, volume));
    utteranceRef.current = utt;
    setPlaying(true);
    setPaused(false);
    setCharIndex(0);
    setLastActionAt(niceNow());

    utt.onend = () => {
      setPlaying(false);
      setPaused(false);
      setCharIndex(0);
      utteranceRef.current = null;
    };
    utt.onerror = (ev) => {
      setError("Playback error: " + (ev?.error ?? "unknown"));
      setPlaying(false);
      setPaused(false);
      utteranceRef.current = null;
    };
    utt.onboundary = (ev: SpeechSynthesisEvent) => {
      if (ev.name === "word" || typeof ev.charIndex === "number") {
        setCharIndex(ev.charIndex ?? 0);
      }
    };
    try {
      window.speechSynthesis.speak(utt);
    } catch (e: any) {
      setError("Failed to start speech: " + String(e?.message ?? e));
      setPlaying(false);
    }
  };

  const pause = () => {
    if ("speechSynthesis" in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      setLastActionAt(niceNow());
    }
  };
  const resume = () => {
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setLastActionAt(niceNow());
    }
  };
  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setPaused(false);
      setCharIndex(0);
      setLastActionAt(niceNow());
      utteranceRef.current = null;
    }
  };

  // copy text
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setLastActionAt(niceNow());
    } catch {
      setError("Copy failed (clipboard access denied).");
    }
  };

  // export text/markdown/pdf
  const exportText = (mode: ExportFormat) => {
    if (mode === "txt") {
      downloadBlob(text, `tts_${new Date().toISOString()}.txt`, "text/plain");
    } else if (mode === "md") {
      const md = `# Spoken Text\n\n${text}\n\n---\nGenerated: ${new Date().toLocaleString()}`;
      downloadBlob(md, `tts_${new Date().toISOString()}.md`, "text/markdown");
    } else if (mode === "pdf") {
      // simple print-to-pdf using a new window
      const w = window.open("", "_blank", "noopener");
      if (!w) {
        setError("Unable to open print window.");
        return;
      }
      const html = `
        <html>
          <head>
            <title>Text to Voice - Print</title>
            <style>body{font-family:Inter, system-ui, Arial; padding:20px; color:#111} pre{white-space:pre-wrap; font-family:inherit}</style>
          </head>
          <body>
            <h1>Text to Voice</h1>
            <pre>${(text || "").replace(/</g, "&lt;")}</pre>
            <p>Exported: ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `;
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } else if (mode === "audio") {
      // disabled in client-only mode — show explanation
      setError(
        "Exporting synthesized audio to a file is not supported reliably in browsers with the Web Speech API. Use a server-side TTS or external TTS provider to generate downloadable audio."
      );
    }
    setLastActionAt(niceNow());
  };

  // share
  const share = async () => {
    const payload = { title: "Text to Voice", text };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        setLastActionAt(niceNow());
      } catch (e: any) {
        setError("Share failed or cancelled.");
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("Share not supported. Text copied to clipboard as fallback.");
      } catch {
        setError("Share not supported and clipboard access failed.");
      }
    }
  };

  // quick presets for voiceType -> pitch/rate suggestions
  useEffect(() => {
    if (voiceType === "female") {
      setPitch(1.1);
      setRate(1.0);
    } else if (voiceType === "male") {
      setPitch(0.9);
      setRate(1.0);
    } else if (voiceType === "child") {
      setPitch(1.5);
      setRate(1.15);
    } else if (voiceType === "aged") {
      setPitch(0.75);
      setRate(0.9);
    } else {
      setPitch(1.0);
      setRate(1.0);
    }
    // we intentionally don't add rate/pitch setters as deps to avoid override when user adjusts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceType]);

  // highlight preview (very basic: mark currently spoken char)
  const previewHighlighted = useMemo(() => {
    if (!text) return "";
    const idx = Math.max(0, Math.min(charIndex || 0, text.length));
    return (
      <>
        <span className="text-slate-700">{text.slice(0, idx)}</span>
        <mark className="bg-yellow-200 text-black">{text.slice(idx, Math.min(idx + 40, text.length))}</mark>
        <span className="text-slate-500">{text.slice(Math.min(idx + 40, text.length))}</span>
      </>
    );
  }, [text, charIndex]);

  // UI helpers
  const voiceOptions = useMemo(() => {
    if (!voices.length) return [{ label: "Default (no voices available)", value: "" }];
    return voices.map((v) => ({
      label: `${v.name} — ${v.lang}${v.default ? " (default)" : ""}`,
      value: v.voiceURI ?? v.name,
    }));
  }, [voices]);

  return (
    <section className="max-w-4xl mx-auto p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Text → Voice</h1>
        <p className="text-sm text-slate-500 mt-1">
          Convert text to speech in your browser using available voices. Play, pause, and tweak voice settings. (Audio file export requires a server-side TTS.)
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <label className="block text-xs font-medium text-slate-700">Text to speak</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full border rounded p-3 text-sm focus:outline-none focus:ring"
            aria-label="Text input"
          />

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={speak}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm disabled:opacity-50"
              disabled={!("speechSynthesis" in window) || playing}
              aria-pressed={playing}
            >
              Play
            </button>
            <button onClick={pause} className="px-3 py-2 border rounded text-sm" disabled={!playing || paused}>
              Pause
            </button>
            <button onClick={resume} className="px-3 py-2 border rounded text-sm" disabled={!playing || !paused}>
              Resume
            </button>
            <button onClick={stop} className="px-3 py-2 border rounded text-sm" disabled={!playing && !paused}>
              Stop
            </button>

            <div className="ml-auto flex gap-2">
              <button onClick={copyText} className="px-3 py-2 border rounded text-sm">Copy</button>
              <div className="relative">
                <button
                  className="px-3 py-2 border rounded text-sm"
                  onClick={() => exportText("txt")}
                >
                  Export TXT
                </button>
              </div>
              <button onClick={() => exportText("md")} className="px-3 py-2 border rounded text-sm">Export MD</button>
              <button onClick={() => exportText("pdf")} className="px-3 py-2 border rounded text-sm">Print / PDF</button>
              <button onClick={share} className="px-3 py-2 border rounded text-sm">Share</button>
            </div>
          </div>

          <div className="mt-3 rounded border bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">Realtime preview</div>
              <div className="text-xs text-slate-500">Position: {charIndex} / {text.length}</div>
            </div>
            <div className="mt-2 p-2 bg-white rounded text-sm min-h-[72px]">
              <div aria-live="polite">{previewHighlighted}</div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            <strong>Note:</strong> Direct audio file export is not available client-side with the browser's SpeechSynthesis API. For downloadable audio, integrate a server-side TTS or external TTS provider that returns audio files (MP3/WAV/OGG).
          </div>
        </div>

        {/* controls */}
        <aside className="space-y-3">
          <div className="rounded border p-3 bg-white">
            <label className="block text-xs font-medium">Voice preset</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setVoiceType("female")}
                className={`px-2 py-1 text-sm rounded ${voiceType === "female" ? "bg-blue-600 text-white" : "border"}`}
              >
                Female
              </button>
              <button
                onClick={() => setVoiceType("male")}
                className={`px-2 py-1 text-sm rounded ${voiceType === "male" ? "bg-blue-600 text-white" : "border"}`}
              >
                Male
              </button>
              <button
                onClick={() => setVoiceType("child")}
                className={`px-2 py-1 text-sm rounded ${voiceType === "child" ? "bg-blue-600 text-white" : "border"}`}
              >
                Child
              </button>
              <button
                onClick={() => setVoiceType("aged")}
                className={`px-2 py-1 text-sm rounded ${voiceType === "aged" ? "bg-blue-600 text-white" : "border"}`}
              >
                Aged
              </button>
            </div>

            <label className="block text-xs font-medium mt-3">Voice (manual)</label>
            <select
              value={selectedVoiceUri ?? ""}
              onChange={(e) => setSelectedVoiceUri(e.target.value)}
              className="w-full mt-2 border rounded px-2 py-1 text-sm"
              aria-label="Select voice"
            >
              {voiceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="mt-3 grid gap-3">
              <label className="text-xs">Rate ({rate.toFixed(2)})</label>
              <input
                type="range"
                min={0.4}
                max={2.0}
                step={0.05}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
              <label className="text-xs">Pitch ({pitch.toFixed(2)})</label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
              <label className="text-xs">Volume ({volume.toFixed(2)})</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded border p-3 bg-white">
            <label className="block text-xs font-medium">Export / Format</label>
            <div className="mt-2 flex flex-col gap-2">
              <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} className="border rounded p-1 text-sm">
                <option value="txt">Text (TXT)</option>
                <option value="md">Markdown (MD)</option>
                <option value="pdf">Print/PDF</option>
                <option value="audio">Audio (MP3/WAV) — requires server/API</option>
              </select>

              <button
                className="px-3 py-2 border rounded text-sm"
                onClick={() => {
                  if (format === "audio") {
                    setError("Audio export is not available client-side. Use a server-side TTS or external API to produce downloadable audio files.");
                  } else {
                    exportText(format);
                  }
                }}
              >
                Export
              </button>
            </div>
          </div>

          <div className="rounded border p-3 bg-white">
            <div className="text-xs font-medium">Status</div>
            <div className="mt-2 text-sm">
              <div>Voices loaded: {voicesLoaded ? `${voices.length}` : "loading..."}</div>
              <div>Last action: {lastActionAt ?? "—"}</div>
              <div className="mt-2 text-red-600">{error}</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}