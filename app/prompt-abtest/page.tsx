"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Check, Play, RotateCcw, TrendingUp, BarChart3 } from "lucide-react";

type TestResult = {
    promptA: string;
    promptB: string;
    responseA: string;
    responseB: string;
    timestamp: string;
    winner?: 'A' | 'B' | 'Tie';
    notes?: string;
};

export default function PromptABTesterPage() {
    const [promptA, setPromptA] = useState("");
    const [promptB, setPromptB] = useState("");
    const [testInput, setTestInput] = useState("");
    const [responseA, setResponseA] = useState("");
    const [responseB, setResponseB] = useState("");
    const [loading, setLoading] = useState(false);
    const [testHistory, setTestHistory] = useState<TestResult[]>([]);
    const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | 'Tie' | null>(null);
    const [notes, setNotes] = useState("");
    const [copied, setCopied] = useState(false);

    // Simulated LLM response (replace with actual API call)
    const simulateLLMResponse = async (prompt: string, input: string): Promise<string> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // This is a mock response - replace with actual LLM API call
        return `[Simulated Response]\n\nPrompt: ${prompt.substring(0, 50)}...\nInput: ${input.substring(0, 50)}...\n\nThis is a simulated response. In production, this would call your LLM API (OpenAI, Anthropic, etc.) with the prompt and input.`;
    };

    const runTest = async () => {
        if (!promptA || !promptB || !testInput) {
            alert("Please fill in both prompts and test input");
            return;
        }

        setLoading(true);
        setResponseA("");
        setResponseB("");
        setSelectedWinner(null);
        setNotes("");

        try {
            // Run both prompts in parallel
            const [resA, resB] = await Promise.all([
                simulateLLMResponse(promptA, testInput),
                simulateLLMResponse(promptB, testInput)
            ]);

            setResponseA(resA);
            setResponseB(resB);
        } catch (error) {
            console.error("Test failed:", error);
            alert("Test failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const saveResult = () => {
        if (!responseA || !responseB) {
            alert("Please run a test first");
            return;
        }

        const result: TestResult = {
            promptA,
            promptB,
            responseA,
            responseB,
            timestamp: new Date().toISOString(),
            winner: selectedWinner || undefined,
            notes: notes || undefined
        };

        setTestHistory([result, ...testHistory]);
        alert("Test result saved to history!");
    };

    const clearTest = () => {
        setPromptA("");
        setPromptB("");
        setTestInput("");
        setResponseA("");
        setResponseB("");
        setSelectedWinner(null);
        setNotes("");
    };

    const exportResults = () => {
        const data = {
            testHistory,
            exportedAt: new Date().toISOString(),
            summary: {
                totalTests: testHistory.length,
                promptAWins: testHistory.filter(t => t.winner === 'A').length,
                promptBWins: testHistory.filter(t => t.winner === 'B').length,
                ties: testHistory.filter(t => t.winner === 'Tie').length
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompt-ab-test-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getWinnerStats = () => {
        const aWins = testHistory.filter(t => t.winner === 'A').length;
        const bWins = testHistory.filter(t => t.winner === 'B').length;
        const ties = testHistory.filter(t => t.winner === 'Tie').length;
        const total = testHistory.length;

        return { aWins, bWins, ties, total };
    };

    const stats = getWinnerStats();

    return (
        <div className="space-y-8">
            <section className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
                    Prompt A/B Tester
                </h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
                    Compare two prompt variations side-by-side to find the most effective approach
                </p>
            </section>

            {/* Statistics Dashboard */}
            {testHistory.length > 0 && (
                <Section title="Test Statistics" subtitle="Performance overview">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                            <div className="text-sm text-blue-800 dark:text-blue-300 mt-1 font-medium">Total Tests</div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.aWins}</div>
                            <div className="text-sm text-emerald-800 dark:text-emerald-300 mt-1 font-medium">Prompt A Wins</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.bWins}</div>
                            <div className="text-sm text-purple-800 dark:text-purple-300 mt-1 font-medium">Prompt B Wins</div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.ties}</div>
                            <div className="text-sm text-amber-800 dark:text-amber-300 mt-1 font-medium">Ties</div>
                        </div>
                    </div>
                </Section>
            )}

            {/* Prompts Input */}
            <div className="grid md:grid-cols-2 gap-6">
                <Section title="Prompt A" subtitle="First variation to test">
                    <textarea
                        value={promptA}
                        onChange={(e) => setPromptA(e.target.value)}
                        placeholder="Enter your first prompt variation here...&#10;&#10;Example: You are a helpful assistant. Explain {{topic}} in simple terms."
                        className="w-full h-48 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none font-mono text-sm"
                    />
                </Section>

                <Section title="Prompt B" subtitle="Second variation to test">
                    <textarea
                        value={promptB}
                        onChange={(e) => setPromptB(e.target.value)}
                        placeholder="Enter your second prompt variation here...&#10;&#10;Example: You are an expert teacher. Break down {{topic}} step-by-step for beginners."
                        className="w-full h-48 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none font-mono text-sm"
                    />
                </Section>
            </div>

            {/* Test Input */}
            <Section title="Test Input" subtitle="The input/question to test both prompts with">
                <div className="space-y-3">
                    <textarea
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        placeholder="Enter the test input that will be used with both prompts...&#10;&#10;Example: Explain quantum computing"
                        className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-sm"
                    />

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={runTest}
                            disabled={loading}
                            className="flex-1 min-w-[160px] px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:bg-slate-400 dark:disabled:bg-slate-700 flex items-center justify-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Running Test...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Run A/B Test
                                </>
                            )}
                        </button>
                        <button
                            onClick={clearTest}
                            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Clear
                        </button>
                    </div>
                </div>
            </Section>

            {/* Results */}
            {(responseA || responseB) && (
                <>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Section title="Response A" subtitle="Output from Prompt A">
                            <div className="space-y-3">
                                <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 min-h-[200px]">
                                    <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 font-mono">
                                        {responseA || "No response yet..."}
                                    </pre>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(responseA)}
                                    className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Response A'}
                                </button>
                            </div>
                        </Section>

                        <Section title="Response B" subtitle="Output from Prompt B">
                            <div className="space-y-3">
                                <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg p-4 min-h-[200px]">
                                    <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 font-mono">
                                        {responseB || "No response yet..."}
                                    </pre>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(responseB)}
                                    className="w-full px-4 py-2 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Response B'}
                                </button>
                            </div>
                        </Section>
                    </div>

                    {/* Evaluation */}
                    <Section title="Evaluate Results" subtitle="Which prompt performed better?">
                        <div className="space-y-4">
                            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                                <button
                                    onClick={() => setSelectedWinner('A')}
                                    className={`flex-1 min-w-[140px] px-6 py-4 rounded-lg border-2 transition-all ${selectedWinner === 'A'
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">Prompt A Wins</div>
                                    <div className="text-xs opacity-75 mt-0.5">Better response quality</div>
                                </button>
                                <button
                                    onClick={() => setSelectedWinner('Tie')}
                                    className={`flex-1 min-w-[140px] px-6 py-4 rounded-lg border-2 transition-all ${selectedWinner === 'Tie'
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-700'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">Tie</div>
                                    <div className="text-xs opacity-75 mt-0.5">Both equally good</div>
                                </button>
                                <button
                                    onClick={() => setSelectedWinner('B')}
                                    className={`flex-1 min-w-[140px] px-6 py-4 rounded-lg border-2 transition-all ${selectedWinner === 'B'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-purple-300 dark:hover:border-purple-700'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">Prompt B Wins</div>
                                    <div className="text-xs opacity-75 mt-0.5">Better response quality</div>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about why you chose this winner, what worked well, what didn't..."
                                    className="w-full h-24 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-sm"
                                />
                            </div>

                            <button
                                onClick={saveResult}
                                className="w-full px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Save Test Result
                            </button>
                        </div>
                    </Section>
                </>
            )}

            {/* Test History */}
            {testHistory.length > 0 && (
                <Section title="Test History" subtitle={`${testHistory.length} test(s) completed`}>
                    <div className="space-y-3">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={exportResults}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export All Results
                            </button>
                        </div>

                        {testHistory.map((result, index) => (
                            <div key={index} className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(result.timestamp).toLocaleString()}
                                        </span>
                                        {result.winner && (
                                            <span
                                                className={`px-3 py-0.5 rounded-full text-xs font-semibold ${result.winner === 'A'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                                        : result.winner === 'B'
                                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                                                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                                    }`}
                                            >
                                                {result.winner === 'Tie' ? 'Tie' : `Prompt ${result.winner} Won`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {result.notes && (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 mb-3">
                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Notes:</div>
                                        <div className="text-sm text-slate-700 dark:text-slate-300">{result.notes}</div>
                                    </div>
                                )}

                                <details className="text-sm">
                                    <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                        View Details
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">Prompt A:</div>
                                            <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg p-2.5 mt-1 text-xs font-mono text-slate-800 dark:text-slate-200">
                                                {result.promptA}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">Prompt B:</div>
                                            <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg p-2.5 mt-1 text-xs font-mono text-slate-800 dark:text-slate-200">
                                                {result.promptB}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Info Section */}
            <Section title="How to Use" subtitle="A/B testing best practices">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1.5">1. Create Variations</h3>
                        <p className="text-blue-800 dark:text-blue-200/80 text-xs sm:text-sm">
                            Write two different prompt variations that you want to compare. Change one variable at a time for clearer insights.
                        </p>
                    </div>
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-4">
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1.5">2. Test Consistently</h3>
                        <p className="text-emerald-800 dark:text-emerald-200/80 text-xs sm:text-sm">
                            Use the same test input for both prompts to ensure fair comparison. Run multiple tests with different inputs.
                        </p>
                    </div>
                    <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1.5">3. Evaluate Objectively</h3>
                        <p className="text-purple-800 dark:text-purple-200/80 text-xs sm:text-sm">
                            Consider accuracy, clarity, relevance, and tone when choosing a winner. Add detailed notes for future reference.
                        </p>
                    </div>
                    <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-1.5">4. Track Results</h3>
                        <p className="text-amber-800 dark:text-amber-200/80 text-xs sm:text-sm">
                            Save your test results and export them for analysis. Look for patterns in what makes prompts effective.
                        </p>
                    </div>
                </div>

                <div className="mt-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-4">
                    <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300">
                        <strong>💡 Note:</strong> This tool currently uses simulated responses for demonstration. To use with real LLM APIs, integrate with OpenAI, Anthropic Claude, or your preferred LLM provider in the <code className="bg-indigo-100 dark:bg-indigo-900/70 px-1 py-0.5 rounded text-xs font-mono">simulateLLMResponse</code> function.
                    </p>
                </div>
            </Section>
        </div>
    );
}
