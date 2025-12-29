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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-3">
                        <Brain className="w-10 h-10 text-blue-600" />
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            AI Toxicity Checker
                        </h1>
                    </div>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Detect harmful, toxic, or biased language in AI model outputs and user content. Powered by client-side analysis.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-2xl mx-auto">
                        <Info className="w-4 h-4" />
                        <span>This demo uses heuristic-based detection. For production, integrate TensorFlow.js toxicity model.</span>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left - Input & Examples */}
                    <aside className="lg:col-span-1 space-y-4">
                        {/* Mode Toggle */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setBatchMode(false)}
                                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${!batchMode
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                                        }`}
                                >
                                    Single Text
                                </button>
                                <button
                                    onClick={() => setBatchMode(true)}
                                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${batchMode
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                                        }`}
                                >
                                    Batch Mode
                                </button>
                            </div>

                            {!batchMode ? (
                                <>
                                    <label className="block text-sm font-medium mb-2">Enter Text to Analyze</label>
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Type or paste text here to check for toxicity..."
                                        className="w-full p-3 border border-slate-300 rounded-lg min-h-[150px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!inputText.trim() || isAnalyzing}
                                        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                    <label className="block text-sm font-medium mb-2">Batch Analysis (one per line)</label>
                                    <textarea
                                        value={batchTexts.join("\n")}
                                        onChange={(e) => setBatchTexts(e.target.value.split("\n").filter(t => t.trim()))}
                                        placeholder="Enter multiple texts, one per line..."
                                        className="w-full p-3 border border-slate-300 rounded-lg min-h-[150px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <div className="text-xs text-slate-500 mt-1">{batchTexts.length} texts ready</div>
                                    <button
                                        onClick={handleBatchAnalyze}
                                        disabled={batchTexts.length === 0 || isAnalyzing}
                                        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Example Texts
                            </h3>
                            <div className="space-y-2">
                                {EXAMPLE_TEXTS.map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleLoadExample(example.text)}
                                        className="w-full text-left p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                                    >
                                        <div className="text-xs font-medium text-slate-600 mb-1">{example.category}</div>
                                        <div className="text-sm text-slate-700 line-clamp-2">{example.text}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Threshold Control */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                            <label className="block text-sm font-medium mb-2">
                                Detection Threshold: {threshold.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={threshold}
                                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
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
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        {currentAnalysis.overallToxic ? (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        )}
                                        Analysis Result
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                {/* Text Preview */}
                                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-xs text-slate-500 mb-1">Analyzed Text</div>
                                    <div className="text-sm text-slate-800">{currentAnalysis.text}</div>
                                </div>

                                {/* Overall Status */}
                                <div className={`mb-4 p-4 rounded-lg border-2 ${currentAnalysis.overallToxic
                                        ? "bg-red-50 border-red-300"
                                        : "bg-green-50 border-green-300"
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {currentAnalysis.overallToxic ? (
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        ) : (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        )}
                                        <div className="flex-1">
                                            <div className="font-semibold">
                                                {currentAnalysis.overallToxic ? "Toxic Content Detected" : "Content Appears Safe"}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                Maximum toxicity score: {(currentAnalysis.maxScore * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Breakdown */}
                                <div className="space-y-3">
                                    <h3 className="font-medium text-sm">Category Breakdown</h3>
                                    {currentAnalysis.results.map((result) => {
                                        const info = CATEGORY_INFO[result.label as ToxicityCategory];
                                        const Icon = info.icon;
                                        const percentage = result.score * 100;

                                        return (
                                            <div key={result.label} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-4 h-4 ${info.color}`} />
                                                        <span className="text-sm font-medium">{info.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-600">{percentage.toFixed(1)}%</span>
                                                        {result.detected && (
                                                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                                                Detected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${result.detected ? "bg-red-500" : "bg-green-500"
                                                            }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <div className="text-xs text-slate-500">{info.description}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Statistics */}
                        {stats && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Analysis Statistics
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{stats.totalAnalyses}</div>
                                        <div className="text-xs text-slate-600">Total Analyses</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">{stats.toxicCount}</div>
                                        <div className="text-xs text-slate-600">Toxic</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{stats.safeCount}</div>
                                        <div className="text-xs text-slate-600">Safe</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{stats.toxicPercentage.toFixed(1)}%</div>
                                        <div className="text-xs text-slate-600">Toxic Rate</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* History */}
                        {analysisHistory.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        Analysis History ({analysisHistory.length})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleExportJSON}
                                            className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                                        >
                                            <Download className="w-3 h-3" />
                                            JSON
                                        </button>
                                        <button
                                            onClick={handleExportCSV}
                                            className="text-xs px-3 py-1 rounded border border-slate-300 hover:bg-slate-50 flex items-center gap-1"
                                        >
                                            <Download className="w-3 h-3" />
                                            CSV
                                        </button>
                                        <button
                                            onClick={handleClearHistory}
                                            className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {analysisHistory.map((analysis, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg border ${analysis.overallToxic
                                                    ? "border-red-200 bg-red-50"
                                                    : "border-green-200 bg-green-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {analysis.overallToxic ? (
                                                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-slate-800 line-clamp-2">{analysis.text}</div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span>{new Date(analysis.timestamp).toLocaleTimeString()}</span>
                                                        <span>Max: {(analysis.maxScore * 100).toFixed(1)}%</span>
                                                        <span className={analysis.overallToxic ? "text-red-600" : "text-green-600"}>
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
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
                                <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-600 mb-2">No Analysis Yet</h3>
                                <p className="text-sm text-slate-500">
                                    Enter text or select an example to begin toxicity analysis
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Toast */}
            {lastAction && (
                <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-3 rounded-lg shadow-lg animate-fade-in">
                    {lastAction}
                </div>
            )}
        </div>
    );
}
