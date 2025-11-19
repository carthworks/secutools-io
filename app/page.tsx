// File: app/(public)/page.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Key,
  Network,
  Search,
  FileSearch,
  FlaskConical,
  Cloud,
  Star,
  StarOff,
  ExternalLink,
  Code,
  Info,
} from "lucide-react";
import dynamic from "next/dynamic";
import StableIcon from "@/components/StableIcon";
// import PasswordStrengthTicker from "@/components/PasswordStrengthTicker";

import PasswordStrengthTicker from "./password-strength/page";
type Tool = { slug: string; title: string; desc: string; isPublish: boolean };
type Category = { title: string; icon: any; color: string; tools: Tool[] };


import { Brain, Beaker, GraduationCap, Cpu, Bot, Database } from "lucide-react";



export const categories: Category[] = [
  {
    title: "Prompt Engineering",
    icon: Brain,
    color: "bg-indigo-200",
    tools: [
      { slug: "prompt-template", title: "Prompt Template Builder", desc: "Create reusable structured prompts (system + user + examples).", isPublish: true },
      { slug: "prompt-abtest", title: "Prompt A/B Tester", desc: "Compare model responses across prompt variations.", isPublish: true },
      { slug: "context-trimmer", title: "Context Trimmer", desc: "Automatically shorten context to stay under token limits.", isPublish: false },
      { slug: "prompt-leak", title: "Prompt Leakage Detector", desc: "Detect system prompt exposure or overfitting.", isPublish: false },
      { slug: "persona-lab", title: "Persona Simulator", desc: "Emulate model behavior under various personas.", isPublish: true },
      { slug: "hash", title: "Hash Tools", desc: "MD5, SHA1, SHA256, SHA512", isPublish: true },
      { slug: "jwt", title: "JWT Decoder", desc: "Decode and verify JWTs", isPublish: true },
      { slug: "jwt-cracker", title: "JWT Cracker", desc: "Test weak signing keys", isPublish: false },
      { slug: "password", title: "Password Utilities", desc: "Strength checker and generator", isPublish: true },
      { slug: "hash-id", title: "Hash Identifier", desc: "Detect type of hash string", isPublish: true },
      { slug: "obfuscator", title: "String Obfuscator", desc: "ROT13, Caesar, XOR, Base conversions", isPublish: true },
      { slug: "cert-parser", title: "Certificate Parser", desc: "PEM/DER certificate details", isPublish: true },
      { slug: "hash-collision", title: "Hash Collision Demo", desc: "Visualize MD5/SHA1 collisions", isPublish: false }
    ]
  },
  {
    title: "Model Training & Evaluation",
    icon: Beaker,
    color: "bg-blue-200",
    tools: [
      { slug: "dataset-cleaner", title: "Dataset Cleaner", desc: "Remove duplicates, bad tokens, or offensive samples.", isPublish: true },
      { slug: "finetune-config", title: "Fine-Tune Config Generator", desc: "Generate LoRA, PEFT, or RLHF JSON config templates.", isPublish: true },
      { slug: "training-estimator", title: "Training Cost Estimator", desc: "Estimate GPU hours and token cost for training.", isPublish: true },
      { slug: "model-compare", title: "Model Comparison Viewer", desc: "Compare outputs from multiple LLMs side-by-side.", isPublish: true },
      { slug: "benchmark-suite", title: "Evaluation Benchmark Suite", desc: "Evaluate accuracy, coherence, toxicity, and bias.", isPublish: false },
    ],
  },
  {
    title: "Dataset Tools",
    icon: Database,
    color: "bg-purple-200",
    tools: [
      { slug: "text-labeler", title: "Text Dataset Labeler", desc: "Manual or semi-auto text classification tool.", isPublish: true },
      { slug: "jsonl-converter", title: "Text → JSONL Converter", desc: "Prepare datasets for OpenAI / HuggingFace training.", isPublish: true },
      { slug: "embedding-visualizer", title: "Embedding Visualizer", desc: "Plot sentence embeddings in 2D/3D using PCA/UMAP.", isPublish: true },
      { slug: "bias-detector", title: "Bias Detector", desc: "Identify gender, racial, or cultural bias in text.", isPublish: true },
      { slug: "token-counter", title: "Token Counter", desc: "Estimate token usage and costs before training.", isPublish: true },
    ],
  },
  {
    title: "MLOps & Inference",
    icon: Cpu,
    color: "bg-teal-200",
    tools: [
      { slug: "api-tester", title: "API Tester", desc: "Send test prompts to OpenAI, Ollama, Anthropic, Mistral, etc.", isPublish: true },
      { slug: "latency-checker", title: "Latency Checker", desc: "Compare response times across models or regions.", isPublish: true },
      { slug: "stream-visualizer", title: "Streaming Output Visualizer", desc: "Watch token-by-token generation in real time.", isPublish: true },
      { slug: "inference-logger", title: "Inference Log Analyzer", desc: "Track drift, anomalies, and token usage metrics.", isPublish: false },
      { slug: "deployment-tracker", title: "Model Deployment Tracker", desc: "Monitor and version deployed models.", isPublish: false },
    ],
  },
  {
    title: "Safety & Alignment",
    icon: Network,
    color: "bg-pink-200",
    tools: [
      { slug: "jailbreak-tester", title: "Jailbreak Tester", desc: "Evaluate prompt-injection and system override attempts.", isPublish: true },
      { slug: "toxicity-checker", title: "Toxicity Classifier", desc: "Detect harmful or biased language in model outputs.", isPublish: true },
      { slug: "hallucination-checker", title: "Hallucination Checker", desc: "Compare generated output with factual references.", isPublish: false },
      { slug: "alignment-score", title: "Alignment Score Tracker", desc: "Rate model safety, honesty, and relevance.", isPublish: false },
    ],
  },
  {
    title: "AI Agents & Workflows",
    icon: Bot,
    color: "bg-yellow-200",
    tools: [
      { slug: "agent-flow", title: "Agent Flow Visualizer", desc: "Visualize task-chains and tool-use flows.", isPublish: true },
      { slug: "memory-tester", title: "Task Memory Tester", desc: "Evaluate how well an agent retains prior context.", isPublish: false },
      { slug: "rag-builder", title: "RAG Builder", desc: "Connect documents → embeddings → LLM for retrieval QA.", isPublish: true },
      { slug: "tool-use-sim", title: "Tool Use Simulator", desc: "Simulate agent reasoning and tool calls.", isPublish: false },
      { slug: "ioc", title: "IOC Extractor", desc: "Extract IPs, URLs, hashes, emails", isPublish: true },
      { slug: "cve", title: "CVE Lookup", desc: "Fetch details from CIRCL CVE", isPublish: true },
      { slug: "cve-feed", title: "CVE Feed Viewer", desc: "Browse latest CVEs from NVD", isPublish: true },
      { slug: "threat", title: "Threat Intel Check", desc: "VirusTotal/AbuseIPDB", isPublish: true },
      { slug: "whois", title: "WHOIS / RDAP", desc: "Ownership & registration", isPublish: true },
      { slug: "email-analyzer", title: "Email Header Analyzer", desc: "Trace spoofing & spam origins", isPublish: true },
      { slug: "qr-code-check", title: "QR Code Security Analyzer", desc: "Scan with your camera or upload a QR code image. The tool decodes and flags risky URLs", isPublish: true },

    ],
  },
  {
    title: "Learning & Training",
    icon: GraduationCap,
    color: "bg-green-200",
    tools: [
      { slug: "ai-tips", title: "Daily AI Concepts", desc: "Flashcards with short explanations of key AI terms.", isPublish: true },
      { slug: "prompt-labs", title: "Prompt Engineering Playground", desc: "Interactive tutorials for writing better prompts.", isPublish: true },
      { slug: "ai-papers", title: "AI Paper Digest", desc: "Summaries of top LLM research papers weekly.", isPublish: false },
      { slug: "model-explorer", title: "Model Explorer", desc: "Discover and compare open models from HF/Ollama.", isPublish: true },
      { slug: "shortcut-prompt", title: "PromptShortcuts", desc: "shortcut prompt.", isPublish: true },
      { slug: "wordlist", title: "Wordlist Generator", desc: "Custom password/wordlists", isPublish: true },
      { slug: "xxe", title: "XXE Payload Generator", desc: "XML external entity injection payloads", isPublish: false },
      { slug: "jwt-fuzzer", title: "JWT Fuzzer", desc: "Tweak claims and signatures", isPublish: false },
      { slug: "command-injection", title: "Command Injection Tester", desc: "Common OS injection payloads", isPublish: false },
    ],
  },
  {
    title: "Web & Cloud Security",
    icon: Cloud,
    color: "bg-pink-50",
    tools: [
      { slug: "headers-check", title: "Security Headers Checker", desc: "Inspect CSP, HSTS, X-Frame-Options", isPublish: true },
      { slug: "url-trace", title: "URL Unshortener & Redirect Tracer", desc: "Expand and trace redirects", isPublish: false },
      { slug: "cvss", title: "CVE Severity Calculator", desc: "Compute CVSS scores", isPublish: true },
      { slug: "aws-s3", title: "AWS S3 Checker", desc: "Test for public/misconfigured buckets", isPublish: false },
      { slug: "cors-check", title: "CORS Tester", desc: "Detect misconfigured Access-Control headers", isPublish: false },
      { slug: "clickjack", title: "Clickjacking Tester", desc: "Frame-busting & X-Frame-Options check", isPublish: false },
      { slug: "csrf", title: "CSRF Token Inspector", desc: "Check CSRF token presence & randomness", isPublish: false },
    ],
  },
  {
    title: "Learning",
    icon: Code,
    color: "bg-green-50",
    tools: [
      { slug: "tips", title: "Daily Security Tips", desc: "Flashcards & rotating advice", isPublish: true },
      { slug: "prompt-shortcut", title: "Prompt Shortcuts", desc: "prompt-shortcut", isPublish: true },
      // { slug: "ctf-mini", title: "CTF Mini Challenges", desc: "Small interactive labs & puzzles", isPublish: false },
      // { slug: "vuln-demos", title: "Vulnerability Demos", desc: "Learn XSS, SQLi, SSRF interactively", isPublish: false },
      { slug: "tts", title: "Text → Voice (TTS)", desc: "Convert text into spoken audio in the browser. Play, pause, tweak voice/pitch/rate, and export text (audio export requires server-side TTS).", isPublish: true },
    ],
  },
];



