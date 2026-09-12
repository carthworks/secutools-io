"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    AlertTriangle,
    Copy,
    Download,
    FileText,
    Info,
    Shield,
    Trash2,
    Upload,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    Zap,
    Brain,
} from "lucide-react";

/* ======================== Types ======================== */

interface ToxicityResult {
    label: string;
    score: number;
    detected: boolean;
}

interface AnalysisResult {
    text: string;
    timestamp: string;
    results: ToxicityResult[];
    overallToxic: boolean;
    maxScore: number;
}

type ToxicityCategory =
    | "identity_attack"
    | "insult"
    | "obscene"
    | "severe_toxicity"
    | "sexual_explicit"
    | "threat"
    | "toxicity";

const CATEGORY_INFO: Record<ToxicityCategory, { label: string; description: string; icon: any; color: string }> = {
    toxicity: {
        label: "General Toxicity",
        description: "Overall toxic, rude, disrespectful, or unreasonable language",
        icon: AlertTriangle,
        color: "text-red-600",
    },
    severe_toxicity: {
        label: "Severe Toxicity",
        description: "Very hateful, aggressive, or disrespectful language",
        icon: XCircle,
        color: "text-red-700",
    },
    identity_attack: {
        label: "Identity Attack",
        description: "Negative or hateful comments targeting identity (race, religion, gender, etc.)",
        icon: Shield,
        color: "text-orange-600",
    },
    insult: {
        label: "Insult",
        description: "Insulting, inflammatory, or negative language",
        icon: AlertCircle,
        color: "text-yellow-600",
    },
    threat: {
        label: "Threat",
        description: "Language describing intent to inflict pain, injury, or violence",
        icon: AlertTriangle,
        color: "text-red-600",
    },
    obscene: {
        label: "Obscene",
        description: "Swear words, curse words, or other obscene language",
        icon: XCircle,
        color: "text-purple-600",
    },
    sexual_explicit: {
        label: "Sexually Explicit",
        description: "Sexually explicit language or references",
        icon: AlertCircle,
        color: "text-pink-600",
    },
};

const EXAMPLE_TEXTS = [
    {
        category: "Safe",
        text: "This is a wonderful day! I'm so grateful for all the help and support from everyone.",
    },
    {
        category: "Mildly Toxic",
        text: "You're being really annoying right now. Can you please just stop?",
    },
    {
        category: "Toxic",
        text: "You're such an idiot. I can't believe how stupid that comment was.",
    },
    {
        category: "Highly Toxic",
        text: "You're a worthless piece of trash and everyone hates you.",
    },
];

/* ======================== Helper Functions ======================== */

// Simulated toxicity detection (client-side heuristic-based)
// In production, you'd use @tensorflow-models/toxicity or similar
function analyzeToxicityHeuristic(text: string): ToxicityResult[] {
    const lowerText = text.toLowerCase();

    // Simple keyword-based detection (for demo purposes)
    const toxicKeywords = ["idiot", "stupid", "hate", "trash", "worthless", "kill", "die"];
    const insultKeywords = ["idiot", "stupid", "dumb", "moron", "fool"];
    const obsceneKeywords = ["damn", "hell", "crap"];
    const threatKeywords = ["kill", "die", "hurt", "destroy"];
    const identityKeywords = ["hate", "racist", "sexist"];

    const containsKeywords = (keywords: string[]) =>
        keywords.some(keyword => lowerText.includes(keyword));

    const toxicityScore = containsKeywords(toxicKeywords) ? 0.85 : 0.15;
    const insultScore = containsKeywords(insultKeywords) ? 0.75 : 0.12;
    const obsceneScore = containsKeywords(obsceneKeywords) ? 0.65 : 0.08;
    const threatScore = containsKeywords(threatKeywords) ? 0.90 : 0.05;
    const identityScore = containsKeywords(identityKeywords) ? 0.80 : 0.10;
    const sexualScore = 0.05; // Placeholder
    const severeScore = Math.max(toxicityScore, threatScore) * 0.9;

    return [
        { label: "toxicity", score: toxicityScore, detected: toxicityScore > 0.5 },
        { label: "severe_toxicity", score: severeScore, detected: severeScore > 0.5 },
        { label: "identity_attack", score: identityScore, detected: identityScore > 0.5 },
        { label: "insult", score: insultScore, detected: insultScore > 0.5 },
        { label: "threat", score: threatScore, detected: threatScore > 0.5 },
        { label: "obscene", score: obsceneScore, detected: obsceneScore > 0.5 },
        { label: "sexual_explicit", score: sexualScore, detected: sexualScore > 0.5 },
    ];
}

function downloadBlob(filename: string, content: string, mime = "text/plain;charset=utf-8") {
    try {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download failed:", e);
    }
}

