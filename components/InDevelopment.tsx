"use client";
import { Construction, Clock, Rocket, Code, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InDevelopmentProps {
    toolName?: string;
    estimatedDate?: string;
    features?: string[];
}

export default function InDevelopment({
    toolName = "This Tool",
    estimatedDate,
    features = [],
}: InDevelopmentProps) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-8 md:p-12 text-center relative overflow-hidden transition-colors">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-full blur-3xl -z-0" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-100/50 to-pink-100/50 dark:from-indigo-950/20 dark:to-pink-950/20 rounded-full blur-3xl -z-0" />

                    <div className="relative z-10">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                            <Construction className="w-10 h-10 text-white" />
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            In Development
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{toolName}</span> is
                            currently under construction
                        </p>

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white dark:bg-slate-900/80 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">Status</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Building</p>
                            </div>

                            {estimatedDate && (
                                <div className="bg-white dark:bg-slate-900/80 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">ETA</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{estimatedDate}</p>
                                </div>
                            )}

                            <div className="bg-white dark:bg-slate-900/80 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Rocket className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">Priority</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">High</p>
                            </div>
                        </div>

                        {/* Features List */}
                        {features.length > 0 && (
                            <div className="bg-white dark:bg-slate-900/80 rounded-lg p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 text-left transition-colors">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-center">
                                    🚀 Planned Features
                                </h3>
                                <ul className="space-y-2">
                                    {features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-blue-50 dark:bg-indigo-950/40 rounded-lg p-4 border border-blue-200 dark:border-indigo-800/50 mb-8 transition-colors">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                💡 <strong>Good news!</strong> This tool is actively being developed. Check back
                                soon for updates, or explore our other security tools in the meantime.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Home
                            </Link>
                            <Link
                                href="/tools"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
                            >
                                Browse All Tools
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Want to be notified when this tool launches?{" "}
                        <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Contact us
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