/* ---------- helpers ---------- */
const FAVORITES_KEY = "secu_favs_v1";
const RECENT_KEY = "secu_recent_v1";

function loadJSON<T>(key: string): T | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function saveJSON(key: string, value: any) {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
  } catch { }
}

function toolTags(slug: string) {
  const clientOnly = new Set([
    "hash",
    "jwt",
    "password",
    "logs",
    "timestamp",
    "pcap",
    "subdomain",
    "payloads",
    "cheatsheets",
  ]);
  const apiNeeded = new Set(["ip-dns", "cve", "threat", "whois", "headers-check", "aws-s3"]);
  const tags: string[] = [];
  if (clientOnly.has(slug)) tags.push("client-only");
  if (apiNeeded.has(slug)) tags.push("api");
  if (slug === "pcap") tags.push("upload");
  if (slug === "payloads") tags.push("payloads");
  if (slug === "cve" || slug === "cve-feed") tags.push("vuln");
  if (slug === "subdomain") tags.push("discovery");
  if (slug === "logs" || slug === "json-xml") tags.push("analysis");
  return tags;
}

/* ---------- component ---------- */
export default function HomePage() {
  // search + UI state
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]); // load on mount
  const [recent, setRecent] = useState<string[]>([]); // load on mount

  // UI state
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    categories.reduce<Record<string, boolean>>((acc, c, idx) => {
      acc[c.title] = idx < 2;
      return acc;
    }, {})
  );
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false); // hydrate on mount

  const searchRef = useRef<HTMLInputElement | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // run on mount: load localStorage and set mounted
  useEffect(() => {
    setMounted(true);

    try {
      const favs = loadJSON<string[]>(FAVORITES_KEY) ?? [];
      const rec = loadJSON<string[]>(RECENT_KEY) ?? [];
      setFavorites(Array.isArray(favs) ? favs : []);
      setRecent(Array.isArray(rec) ? rec : []);
    } catch {
      setFavorites([]);
      setRecent([]);
    }

    try {
      const dm = typeof window !== "undefined" && localStorage.getItem("secu_dark") === "1";
      setDarkMode(Boolean(dm));
      if (dm) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist favorites/recent to localStorage when they change (safe: only runs client-side)
  useEffect(() => {
    if (!mounted) return;
    saveJSON(FAVORITES_KEY, favorites);
  }, [favorites, mounted]);

  useEffect(() => {
    if (!mounted) return;
    saveJSON(RECENT_KEY, recent);
  }, [recent, mounted]);

  // update dark mode class & persist
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("secu_dark", darkMode ? "1" : "0");
      if (darkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch { }
  }, [darkMode, mounted]);

  // keyboard shortcut to focus search (Cmd/Ctrl+K)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // derive flat tools and tags
  const allToolsFlat: Tool[] = useMemo(() => categories.flatMap((c) => c.tools), []);
  const allTags = useMemo(() => {
    const s = new Set<string>();
    allToolsFlat.forEach((t) => toolTags(t.slug).forEach((tg) => s.add(tg)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [allToolsFlat]);

  function toggleFavorite(slug: string) {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev];
      return next.slice(0, 20);
    });
  }

  function recordRecent(slug: string) {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)];
      return next.slice(0, 12);
    });
  }

  // RenderIcon: show a stable placeholder until mounted to avoid SVG markup mismatches
  function RenderIcon({ icon: IconComp, className = "w-5 h-5" }: { icon: any; className?: string }) {
    const Comp = IconComp as any;
    if (!mounted) {
      // placeholder preserves layout and size — avoids SSR/client mismatch
      return <span className={`${className} inline-block`} aria-hidden />;
    }
    return <Comp className={className} aria-hidden />;
  }

  // filtering logic
  const filteredCategories = useMemo(
    () =>
      categories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter((t) => {
            const q = (query || "").trim().toLowerCase();
            const matchesQuery =
              q.length === 0 ||
              [t.title, t.desc, cat.title].some((field) => String(field || "").toLowerCase().includes(q));
            const tTags = toolTags(t.slug);
            const matchesTags = (activeTagFilters || []).length === 0 || activeTagFilters.every((f) => tTags.includes(f));
            return matchesQuery && matchesTags;
          }),
        }))
        .filter((cat) => (cat.tools || []).length > 0),
    [query, activeTagFilters]
  );

  const favoritesResolved = (favorites || [])
    .map((s) => allToolsFlat.find((t) => t.slug === s))
    .filter(Boolean) as Tool[];
  const recentResolved = (recent || [])
    .map((s) => allToolsFlat.find((t) => t.slug === s))
    .filter(Boolean) as Tool[];

  function scrollToCategory(title: string) {
    const el = categoryRefs.current ? categoryRefs.current[title] : null;
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleCategory(title: string) {
    setOpenCategories((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  function toggleTagFilter(tag: string) {
    setActiveTagFilters((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag, ...prev]));
  }

  return (
    <div className="min-h-screen px-4 sm:px-2 lg:px-2 py-8 space-y-8">
      {/* Top bar: title + controls */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold">AI & LLM Handy Tools</h1>
        <div className="text-slate-500 hidden sm:block">Practical utilities for AI engineers, researchers and prompt engineers.</div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="px-3 py-1 rounded border text-sm"
            aria-pressed={darkMode}
            title="Toggle dark mode"
          >
            {darkMode ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar (md+) */}
        <aside className="hidden md:block col-span-1 sticky top-24 h-fit">

          <div className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">Categories</div>
              <div className="text-xs text-slate-500">Jump</div>
            </div>
            <div className="mt-3 space-y-2">
              {categories.map((c) => (
                <button
                  key={c.title}
                  onClick={() => scrollToCategory(c.title)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 text-sm flex items-center gap-2"
                >
                  <RenderIcon icon={c.icon} className="w-4 h-4" />
                  <span className="flex-1">{c.title}</span>
                  <span className="text-xs text-slate-400">{c.tools.length}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="text-sm font-medium">Filter tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {allTags.map((tg) => {
                  const active = activeTagFilters.includes(tg);
                  return (
                    <button
                      key={tg}
                      onClick={() => toggleTagFilter(tg)}
                      className={`text-xs px-2 py-1 rounded-full border ${active ? "bg-slate-800 text-white" : "bg-white text-slate-700"}`}
                    >
                      {tg}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-6"> */}

            {/* </main> */}

            <div className="mt-4 border-t pt-3">
              <div className="text-sm font-medium">Favorites</div>
              <div className="mt-2">
                {favoritesResolved.length === 0 ? (
                  <div className="text-xs text-slate-400">No favorites yet</div>
                ) : (
                  favoritesResolved.slice(0, 6).map((t) => (
                    <div key={t.slug} className="flex items-center justify-between text-sm py-1">
                      <Link href={`/${t.slug}`} onClick={() => recordRecent(t.slug)} className="hover:underline">
                        {t.title}
                      </Link>
                      <button onClick={() => toggleFavorite(t.slug)} title="Unfavorite">
                        <Star className="w-4 h-4 text-amber-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="md:col-span-3 space-y-6">
          {/* Search + top controls */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex gap-3
             items-center">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools, descriptions, or categories..."
                  aria-label="Search tools"
                  className="w-full border rounded-lg p-3 shadow-sm pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-2">
                  <span className="hidden sm:inline">Press</span>
                  <kbd className="bg-slate-100 border rounded px-2 py-0.5 text-xs">⌘K</kbd>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <div className="text-sm text-slate-600 hidden sm:block">Favorites</div>
                <div className="flex gap-2">
                  {favoritesResolved.length === 0 ? (
                    <div className="text-sm text-slate-400 px-3 py-2 rounded border">No favorites</div>
                  ) : (
                    favoritesResolved.slice(0, 6).map((t) => (
                      <Link
                        key={t.slug}
                        href={`/${t.slug}`}
                        onClick={() => recordRecent(t.slug)}
                        className="px-3 py-2 rounded border bg-white text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2"
                        title={t.title}
                      >
                        <span className="font-medium">{t.title}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recently used (top) */}
            {recentResolved.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-2">Recently Used</div>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {recentResolved.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/${t.slug}`}
                      onClick={() => recordRecent(t.slug)}
                      className="text-xs whitespace-nowrap px-3 py-1 border rounded bg-white flex items-center gap-2"
                    >
                      <span>{t.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Categories grid: two columns on md */}
          <section className="grid md:grid-cols-2 gap-6">
            {filteredCategories.map((cat) => (
              <div
                key={cat.title}
                ref={(el) => { categoryRefs.current[cat.title] = el; }}
                className={`rounded-lg p-4 shadow-sm ${cat.color} border bg-opacity-60`}
              >
                <div className="flex items-center gap-3">
                  <RenderIcon icon={cat.icon} />
                  <h2 className="text-lg font-semibold uppercase tracking-wide">{cat.title}</h2>
                  <div className="ml-auto text-sm text-slate-500">{(cat.tools || []).length} tools</div>
                  <div className="ml-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleCategory(cat.title)}
                      className="text-xs px-2 py-1 rounded border bg-white"
                      aria-expanded={!!openCategories[cat.title]}
                    >
                      {openCategories[cat.title] ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>

                {/* tools area (accordion-aware) */}
                <div className={`mt-4 grid gap-3 ${openCategories[cat.title] ? "" : "hidden md:block"}`}>
                  {(cat.tools || []).map((t) => {
                    const tags = toolTags(t.slug);
                    const isFav = (favorites || []).includes(t.slug);
                    return (
                      <div
                        key={t.slug}
                        className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-3 shadow-sm flex items-start gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-base">{t.title}</div>
                            <div className="flex gap-1 ml-1">
                              {tags.map((tg) => (
                                <span key={tg} className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                                  {tg}
                                </span>
                              ))}
                            </div>
                            <span className="ml-2 text-xs text-slate-400" title={t.desc}>
                              <Info className="inline w-3 h-3" />
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">{t.desc}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {t.isPublish === false ? (
                            <div className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">🚧 In Development</div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleFavorite(t.slug)}
                                  aria-pressed={isFav}
                                  aria-label={isFav ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`}
                                  className="p-1 rounded hover:bg-slate-100"
                                  title={isFav ? "Unfavorite" : "Add to favorites"}
                                >
                                  {isFav ? <Star className="w-4 h-4 text-amber-500" /> : <StarOff className="w-4 h-4 text-slate-400" />}
                                </button>
                                <Link
                                  href={`/${t.slug}`}
                                  onClick={() => recordRecent(t.slug)}
                                  className="px-2 py-1 rounded border text-xs bg-white hover:bg-slate-50"
                                  title={`Open ${t.title}`}
                                >
                                  Open
                                </Link>
                              </div>
                              <a href={`/${t.slug}`} onClick={() => recordRecent(t.slug)} className="text-xs text-slate-400 hover:text-slate-600">
                                Learn <ExternalLink className="inline w-3 h-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile: show collapsed if closed */}
                {!openCategories[cat.title] && (
                  <div className="mt-2 md:hidden">
                    <div className="text-xs text-slate-500">Tap "Expand" to view tools</div>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Learning resources */}
          <section className="hidden">
            <div className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Learning Resources</h3>
                  <p className="text-sm text-slate-600">Hand-picked tutorials and labs for hands-on cybersecurity practice.</p>
                </div>
                <div className="text-sm text-slate-500">Updated weekly</div>
              </div>

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <a href="https://owasp.org/Top10/" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
                  OWASP Top 10 <div className="text-xs text-slate-500">Web app risks</div>
                </a>
                <a href="https://portswigger.net/web-security" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
                  PortSwigger Web Security Academy <div className="text-xs text-slate-500">Free labs & tutorials</div>
                </a>
                <a href="https://tryhackme.com/" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
                  TryHackMe <div className="text-xs text-slate-500">Guided hands-on rooms</div>
                </a>
                <a href="https://attack.mitre.org/" target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-slate-50">
                  MITRE ATT&CK <div className="text-xs text-slate-500">Tactics & techniques</div>
                </a>
              </div>
            </div>
          </section>

          {/* News section revamp */}
          <section>
            <div className="rounded-lg border p-4 bg-white shadow-sm hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Latest Security News</h3>
                <div className="text-sm text-slate-500">Source & date highlighted</div>
              </div>


            </div>
          </section>

          {/* Optional network tools preview */}
        </main>
      </div>
    </div>
  );
}
