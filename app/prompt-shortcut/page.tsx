// app/prompt-shortcut/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Copy, Star, Filter, Send, Share, Plus, Trash2 } from 'lucide-react';

interface Shortcut {
  id: number;
  command: string;
  description: string;
  category: string;
}

type MessageType = 'success' | 'error' | 'info';
interface Message {
  type: MessageType;
  text: string;
}

const PROMPT_SHORTCUTS = [
  { id: 1, command: '/ELI5', description: 'Explain like I’m 5 years old.', category: 'Explanation' },
  { id: 2, command: '/FIRST PRINCIPLES', description: 'Rebuild the concept from the ground up.', category: 'Reasoning' },
  { id: 3, command: '/STEP-BY-STEP', description: 'Lay out the reasoning step-by-step.', category: 'Reasoning' },
  { id: 4, command: '/CHAIN OF THOUGHT', description: 'Show the intermediate reasoning process.', category: 'Reasoning' },
  { id: 5, command: '/NO AUTOPILOT', description: 'Avoid generic responses; think deeply.', category: 'Quality' },
  { id: 6, command: '/DELIBERATE THINKING', description: 'Slow down and reason logically.', category: 'Reasoning' },
  { id: 7, command: '/REFLECTIVE MODE', description: 'Reflect on the answer just given.', category: 'Quality' },
  { id: 8, command: '/EVAL-SELF', description: 'Critically evaluate your own response.', category: 'Quality' },
  { id: 9, command: '/SYSTEMATIC BIAS CHECK', description: 'Identify potential biases in reasoning.', category: 'Quality' },
  { id: 10, command: '/PITFALLS', description: 'Highlight possible mistakes or traps to avoid.', category: 'Quality' },
  { id: 11, command: '/TLDL', description: 'Too Long, Didn’t Listen(summarize briefly).', category: 'Summarization' },
  { id: 12, command: '/EXEC SUMMARY', description: 'Give an executive-style summary.', category: 'Summarization' },
  { id: 13, command: '/BRIEFLY', description: 'Reply in 3 lines or less.', category: 'Summarization' },
  { id: 14, command: '/HIGHLIGHTS', description: 'Extract key points or insights.', category: 'Summarization' },
  { id: 15, command: '/TLDR+ACTION', description: 'Summarize+ provide next steps.', category: 'Summarization' },
  { id: 16, command: '/CHECKLIST', description: 'Turn into a step-by-step checklist.', category: 'Formatting' },
  { id: 17, command: '/FORMAT AS[TABLE|JSON|BULLETS]', description: 'Force specific output format.', category: 'Formatting' },
  { id: 18, command: '/SCHEMA', description: 'Produce a schema, ERD outline, or data model.', category: 'Development' },
  { id: 19, command: '/COMPARE', description: 'Compare two or more things side by side.', category: 'Analysis' },
  { id: 20, command: '/SWOT', description: 'Create a strengths/weaknesses/opportunities/threats table.', category: 'Analysis' },
  { id: 21, command: '/ROADMAP', description: 'Output as a roadmap with phases/timelines.', category: 'Planning' },
  { id: 22, command: '/CHEATSHEET', description: 'Produce a one-page condensed reference.', category: 'Formatting' },
  { id: 23, command: '/BLUEPRINT', description: 'Generate a high-level plan or architecture diagram.', category: 'Planning' },
  { id: 24, command: '/FRAMEWORK', description: 'Present the answer as a reusable framework.', category: 'Planning' },
  { id: 25, command: '/TABLEVIEW', description: 'Summarize results as a comparison table.', category: 'Formatting' },
  { id: 26, command: '/TONE[formal|funny|dramatic|motivational]', description: 'Adjust tone.', category: 'Style' },
  { id: 27, command: '/AUDIENCE[students|execs|freshers|engineers]', description: 'Adapt language level.', category: 'Style' },
  { id: 28, command: '/ACT AS[role]', description: 'Speak as a specific persona(e.g., CTO, teacher).', category: 'Style' },
  { id: 29, command: '/ROLE: TASK: FORMAT:', description: 'Define exactly what you want.', category: 'Structure' },
  { id: 30, command: '/REWRITE AS[style]', description: 'Rephrase in a given writing style.', category: 'Style' },
  { id: 31, command: '/PITCH MODE', description: 'Turn the answer into a short persuasive pitch.', category: 'Style' },
  { id: 32, command: '/TEACH MODE', description: 'Explain as if mentoring or teaching.', category: 'Explanation' },
  { id: 33, command: '/DEV MODE', description: 'Respond like a raw developer(code-focused).', category: 'Development' },
  { id: 34, command: '/PM MODE', description: 'Answer like a project manager(scope, risk, timeline).', category: 'Planning' },
  { id: 35, command: '/STORY MODE', description: 'Explain using a story or analogy.', category: 'Style' },
  { id: 36, command: '/METRICS MODE', description: 'Express using measurable indicators.', category: 'Analysis' },
  { id: 37, command: '/PARALLEL LENSES', description: 'Show multiple perspectives in parallel.', category: 'Analysis' },
  { id: 38, command: '/MULTI-PERSPECTIVE', description: 'Present views from different roles/stakeholders.', category: 'Analysis' },
  { id: 39, command: '/CONTEXT STACK', description: 'Keep multiple layers of context.', category: 'Quality' },
  { id: 40, command: '/CAUSE-EFFECT', description: 'Break down causal relationships.', category: 'Analysis' },
  { id: 41, command: '/WHAT-IF', description: 'Explore alternative scenarios.', category: 'Analysis' },
  { id: 42, command: '/TREND ANALYSIS', description: 'Highlight how it evolved over time.', category: 'Analysis' },
  { id: 43, command: '/BENCHMARK', description: 'Compare against best practices or standards.', category: 'Analysis' },
  { id: 44, command: '/VALIDATION', description: 'Cross-check logic for consistency.', category: 'Quality' },
  { id: 45, command: '/HEURISTICS', description: 'Derive practical rules of thumb.', category: 'Quality' },
  { id: 46, command: '/IDEATE', description: 'Brainstorm creative ideas rapidly.', category: 'Creativity' },
  { id: 47, command: '/STRATEGIZE', description: 'Turn the topic into an actionable plan.', category: 'Planning' },
  { id: 48, command: '/REVERSE ENGINEER', description: 'Deconstruct how something works.', category: 'Analysis' },
  { id: 49, command: '/OPPORTUNITY MAP', description: 'Identify new opportunities or niches.', category: 'Analysis' },
  { id: 50, command: '/PLAYBOOK', description: 'Summarize best practices into a ready-to-use guide.', category: 'Formatting' },
  { id: 51, command: '/SOCRATIC', description: 'Question and refine the idea through back-and-forth reasoning.', category: 'Reasoning' },
  { id: 52, command: '/HYPOTHESIS', description: 'Generate testable hypotheses for a problem.', category: 'Analysis' },
  { id: 53, command: '/ROOT CAUSE', description: 'Identify the underlying cause, not just symptoms.', category: 'Analysis' },
  { id: 54, command: '/5WHYS', description: 'Apply the “Five Whys” method to trace cause and effect.', category: 'Analysis' },
  { id: 55, command: '/EVIDENCE CHECK', description: 'Verify if each claim is backed by data or assumption.', category: 'Quality' },
  { id: 56, command: '/COUNTERPOINT', description: 'Present the strongest opposing argument.', category: 'Analysis' },
  { id: 57, command: '/RISK-REWARD', description: 'Balance benefits vs. potential risks.', category: 'Analysis' },
  { id: 58, command: '/FAILURE MODE', description: 'Describe how something could go wrong.', category: 'Analysis' },
  { id: 59, command: '/PRE-MORTEM', description: 'Imagine failure in advance and trace what caused it.', category: 'Analysis' },
  { id: 60, command: '/DECISION TREE', description: 'Outline logical decision paths or outcomes.', category: 'Analysis' },
  { id: 61, command: '/CODE REVIEW', description: 'Evaluate and explain code quality and structure.', category: 'Development' },
  { id: 62, command: '/BUG FINDER', description: 'Locate logical or syntactic issues in code.', category: 'Development' },
  { id: 63, command: '/OPTIMIZE CODE', description: 'Rewrite for efficiency or readability.', category: 'Development' },
  { id: 64, command: '/WRITE TESTS', description: 'Generate unit tests or integration test cases.', category: 'Development' },
  { id: 65, command: '/DOCSTRING', description: 'Add docstrings and inline explanations for functions.', category: 'Development' },
  { id: 66, command: '/CODE EXPLAINER', description: 'Explain complex code line by line.', category: 'Development' },
  { id: 67, command: '/CODE DIFF', description: 'Show what changed between two code versions.', category: 'Development' },
  { id: 68, command: '/DEBUG MODE', description: 'Simulate debugging process and possible fixes.', category: 'Development' },
  { id: 69, command: '/REFACTOR', description: 'Improve structure without changing functionality.', category: 'Development' },
  { id: 70, command: '/DESIGN PATTERN', description: 'Suggest relevant software design patterns.', category: 'Development' },
  { id: 71, command: '/DATA STORY', description: 'Convert raw numbers into narrative insights.', category: 'Analysis' },
  { id: 72, command: '/KPI MAP', description: 'Define key metrics aligned with goals.', category: 'Analysis' },
  { id: 73, command: '/DATA PIPELINE MAP', description: 'Draw a logical data flow or pipeline structure.', category: 'Development' },
  { id: 74, command: '/SQL QUERY GEN', description: 'Generate SQL for a given data problem.', category: 'Development' },
  { id: 75, command: '/MODEL EXPLAIN', description: 'Explain an ML model’s logic in plain English.', category: 'Analysis' },
  { id: 76, command: '/AI VS HUMAN', description: 'Contrast how an AI and a human would solve it.', category: 'Analysis' },
  { id: 77, command: '/AGENT BLUEPRINT', description: 'Design an AI agent’s architecture and flow.', category: 'Development' },
  { id: 78, command: '/RAG DESIGN', description: 'Create Retrieval-Augmented Generation setup outline.', category: 'Development' },
  { id: 79, command: '/MODEL CRITIQUE', description: 'Evaluate limitations or biases in a model.', category: 'Analysis' },
  { id: 80, command: '/DATA VALIDATION', description: 'Outline checks for data consistency and quality.', category: 'Development' },
  { id: 81, command: '/MARKET MAP', description: 'Summarize the competitive landscape.', category: 'Analysis' },
  { id: 82, command: '/BUSINESS MODEL', description: 'Create or evaluate a business model.', category: 'Analysis' },
  { id: 83, command: '/VALUE PROPOSITION', description: 'Define what makes a product unique.', category: 'Analysis' },
  { id: 84, command: '/PRICING STRATEGY', description: 'Suggest suitable pricing models.', category: 'Analysis' },
  { id: 85, command: '/COMPETITOR ANALYSIS', description: 'Benchmark against key players.', category: 'Analysis' },
  { id: 86, command: '/CUSTOMER JOURNEY', description: 'Visualize how users move through a funnel.', category: 'Analysis' },
  { id: 87, command: '/GO-TO-MARKET', description: 'Outline a launch or sales strategy.', category: 'Analysis' },
  { id: 88, command: '/KILLER FEATURE', description: 'Identify standout features that drive adoption.', category: 'Analysis' },
  { id: 89, command: '/RETENTION PLAN', description: 'Suggest ways to retain existing users.', category: 'Analysis' },
  { id: 90, command: '/METRICS DASHBOARD', description: 'Propose KPIs and visualization ideas.', category: 'Analysis' },
  { id: 91, command: '/HOOK BUILDER', description: 'Craft an attention-grabbing hook or intro.', category: 'Style' },
  { id: 92, command: '/STORY ARC', description: 'Turn information into a storytelling sequence.', category: 'Style' },
  { id: 93, command: '/EMOTION MAP', description: 'Control emotional tone across paragraphs.', category: 'Style' },
  { id: 94, command: '/QUOTE MODE', description: 'Generate a punchy one-line quote.', category: 'Style' },
  { id: 95, command: '/REPHRASE STRONGER', description: 'Make the tone more confident and powerful.', category: 'Style' },
  { id: 96, command: '/PARAPHRASE SMART', description: 'Rewrite keeping meaning but changing structure.', category: 'Style' },
  { id: 97, command: '/HASHTAG GENERATOR', description: 'Suggest optimized hashtags for reach.', category: 'Style' },
  { id: 98, command: '/CTA BUILDER', description: 'Write persuasive calls-to-action.', category: 'Style' },
  { id: 99, command: '/THREAD MODE', description: 'Turn a long post into a Twitter/LinkedIn thread.', category: 'Style' },
  { id: 100, command: '/REEL SCRIPT', description: 'Generate short-form video script(30–60 sec).', category: 'Style' },
];

