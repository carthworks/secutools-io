"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Scissors,
    Copy,
    Download,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    BarChart3,
    Zap,
    FileText,
    Brain
} from "lucide-react";

// Simple token estimation (approximation: ~4 chars per token for English)
function estimateTokens(text: string): number {
    if (!text) return 0;
    // More accurate estimation considering whitespace and punctuation
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    // Average between word-based and char-based estimation
    return Math.ceil((words * 1.3 + chars / 4) / 2);
}

type Model = {
    id: string;
    name: string;
    maxTokens: number;
    color: string;
};

const MODELS: Model[] = [
    { id: "gpt-4", name: "GPT-4", maxTokens: 8192, color: "from-emerald-500 to-teal-600" },
    { id: "gpt-4-32k", name: "GPT-4 32K", maxTokens: 32768, color: "from-blue-500 to-indigo-600" },
    { id: "gpt-3.5", name: "GPT-3.5 Turbo", maxTokens: 4096, color: "from-cyan-500 to-blue-600" },
    { id: "claude-3", name: "Claude 3", maxTokens: 200000, color: "from-purple-500 to-pink-600" },
    { id: "claude-2", name: "Claude 2", maxTokens: 100000, color: "from-violet-500 to-purple-600" },
    { id: "gemini-pro", name: "Gemini Pro", maxTokens: 32768, color: "from-amber-500 to-orange-600" },
];

type TruncationStrategy = "start" | "end" | "middle" | "smart";

