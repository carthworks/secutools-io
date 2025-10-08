"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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

/* Heuristic voice matching */
function matchesVoiceType(voice: SpeechSynthesisVoice, type: VoiceType) {
  const name = (voice.name || "").toLowerCase();
  const lang = (voice.lang || "").toLowerCase();
  if (type === "any") return true;

  const femaleNames = ["samantha", "zira", "katherine", "anna", "emma", "olivia", "ava", "mia", "sophia"];
  const maleNames = ["david", "mark", "michael", "john", "alex", "paul"];
  const childNames = ["child", "kid", "young"];
  const agedNames = ["grand", "elder", "old"];

  if (type === "female" && (name.includes("female") || femaleNames.some(n => name.includes(n)))) return true;
  if (type === "male" && (name.includes("male") || maleNames.some(n => name.includes(n)))) return true;
  if (type === "child" && childNames.some(n => name.includes(n))) return true;
  if (type === "aged" && agedNames.some(n => name.includes(n))) return true;
  return false;
}

export default function TextToVoice() {
  const [text, setText] = useState("Type or paste text here — then press Play to hear it.");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string | null>(null);
  const [voiceType, setVoiceType] = useState<VoiceType>("female");
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [format, setFormat] = useState<ExportFormat>("txt");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastActionAt, setLastActionAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [charIndex, setCharIndex] = useState(0);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Load available voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    const load = () => {
      const v = synth.getVoices() || [];
      setVoices(v);
      setVoicesLoaded(true);
      if (!selectedVoiceUri && v.length) {
        const candidate = v.find(vv => matchesVoiceType(vv, voiceType)) || v[0];
        setSelectedVoiceUri(candidate?.voiceURI ?? candidate?.name ?? null);
      }
    };

    load();
    synth.onvoiceschanged = load;
    return () => {
      synth.onvoiceschanged = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update when user changes voiceType
  useEffect(() => {
    if (!voices.length) return;
    const candidate = voices.find(vv => matchesVoiceType(vv, voiceType)) || voices[0];
    setSelectedVoiceUri(candidate?.voiceURI ?? candidate?.name ?? null);
  }, [voiceType, voices]);

  const selectedVoice = useMemo(
    () => voices.find(v => v.voiceURI === selectedVoiceUri || v.name === selectedVoiceUri) ?? null,
    [voices, selectedVoiceUri]
  );

  const speak = () => {
    setError(null);
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("SpeechSynthesis not supported in this browser.");
      return;
    }
    if (!text.trim()) {
      setError("Enter some text first.");
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utt.voice = selectedVoice;
    utt.rate = rate;
    utt.pitch = pitch;
    utt.volume = volume;
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
      setError("Playback error: " + (ev.error ?? "unknown"));
      setPlaying(false);
    };
    utt.onboundary = (ev) => {
      if (typeof ev.charIndex === "number") setCharIndex(ev.charIndex);
    };
    synth.speak(utt);
  };

  const pause = () => {
    const s = window.speechSynthesis;
    if (s.speaking && !s.paused) {
      s.pause();
      setPaused(true);
      setLastActionAt(niceNow());
    }
  };
  const resume = () => {
    const s = window.speechSynthesis;
    if (s.paused) {
      s.resume();
      setPaused(false);
      setLastActionAt(niceNow());
    }
  };
  const stop = () => {
    const s = window.speechSynthesis;
    s.cancel();
    setPlaying(false);
    setPaused(false);
    setCharIndex(0);
    setLastActionAt(niceNow());
    utteranceRef.current = null;
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setLastActionAt(niceNow());
    } catch {
      setError("Copy failed.");
    }
  };

  const exportText = (mode: ExportFormat) => {
    if (mode === "txt") {
      downloadBlob(text, `tts_${Date.now()}.txt`, "text/plain");
    } else if (mode === "md") {
      const md = `# Text to Voice\n\n${text}\n\n— Generated: ${niceNow()}`;
      downloadBlob(md, `tts_${Date.now()}.md`, "text/markdown");
    } else if (mode === "pdf") {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(`<pre>${text}</pre>`);
        w.document.close();
        w.print();
      }
    } else {
      setError("Audio export not available — browser TTS cannot save audio files.");
    }
    setLastActionAt(niceNow());
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Text to Voice", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Share not supported. Text copied to clipboard.");
      }
      setLastActionAt(niceNow());
    } catch {
      setError("Share failed.");
    }
  };

  // Preview highlight
  const previewHighlighted = useMemo(() => {
    const idx = Math.max(0, Math.min(charIndex, text.length));
    return (
      <>
        <span className="text-slate-700">{text.slice(0, idx)}</span>
        <mark className="bg-yellow-200">{text.slice(idx, idx + 40)}</mark>
        <span className="text-slate-500">{text.slice(idx + 40)}</span>
      </>
    );
  }, [text, charIndex]);

  const voiceOptions = useMemo(() => {
    return voices.length
      ? voices.map(v => ({ label: `${v.name} — ${v.lang}${v.default ? " (default)" : ""}`, value: v.voiceURI ?? v.name }))
      : [{ label: "No voices available", value: "" }];
  }, [voices]);

  return (
    <section className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2">Text to Voice (Browser TTS)</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full border rounded p-3 text-sm font-sans mb-3"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={speak} className="px-3 py-2 bg-emerald-600 text-white rounded text-sm" disabled={playing}>Play</button>
        <button onClick={pause} className="px-3 py-2 border rounded text-sm" disabled={!playing || paused}>Pause</button>
        <button onClick={resume} className="px-3 py-2 border rounded text-sm" disabled={!paused}>Resume</button>
        <button onClick={stop} className="px-3 py-2 border rounded text-sm" disabled={!playing && !paused}>Stop</button>
        <button onClick={copyText} className="ml-auto px-3 py-2 border rounded text-sm">Copy</button>
        <button onClick={() => exportText(format)} className="px-3 py-2 border rounded text-sm">Export</button>
        <button onClick={share} className="px-3 py-2 border rounded text-sm">Share</button>
      </div>

      <div className="mt-4 border rounded bg-slate-50 p-3 text-sm">
        <div className="font-semibold mb-1">Realtime Preview</div>
        <div className="bg-white rounded p-2 min-h-[80px]">{previewHighlighted}</div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="rounded border p-3 bg-white">
          <label className="block text-xs font-medium">Voice preset</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["female", "male", "child", "aged"].map((type) => (
              <button
                key={type}
                onClick={() => setVoiceType(type as VoiceType)}
                className={`px-2 py-1 text-sm rounded ${
                  voiceType === type ? "bg-blue-600 text-white" : "border"
                }`}
              >
                {type[0].toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <label className="block text-xs font-medium mt-3">Voice (manual)</label>
          <select
            value={selectedVoiceUri ?? ""}
            onChange={(e) => setSelectedVoiceUri(e.target.value)}
            className="w-full mt-1 border rounded px-2 py-1 text-sm"
          >
            {voiceOptions.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>

          <div className="mt-3 grid gap-2">
            <label className="text-xs">Rate ({rate.toFixed(2)})</label>
            <input type="range" min={0.4} max={2.0} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            <label className="text-xs">Pitch ({pitch.toFixed(2)})</label>
            <input type="range" min={0.5} max={2.0} step={0.05} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
            <label className="text-xs">Volume ({volume.toFixed(2)})</label>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </div>
        </div>

        <div className="rounded border p-3 bg-white text-sm">
          <div>Voices loaded: {voicesLoaded ? voices.length : "loading..."}</div>
          <div>Last action: {lastActionAt ?? "—"}</div>
          <div className="text-red-600 mt-1">{error}</div>
        </div>
      </div>
    </section>
  );
}
