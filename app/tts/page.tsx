// app/tts/page.tsx
import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the client-only component
const TextToVoiceClient = dynamic(() => import("../../components/TextToVoice"), {
  ssr: false, // Prevent server-side rendering (avoids `window` issues)
});

export default function TtsPage() {
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Text → Voice (TTS)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Convert text to speech directly in your browser using the Web Speech API.  
          All processing happens client-side — no data leaves your device.
        </p>
      </header>

      <section>
        <TextToVoiceClient />
      </section>
    </main>
  );
}