const CATEGORIES = [
  'All', 'Explanation', 'Reasoning', 'Quality', 'Summarization',
  'Formatting', 'Development', 'Analysis', 'Planning', 'Style',
  'Structure', 'Creativity'
];

export default function PromptShortcutsApp(): JSX.Element {
  // UI state (all typed)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // store favorites as array of ids (serializable)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = window.localStorage.getItem('prompt_shortcuts_favorites');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // ensure the array contains numbers
        return parsed.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [userPrompt, setUserPrompt] = useState<string>('');
  const [activeShortcuts, setActiveShortcuts] = useState<Shortcut[]>([]);
  const [showPromptArea, setShowPromptArea] = useState<boolean>(false);

  const [message, setMessage] = useState<Message | null>(null);

  // persisted favorites
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('prompt_shortcuts_favorites', JSON.stringify(favorites));
      }
    } catch {
      // ignore localStorage errors (private mode, etc)
    }
  }, [favorites]);

  // memoized filtered list
  const filteredShortcuts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return PROMPT_SHORTCUTS.filter((shortcut) => {
      const matchesSearch =
        !q ||
        shortcut.command.toLowerCase().includes(q) ||
        shortcut.description.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || shortcut.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // safe clipboard implementation as an async function (declared) + wrapper
  const safeWriteClipboardImpl = async (text: string): Promise<boolean> => {
    if (!text) {
      setMessage({ type: 'error', text: 'Nothing to copy' });
      return false;
    }

    // If navigator.clipboard available and window exists, prefer it
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setMessage({ type: 'success', text: 'Copied to clipboard' });
        return true;
      } catch {
        // fall through to textarea fallback
      }
    }

    // Fallback using textarea + execCommand (works in many browsers)
    if (typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        setMessage({ type: ok ? 'success' : 'error', text: ok ? 'Copied to clipboard' : 'Copy failed' });
        return ok;
      } catch {
        setMessage({ type: 'error', text: 'Clipboard not available' });
        return false;
      }
    }

    setMessage({ type: 'error', text: 'Clipboard not available' });
    return false;
  };

  // non-async wrapper used in JSX handlers to avoid the "async useCallback" build quirk
  const safeWriteClipboard = useCallback((text: string) => {
    return safeWriteClipboardImpl(text);
  }, []);

  // add / remove favorites (ids)
  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  const addShortcut = useCallback((shortcut: Shortcut) => {
    setActiveShortcuts((prev) => [...prev, shortcut]);
  }, []);

  const removeShortcut = useCallback((index: number) => {
    setActiveShortcuts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const generateFullPrompt = useCallback((): string => {
    const shortcutsText = activeShortcuts.map((s) => s.command).join(' ');
    return `${shortcutsText} ${userPrompt}`.trim();
  }, [activeShortcuts, userPrompt]);

  const handleSendToLLM = useCallback((): void => {
    const fullPrompt = generateFullPrompt();
    if (!fullPrompt) {
      setMessage({ type: 'error', text: 'Please enter a prompt' });
      return;
    }
    // TODO: replace with real API call (server-side)
    setMessage({ type: 'success', text: 'Prompt queued to send (demo only)' });
    // Example:
    // fetch('/api/llm', { method: 'POST', body: JSON.stringify({ prompt: fullPrompt }) })
  }, [generateFullPrompt]);

  const handleShare = useCallback(async (): Promise<void> => {
    const fullPrompt = generateFullPrompt();
    if (!fullPrompt) {
      setMessage({ type: 'error', text: 'Please enter a prompt and add shortcuts' });
      return;
    }

    // prefer Web Share API if available
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'LLM Prompt', text: fullPrompt });
        setMessage({ type: 'success', text: 'Shared via native share' });
        return;
      } catch {
        // fallthrough to clipboard fallback
      }
    }

    safeWriteClipboard(fullPrompt);
  }, [generateFullPrompt, safeWriteClipboard]);

  const copyCommand = useCallback((cmd: string) => {
    safeWriteClipboard(cmd);
  }, [safeWriteClipboard]);

  // clear transient message after a timeout
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            LLM Prompt Shortcuts
          </h1>
          <p className="text-gray-600 mt-2">Prompt shortcuts to enhance your AI interactions</p>
        </header>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-4 rounded-md p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-100'
                : 'bg-red-50 text-red-800 border border-red-100'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Prompt Builder */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Prompt Builder</h2>
            <button
              onClick={() => setShowPromptArea((s) => !s)}
              className="text-sm text-indigo-600 hover:underline"
              aria-expanded={showPromptArea}
            >
              {showPromptArea ? 'Hide' : 'Show'} Prompt Area
            </button>
          </div>

          {showPromptArea && (
            <>
              <div className="mb-4">
                <label htmlFor="selected-shortcuts" className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Shortcuts
                </label>
                <div id="selected-shortcuts" className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-300 rounded-lg bg-gray-50">
                  {activeShortcuts.length === 0 ? (
                    <span className="text-gray-400 text-sm">No shortcuts added yet</span>
                  ) : (
                    activeShortcuts.map((shortcut, index) => (
                      <div key={`${shortcut.id}-${index}`} className="flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm">
                        <span>{shortcut.command}</span>
                        <button
                          onClick={() => removeShortcut(index)}
                          aria-label={`Remove ${shortcut.command}`}
                          className="ml-2 text-indigo-600 hover:text-indigo-900"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="user-query" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Query
                </label>
                <textarea
                  id="user-query"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter your query here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition min-h-[100px]"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendToLLM}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  aria-label="Send prompt to LLM"
                >
                  <Send className="h-4 w-4" />
                  Send to LLM
                </button>
                <button
                  onClick={() => void handleShare()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  aria-label="Share prompt"
                >
                  <Share className="h-4 w-4" />
                  Share Prompt
                </button>
                <button
                  onClick={() => void safeWriteClipboard(generateFullPrompt())}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  aria-label="Copy full prompt"
                >
                  <Copy className="h-4 w-4" />
                  Copy Full Prompt
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200" aria-live="polite">
                <p className="text-sm font-medium text-blue-800">Preview:</p>
                <p className="text-sm text-gray-700 mt-1">{generateFullPrompt() || 'Your combined prompt will appear here...'}</p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6" aria-label="Sidebar">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" aria-hidden />
                <input
                  aria-label="Search shortcuts"
                  placeholder="Search shortcuts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-500" aria-hidden />
                <span className="text-sm font-medium">Categories</span>
              </div>
              <div className="flex flex-wrap gap-2" role="list">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    aria-pressed={selectedCategory === category}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                      selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">How to Use</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span><span>Use commands like /ELI5 to modify your prompts</span></li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span><span>Combine multiple commands for complex requests</span></li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span><span>Click the star to save favorites</span></li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span><span>Click the copy icon to copy to clipboard</span></li>
                <li className="flex items-start"><span className="text-indigo-600 mr-2">•</span><span>Click the + button to add shortcuts to your prompt</span></li>
              </ul>
            </div>
          </aside>

          <main className="lg:col-span-3" aria-live="polite">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedCategory === 'All' ? 'All Shortcuts' : selectedCategory}
                <span className="text-gray-500 text-sm font-normal ml-2">({filteredShortcuts.length} shortcuts)</span>
              </h2>
              <div className="text-sm text-gray-500">{favorites.length} favorites</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShortcuts.map((shortcut) => (
                <article key={shortcut.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow" aria-labelledby={`sc-${shortcut.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <code id={`sc-${shortcut.id}`} className="bg-indigo-100 text-indigo-800 text-sm font-mono px-2 py-1 rounded">{shortcut.command}</code>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{shortcut.category}</span>
                      </div>
                      <p className="mt-2 text-gray-700">{shortcut.description}</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => addShortcut(shortcut)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                        title={`Add ${shortcut.command} to prompt`}
                        aria-label={`Add ${shortcut.command}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => copyCommand(shortcut.command)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title={`Copy ${shortcut.command}`}
                        aria-label={`Copy ${shortcut.command}`}
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => toggleFavorite(shortcut.id)}
                        className={`p-1.5 rounded-md transition-colors ${favorites.includes(shortcut.id) ? 'text-yellow-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                        title={favorites.includes(shortcut.id) ? 'Unfavorite' : 'Favorite'}
                        aria-pressed={favorites.includes(shortcut.id)}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredShortcuts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">No shortcuts match your search criteria</p>
              </div>
            )}
          </main>
        </div>

        {/* <footer className="mt-12 text-center text-sm text-gray-500">
          <div className="border-t border-gray-200 my-6" />
          <p>Prompt Shortcuts • Data Engineering Tamil</p>
        </footer> */}
      </div>
    </div>
  );
}