async function copyText(text: string, onSuccess: () => void) {
    try {
        await navigator.clipboard.writeText(text);
        onSuccess();
    } catch {
        alert("Copy failed");
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

function truncateText(text: string, targetTokens: number, strategy: TruncationStrategy): string {
    const currentTokens = estimateTokens(text);
    if (currentTokens <= targetTokens) return text;

    const ratio = targetTokens / currentTokens;
    const targetLength = Math.floor(text.length * ratio * 0.95); // 95% to be safe

    switch (strategy) {
        case "start":
            // Keep the beginning
            return text.slice(0, targetLength) + "\n\n[... truncated]";

        case "end":
            // Keep the ending
            return "[truncated ...]\n\n" + text.slice(-targetLength);

        case "middle":
            // Keep beginning and end, remove middle
            const halfLength = Math.floor(targetLength / 2);
            return text.slice(0, halfLength) + "\n\n[... middle section truncated ...]\n\n" + text.slice(-halfLength);

        case "smart":
            // Try to preserve complete sentences
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            let result = "";
            let tokens = 0;

            for (const sentence of sentences) {
                const sentenceTokens = estimateTokens(sentence);
                if (tokens + sentenceTokens <= targetTokens) {
                    result += sentence;
                    tokens += sentenceTokens;
                } else {
                    break;
                }
            }

            return result || text.slice(0, targetLength) + "...";

        default:
            return text.slice(0, targetLength);
    }
}

export default function ContextTrimmer() {
    const [inputText, setInputText] = useState("");
    const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);
    const [strategy, setStrategy] = useState<TruncationStrategy>("smart");
    const [customLimit, setCustomLimit] = useState<number | null>(null);
    const [trimmedText, setTrimmedText] = useState("");
    const [copied, setCopied] = useState(false);

    const inputTokens = useMemo(() => estimateTokens(inputText), [inputText]);
    const outputTokens = useMemo(() => estimateTokens(trimmedText), [trimmedText]);
    const tokenLimit = customLimit || selectedModel.maxTokens;
    const isOverLimit = inputTokens > tokenLimit;
    const usagePercent = Math.min(100, (inputTokens / tokenLimit) * 100);

    useEffect(() => {
        if (isOverLimit) {
            const truncated = truncateText(inputText, tokenLimit, strategy);
            setTrimmedText(truncated);
        } else {
            setTrimmedText(inputText);
        }
    }, [inputText, tokenLimit, strategy, isOverLimit]);

    const tokensSaved = inputTokens - outputTokens;
    const savingsPercent = inputTokens > 0 ? ((tokensSaved / inputTokens) * 100).toFixed(1) : "0";

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200 shadow-sm">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">AI Tools</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Context Trimmer
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Automatically trim your context to fit token limits. Smart truncation preserves important information
                        while staying within model constraints.
                    </p>
                </div>

                {/* Model Selection & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Model Selector */}
                    <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                        <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            Select Model
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedModel.id === model.id
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-slate-200 hover:border-blue-300 bg-white"
                                        }`}
                                >
                                    <div className="font-semibold text-slate-800 text-sm">{model.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{model.maxTokens.toLocaleString()} tokens</div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-700">Custom Limit:</label>
                            <input
                                type="number"
                                value={customLimit || ""}
                                onChange={(e) => setCustomLimit(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder={selectedModel.maxTokens.toString()}
                                className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Token Stats */}
                    <div className={`bg-gradient-to-br ${selectedModel.color} rounded-2xl p-6 text-white shadow-xl`}>
                        <div className="text-white/80 text-sm font-medium mb-2">Token Usage</div>
                        <div className="text-4xl font-bold mb-1">{inputTokens.toLocaleString()}</div>
                        <div className="text-white/90 text-sm mb-4">of {tokenLimit.toLocaleString()} tokens</div>

                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden mb-2">
                            <div
                                className={`h-full transition-all duration-300 ${isOverLimit ? "bg-red-400" : "bg-white/80"
                                    }`}
                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                            />
                        </div>

                        <div className="text-white/90 text-xs">
                            {isOverLimit ? (
                                <span className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Over limit by {(inputTokens - tokenLimit).toLocaleString()} tokens
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Within limit
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Truncation Strategy */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                    <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-blue-600" />
                        Truncation Strategy
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { id: "smart", label: "Smart", desc: "Preserve sentences", icon: Brain },
                            { id: "start", label: "Keep Start", desc: "Trim from end", icon: FileText },
                            { id: "end", label: "Keep End", desc: "Trim from start", icon: FileText },
                            { id: "middle", label: "Keep Edges", desc: "Remove middle", icon: Scissors },
                        ].map((strat) => (
                            <button
                                key={strat.id}
                                onClick={() => setStrategy(strat.id as TruncationStrategy)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${strategy === strat.id
                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                        : "border-slate-200 hover:border-blue-300 bg-white"
                                    }`}
                            >
                                <strat.icon className="w-5 h-5 text-blue-600 mb-2" />
                                <div className="font-semibold text-slate-800 text-sm">{strat.label}</div>
                                <div className="text-xs text-slate-500 mt-1">{strat.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input/Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Input Text
                            </h2>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                                {inputTokens.toLocaleString()} tokens
                            </span>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste your context here..."
                                className="w-full h-96 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Output */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Trimmed Output
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                                    {outputTokens.toLocaleString()} tokens
                                </span>
                                {tokensSaved > 0 && (
                                    <span className="px-3 py-1 bg-emerald-500 rounded-full text-xs text-white font-medium">
                                        -{savingsPercent}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={trimmedText}
                                readOnly
                                className="w-full h-96 px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 resize-none font-mono text-sm"
                            />
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t flex flex-wrap gap-2">
                            <button
                                onClick={() => copyText(trimmedText, () => {
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                })}
                                className="px-4 py-2 bg-white border-2 border-slate-300 hover:border-blue-400 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? "Copied!" : "Copy"}
                            </button>
                            <button
                                onClick={() => downloadBlob(trimmedText, "trimmed-context.txt")}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {inputText && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                            <div className="text-slate-600 text-sm mb-1">Input Tokens</div>
                            <div className="text-2xl font-bold text-slate-800">{inputTokens.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                            <div className="text-slate-600 text-sm mb-1">Output Tokens</div>
                            <div className="text-2xl font-bold text-blue-600">{outputTokens.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                            <div className="text-slate-600 text-sm mb-1">Tokens Saved</div>
                            <div className="text-2xl font-bold text-emerald-600">{tokensSaved.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/20 p-4">
                            <div className="text-slate-600 text-sm mb-1">Reduction</div>
                            <div className="text-2xl font-bold text-purple-600">{savingsPercent}%</div>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3">
                        <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600">
                            <strong className="text-slate-900">Token Estimation:</strong> Token counts are estimates based on average character-to-token ratios.
                            Actual token counts may vary slightly depending on the specific tokenizer used by each model.
                            For production use, consider using the official tokenizer libraries for precise counts.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
