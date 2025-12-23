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
            <section className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                    Prompt A/B Tester
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Compare two prompt variations side-by-side to find the most effective approach
                </p>
            </section>

            {/* Statistics Dashboard */}
            {testHistory.length > 0 && (
                <Section title="Test Statistics" subtitle="Performance overview">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-blue-800 mt-1">Total Tests</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">{stats.aWins}</div>
                            <div className="text-sm text-green-800 mt-1">Prompt A Wins</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600">{stats.bWins}</div>
                            <div className="text-sm text-purple-800 mt-1">Prompt B Wins</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-amber-600">{stats.ties}</div>
                            <div className="text-sm text-amber-800 mt-1">Ties</div>
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
                        className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />
                </Section>

                <Section title="Prompt B" subtitle="Second variation to test">
                    <textarea
                        value={promptB}
                        onChange={(e) => setPromptB(e.target.value)}
                        placeholder="Enter your second prompt variation here...&#10;&#10;Example: You are an expert teacher. Break down {{topic}} step-by-step for beginners."
                        className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
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
                        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={runTest}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400 flex items-center justify-center gap-2"
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
                            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium flex items-center gap-2"
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
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-h-[200px]">
                                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                                        {responseA || "No response yet..."}
                                    </pre>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(responseA)}
                                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Response A'}
                                </button>
                            </div>
                        </Section>

                        <Section title="Response B" subtitle="Output from Prompt B">
                            <div className="space-y-3">
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 min-h-[200px]">
                                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                                        {responseB || "No response yet..."}
                                    </pre>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(responseB)}
                                    className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
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
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedWinner('A')}
                                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${selectedWinner === 'A'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-slate-300 bg-white text-slate-700 hover:border-green-300'
                                        }`}
                                >
                                    <div className="font-semibold">Prompt A Wins</div>
                                    <div className="text-sm opacity-75">Better response quality</div>
                                </button>
                                <button
                                    onClick={() => setSelectedWinner('Tie')}
                                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${selectedWinner === 'Tie'
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-slate-300 bg-white text-slate-700 hover:border-amber-300'
                                        }`}
                                >
                                    <div className="font-semibold">Tie</div>
                                    <div className="text-sm opacity-75">Both equally good</div>
                                </button>
                                <button
                                    onClick={() => setSelectedWinner('B')}
                                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${selectedWinner === 'B'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-slate-300 bg-white text-slate-700 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="font-semibold">Prompt B Wins</div>
                                    <div className="text-sm opacity-75">Better response quality</div>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about why you chose this winner, what worked well, what didn't..."
                                    className="w-full h-24 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <button
                                onClick={saveResult}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
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
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export All Results
                            </button>
                        </div>

                        {testHistory.map((result, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-500">
                                            {new Date(result.timestamp).toLocaleString()}
                                        </span>
                                        {result.winner && (
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${result.winner === 'A'
                                                        ? 'bg-green-100 text-green-700'
                                                        : result.winner === 'B'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                            >
                                                {result.winner === 'Tie' ? 'Tie' : `Prompt ${result.winner} Won`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {result.notes && (
                                    <div className="bg-slate-50 rounded p-3 mb-3">
                                        <div className="text-xs font-semibold text-slate-600 mb-1">Notes:</div>
                                        <div className="text-sm text-slate-700">{result.notes}</div>
                                    </div>
                                )}

                                <details className="text-sm">
                                    <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">
                                        View Details
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <div className="font-semibold text-slate-700">Prompt A:</div>
                                            <div className="bg-blue-50 rounded p-2 mt-1 text-xs font-mono">
                                                {result.promptA}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-700">Prompt B:</div>
                                            <div className="bg-purple-50 rounded p-2 mt-1 text-xs font-mono">
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">1. Create Variations</h3>
                        <p className="text-blue-800">
                            Write two different prompt variations that you want to compare. Change one variable at a time for clearer insights.
                        </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2">2. Test Consistently</h3>
                        <p className="text-green-800">
                            Use the same test input for both prompts to ensure fair comparison. Run multiple tests with different inputs.
                        </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 mb-2">3. Evaluate Objectively</h3>
                        <p className="text-purple-800">
                            Consider accuracy, clarity, relevance, and tone when choosing a winner. Add detailed notes for future reference.
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h3 className="font-semibold text-amber-900 mb-2">4. Track Results</h3>
                        <p className="text-amber-800">
                            Save your test results and export them for analysis. Look for patterns in what makes prompts effective.
                        </p>
                    </div>
                </div>

                <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-800">
                        <strong>💡 Note:</strong> This tool currently uses simulated responses for demonstration. To use with real LLM APIs, integrate with OpenAI, Anthropic Claude, or your preferred LLM provider in the <code className="bg-indigo-100 px-1 rounded">simulateLLMResponse</code> function.
                    </p>
                </div>
            </Section>
        </div>
    );
}
