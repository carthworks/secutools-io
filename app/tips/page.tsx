"use client";

import { useEffect, useState } from "react";
import Section from "@/components/Section";
import { RefreshCw, Copy, Share2 } from "lucide-react";

type Tip = {
  id: number;
  text: string;
  category: string;
};

const TIPS: Tip[] = [
  { id: 1, text: "Use a password manager to generate and store unique passwords.", category: "Passwords" },
  { id: 2, text: "Enable MFA (multi-factor authentication) on all critical accounts.", category: "Authentication" },
  { id: 3, text: "Keep your software and systems updated to patch vulnerabilities.", category: "Patching" },
  { id: 4, text: "Never click links from unknown emails — check the sender domain.", category: "Phishing" },
  { id: 5, text: "Lock your workstation (Win+L / Ctrl+Cmd+Q) when leaving desk.", category: "Workstation" },
  { id: 6, text: "Verify URLs before entering credentials — look for HTTPS + domain.", category: "Web Security" },
  { id: 7, text: "Backup critical data regularly and test your restores.", category: "Data Security" },
  { id: 8, text: "Segment your home/office network for IoT vs work devices.", category: "Networking" },
  { id: 9, text: "Never reuse corporate credentials on personal sites.", category: "Identity" },
  { id: 10, text: "Use least privilege: only the access needed, nothing more.", category: "Access Control" }
];

export default function DailyTipsPage() {
  const [tip, setTip] = useState<Tip | null>(null);

  // Load today's tip (rotate daily by date)
  useEffect(() => {
    const todayIndex = new Date().getDate() % TIPS.length;
    setTip(TIPS[todayIndex]);
  }, []);

  function randomTip() {
    const random = Math.floor(Math.random() * TIPS.length);
    setTip(TIPS[random]);
  }

  async function copyTip() {
    if (!tip) return;
    await navigator.clipboard.writeText(tip.text);
    alert("Tip copied to clipboard ✅");
  }

  async function shareTip() {
    if (!tip) return;
    if ((navigator as any).share) {
      await (navigator as any).share({
        title: "Daily Security Tip",
        text: tip.text,
      });
    } else {
      await copyTip();
      alert("Sharing not supported — tip copied instead.");
    }
  }

  return (
    <div className="space-y-8">
      <Section
        title="💡 Daily Security Tips"
        subtitle="Bite-sized advice for students, professionals, and SOC teams"
      >
        {tip ? (
          <div className="p-6 rounded-lg shadow-md bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-center">
            <h2 className="text-lg font-semibold text-indigo-700 mb-2">{tip.category}</h2>
            <p className="text-slate-800 text-base">{tip.text}</p>

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={randomTip}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded bg-white hover:bg-slate-50"
              >
                <RefreshCw size={16} /> Next Tip
              </button>
              <button
                onClick={copyTip}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded bg-white hover:bg-slate-50"
              >
                <Copy size={16} /> Copy
              </button>
              <button
                onClick={shareTip}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded bg-white hover:bg-slate-50"
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading tip…</p>
        )}

        <p className="mt-4 text-xs text-slate-400 text-center">
          Rotate tips daily or click "Next Tip" for more advice.
        </p>
      </Section>
    </div>
  );
}