async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/* ======================== Main Component ======================== */

export default function ToxicityChecker() {
    const [inputText, setInputText] = useState("");
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [threshold, setThreshold] = useState(0.5);
    const [batchMode, setBatchMode] = useState(false);
    const [batchTexts, setBatchTexts] = useState<string[]>([]);

    const currentAnalysis = analysisHistory[0] || null;

    const handleAnalyze = () => {
        if (!inputText.trim()) return;

        setIsAnalyzing(true);

        // Simulate processing delay
        setTimeout(() => {
            const results = analyzeToxicityHeuristic(inputText);
            const maxScore = Math.max(...results.map(r => r.score));
            const overallToxic = results.some(r => r.detected);

            const analysis: AnalysisResult = {
                text: inputText,
                timestamp: new Date().toISOString(),
                results,
                overallToxic,
                maxScore,
            };

            setAnalysisHistory(prev => [analysis, ...prev.slice(0, 9)]); // Keep last 10
            setIsAnalyzing(false);
            setLastAction("Analysis complete!");
            setTimeout(() => setLastAction(null), 2000);
        }, 800);
    };

    const handleBatchAnalyze = () => {
        if (batchTexts.length === 0) return;

        setIsAnalyzing(true);

        setTimeout(() => {
            const newAnalyses = batchTexts.map(text => {
                const results = analyzeToxicityHeuristic(text);
                const maxScore = Math.max(...results.map(r => r.score));
                const overallToxic = results.some(r => r.detected);

                return {
                    text,
                    timestamp: new Date().toISOString(),
                    results,
                    overallToxic,
                    maxScore,
                };
            });

            setAnalysisHistory(prev => [...newAnalyses, ...prev].slice(0, 20));
            setIsAnalyzing(false);
            setBatchTexts([]);
            setLastAction(`Analyzed ${newAnalyses.length} texts!`);
            setTimeout(() => setLastAction(null), 2000);
        }, 1200);
    };

    const handleLoadExample = (text: string) => {
        setInputText(text);
        setBatchMode(false);
    };

    const handleCopy = async () => {
        if (!currentAnalysis) return;
        const text = JSON.stringify(currentAnalysis, null, 2);
        const success = await copyToClipboard(text);
        setLastAction(success ? "Copied to clipboard!" : "Copy failed");
        setTimeout(() => setLastAction(null), 2000);
    };

    const handleExportJSON = () => {
        if (analysisHistory.length === 0) return;
        const data = {
            analyses: analysisHistory,
            exportDate: new Date().toISOString(),
            threshold,
        };
        downloadBlob("toxicity-analysis.json", JSON.stringify(data, null, 2), "application/json");
        setLastAction("Exported as JSON");
        setTimeout(() => setLastAction(null), 2000);
    };

    const handleExportCSV = () => {
        if (analysisHistory.length === 0) return;

        let csv = "Text,Timestamp,Overall Toxic,Max Score,Toxicity,Severe Toxicity,Identity Attack,Insult,Threat,Obscene,Sexual Explicit\n";

        analysisHistory.forEach(analysis => {
            const row = [
                `"${analysis.text.replace(/"/g, '""')}"`,
                analysis.timestamp,
                analysis.overallToxic,
                analysis.maxScore.toFixed(3),
                ...analysis.results.map(r => r.score.toFixed(3)),
            ];
            csv += row.join(",") + "\n";
        });

        downloadBlob("toxicity-analysis.csv", csv, "text/csv");
        setLastAction("Exported as CSV");
        setTimeout(() => setLastAction(null), 2000);
    };

    const handleClearHistory = () => {
        setAnalysisHistory([]);
        setLastAction("History cleared");
        setTimeout(() => setLastAction(null), 2000);
    };

    const stats = useMemo(() => {
        if (analysisHistory.length === 0) return null;

        const totalAnalyses = analysisHistory.length;
        const toxicCount = analysisHistory.filter(a => a.overallToxic).length;
        const safeCount = totalAnalyses - toxicCount;
        const avgMaxScore = analysisHistory.reduce((sum, a) => sum + a.maxScore, 0) / totalAnalyses;

        return {
            totalAnalyses,
            toxicCount,
            safeCount,
            toxicPercentage: (toxicCount / totalAnalyses) * 100,
            avgMaxScore,
        };
    }, [analysisHistory]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto py-2">
            {/* Header */}
            <header className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                    <Brain className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        AI Toxicity Checker
                    </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
                    Detect harmful, toxic, or biased language in AI model outputs and user content. Powered by client-side analysis.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 max-w-2xl mx-auto">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>This demo uses heuristic-based detection. For production, integrate TensorFlow.js toxicity model.</span>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left - Input & Examples */}
                <aside className="lg:col-span-1 space-y-4">
                    {/* Mode Toggle */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setBatchMode(false)}
                                className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${!batchMode
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                                    }`}
                            >
                                Single Text
                            </button>
                            <button
                                onClick={() => setBatchMode(true)}
                                className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${batchMode
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                                    }`}
                            >
                                Batch Mode
                            </button>
                        </div>

                        {!batchMode ? (
                            <>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter Text to Analyze</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type or paste text here to check for toxicity..."
                                    className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[150px] text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!inputText.trim() || isAnalyzing}
                                    className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-colors"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" />
                                            Analyze Text
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Batch Analysis (one per line)</label>
                                <textarea
                                    value={batchTexts.join("\n")}
                                    onChange={(e) => setBatchTexts(e.target.value.split("\n").filter(t => t.trim()))}
                                    placeholder="Enter multiple texts, one per line..."
                                    className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[150px] text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                                />
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{batchTexts.length} texts ready</div>
                                <button
                                    onClick={handleBatchAnalyze}
                                    disabled={batchTexts.length === 0 || isAnalyzing}
                                    className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-colors"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 className="w-4 h-4" />
                                            Analyze Batch
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Example Texts */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Example Texts
                        </h3>
                        <div className="space-y-2">
                            {EXAMPLE_TEXTS.map((example, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleLoadExample(example.text)}
                                    className="w-full text-left p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all"
                                >
                                    <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">{example.category}</div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{example.text}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Threshold Control */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Detection Threshold: <span className="font-mono text-blue-600 dark:text-blue-400">{threshold.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            <span>Sensitive</span>
                            <span>Balanced</span>
                            <span>Strict</span>
                        </div>
                    </div>
                </aside>

                {/* Main - Results */}
                <main className="lg:col-span-2 space-y-4">
                    {/* Current Analysis */}
                    {currentAnalysis && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {currentAnalysis.overallToxic ? (
                                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                    Analysis Result
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {/* Text Preview */}
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Analyzed Text</div>
                                <div className="text-sm text-slate-800 dark:text-slate-200 font-mono">{currentAnalysis.text}</div>
                            </div>

                            {/* Overall Status */}
                            <div className={`mb-4 p-4 rounded-lg border ${currentAnalysis.overallToxic
                                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50"
                                    : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50"
                                }`}>
                                <div className="flex items-center gap-3">
                                    {currentAnalysis.overallToxic ? (
                                        <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                                    ) : (
                                        <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <div className={`font-semibold text-base ${currentAnalysis.overallToxic ? "text-rose-800 dark:text-rose-300" : "text-emerald-800 dark:text-emerald-300"}`}>
                                            {currentAnalysis.overallToxic ? "Toxic Content Detected" : "Content Appears Safe"}
                                        </div>
                                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                            Maximum toxicity score: <span className="font-semibold font-mono">{(currentAnalysis.maxScore * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Category Breakdown</h3>
                                {currentAnalysis.results.map((result) => {
                                    const info = CATEGORY_INFO[result.label as ToxicityCategory];
                                    const Icon = info.icon;
                                    const percentage = result.score * 100;

                                    return (
                                        <div key={result.label} className="space-y-1.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-4 h-4 ${info.color}`} />
                                                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{info.label}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">{percentage.toFixed(1)}%</span>
                                                    {result.detected && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full">
                                                            Detected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${result.detected ? "bg-rose-500" : "bg-emerald-500"
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{info.description}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    {stats && (
                        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800/50 p-6 transition-colors">
                            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                Analysis Statistics
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalAnalyses}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Total Analyses</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.toxicCount}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Toxic</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.safeCount}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Safe</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.toxicPercentage.toFixed(1)}%</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Toxic Rate</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {analysisHistory.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    Analysis History ({analysisHistory.length})
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExportJSON}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        JSON
                                    </button>
                                    <button
                                        onClick={handleExportCSV}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {analysisHistory.map((analysis, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border ${analysis.overallToxic
                                                ? "border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/30"
                                                : "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/30"
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {analysis.overallToxic ? (
                                                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{analysis.text}</div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span>{new Date(analysis.timestamp).toLocaleTimeString()}</span>
                                                    <span>Max: {(analysis.maxScore * 100).toFixed(1)}%</span>
                                                    <span className={`font-semibold ${analysis.overallToxic ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                                        {analysis.overallToxic ? "Toxic" : "Safe"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!currentAnalysis && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
                            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Analysis Yet</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Enter text or select an example to begin toxicity analysis
                            </p>
                        </div>
                    )}
                </main>
            </div>

            {/* Toast */}
            {lastAction && (
                <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm px-4 py-3 rounded-lg shadow-xl animate-fade-in border border-slate-800 dark:border-slate-200 font-medium">
                    {lastAction}
                </div>
            )}
        </div>
    );
}
