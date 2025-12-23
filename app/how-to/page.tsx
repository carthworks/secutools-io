"use client";

import Section from "@/components/Section";
import { BookOpen, Search, Star, Zap } from "lucide-react";

export default function HowToPage() {
    return (
        <div className="space-y-12">
            {/* Hero */}
            <section className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                    How to Use SecuTools.io
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Learn how to get the most out of our cybersecurity toolkit
                </p>
            </section>

            {/* Quick Start Guide */}
            <Section title="Quick Start Guide" subtitle="Get started in 3 easy steps">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                            <h3 className="font-semibold text-slate-800">Browse Tools</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Explore our categorized tools on the homepage. Use the search bar or browse by category to find what you need.
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                            <h3 className="font-semibold text-slate-800">Select a Tool</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Click on any tool to open it. Each tool has a clean interface with clear instructions and examples.
                        </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                            <h3 className="font-semibold text-slate-800">Use & Save</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Input your data, get instant results, and save your favorites for quick access later.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Key Features */}
            <Section title="Key Features" subtitle="Make the most of SecuTools.io">
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Search className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-2">🔍 Smart Search</h3>
                            <p className="text-slate-600 mb-2">
                                Use the search bar on the homepage to quickly find tools. Press <kbd className="bg-slate-100 border rounded px-2 py-0.5 text-xs">⌘K</kbd> (Mac) or <kbd className="bg-slate-100 border rounded px-2 py-0.5 text-xs">Ctrl+K</kbd> (Windows) to focus the search instantly.
                            </p>
                            <p className="text-sm text-slate-500">
                                <strong>Tip:</strong> Search by tool name, description, or category for best results.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-amber-100 p-3 rounded-lg">
                            <Star className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-2">⭐ Favorites</h3>
                            <p className="text-slate-600 mb-2">
                                Click the star icon on any tool to add it to your favorites. Your favorites are saved locally and appear at the top of the homepage for quick access.
                            </p>
                            <p className="text-sm text-slate-500">
                                <strong>Tip:</strong> Favorite your most-used tools to create a personalized dashboard.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <Zap className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-2">⚡ Recent Tools</h3>
                            <p className="text-slate-600 mb-2">
                                Your recently used tools are automatically tracked and displayed below the search bar for easy re-access.
                            </p>
                            <p className="text-sm text-slate-500">
                                <strong>Tip:</strong> Recent tools are stored locally in your browser.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-2">📚 Categories</h3>
                            <p className="text-slate-600 mb-2">
                                Tools are organized into 6 main categories. Click "Collapse" or "Expand" on any category to show/hide its tools.
                            </p>
                            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                <li><strong>Cryptography & Encoding:</strong> Hash tools, JWT, passwords, certificates</li>
                                <li><strong>Threat Intelligence:</strong> IOC extraction, CVE lookup, WHOIS, threat checks</li>
                                <li><strong>Web & Cloud Security:</strong> Headers check, CORS, CSRF, security scanning</li>
                                <li><strong>Penetration Testing:</strong> Wordlists, payloads, fuzzing tools</li>
                                <li><strong>AI Security:</strong> Prompt engineering, jailbreak testing, RAG builders</li>
                                <li><strong>Learning:</strong> Tips, tutorials, educational resources</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Tool-Specific Guides */}
            <Section title="Popular Tools Guide" subtitle="How to use our most popular tools">
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">🔐 Hash Tools</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600">
                            <li>Navigate to the Hash Tools page</li>
                            <li>Enter your text or upload a file</li>
                            <li>Select the hash algorithm (MD5, SHA1, SHA256, SHA512)</li>
                            <li>View the generated hash instantly</li>
                            <li>Copy the result with one click</li>
                        </ol>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">🎫 JWT Decoder</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600">
                            <li>Paste your JWT token into the input field</li>
                            <li>The tool automatically decodes the header and payload</li>
                            <li>View claims, expiration time, and signature details</li>
                            <li>Verify token validity and structure</li>
                        </ol>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">🔍 IOC Extractor</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600">
                            <li>Paste text containing potential indicators of compromise</li>
                            <li>The tool automatically extracts IPs, URLs, hashes, and emails</li>
                            <li>Review the categorized results</li>
                            <li>Export or copy the extracted IOCs</li>
                        </ol>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">🛡️ Security Headers Checker</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600">
                            <li>Enter the URL you want to check</li>
                            <li>Click "Check Headers"</li>
                            <li>Review the security headers analysis</li>
                            <li>Get recommendations for missing or misconfigured headers</li>
                        </ol>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-3">🤖 Jailbreak Tester</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600">
                            <li>Enter your AI prompt or system message</li>
                            <li>Select from common jailbreak attack patterns</li>
                            <li>Test how well your prompt resists manipulation</li>
                            <li>Review security recommendations and improvements</li>
                        </ol>
                    </div>
                </div>
            </Section>

            {/* Privacy & Security */}
            <Section title="Privacy & Security" subtitle="Your data stays private">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-800 mb-3">🔒 Client-Side Processing</h3>
                    <p className="text-slate-600 mb-4">
                        Most tools process data entirely in your browser. Your sensitive information never leaves your device.
                    </p>

                    <h3 className="font-semibold text-slate-800 mb-3">🌐 API-Based Tools</h3>
                    <p className="text-slate-600 mb-4">
                        Some tools (like CVE Lookup, WHOIS, Threat Intel) require external API calls. These are clearly marked with an "api" tag.
                    </p>

                    <h3 className="font-semibold text-slate-800 mb-3">💾 Local Storage</h3>
                    <p className="text-slate-600">
                        Favorites and recent tools are stored in your browser's local storage. No account or sign-up required.
                    </p>
                </div>
            </Section>

            {/* Tips & Tricks */}
            <Section title="Tips & Tricks" subtitle="Pro tips for power users">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">💡 Keyboard Shortcuts</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• <kbd className="bg-slate-100 border rounded px-1">⌘K</kbd> / <kbd className="bg-slate-100 border rounded px-1">Ctrl+K</kbd> - Focus search</li>
                            <li>• <kbd className="bg-slate-100 border rounded px-1">Esc</kbd> - Clear search</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">🎯 Filter by Tags</h4>
                        <p className="text-sm text-slate-600">
                            Use tag filters in the sidebar to find tools by type: client-only, api, upload, vuln, etc.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">🌙 Dark Mode</h4>
                        <p className="text-sm text-slate-600">
                            Toggle dark mode using the button in the top-right corner for comfortable viewing.
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">📱 Mobile Friendly</h4>
                        <p className="text-sm text-slate-600">
                            All tools are fully responsive and work great on mobile devices.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Need Help */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-8 text-center">
                <h2 className="text-2xl font-semibold text-slate-800 mb-3">Need More Help?</h2>
                <p className="text-slate-600 mb-6">
                    Can't find what you're looking for? We're here to help!
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <a
                        href="/about"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Contact Us
                    </a>
                    <a
                        href="https://github.com/carthworks"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        View on GitHub
                    </a>
                </div>
            </div>
        </div>
    );
}
