"use client";

import React, { useState, useEffect } from "react";
import forge from "node-forge";
import { AlertTriangle, Check, Info, ArrowRight } from "lucide-react";
import Link from "next/link";

// Example MD5 collision (128 bytes each, represented as hex)
// Source: https://crypto.stackexchange.com/questions/1434/are-there-two-known-strings-which-have-the-same-md5-hash
const COLLISION_A_HEX =
    "d131dd02c5e6eec4693d9a0698aff95c2fcab58712467eab4004583eb8fb7f8955ad340609f4b30283e488832571415a085125e8f7cdc99fd91dbdf280373c5bd8823e3156348f5bae6dacd436c919c6dd53e2b487da03fd02396306d248cda0e99f33420f577ee8ce54b67080a80d1ec69821bcb6a8839396f9652b6ff72a70";
const COLLISION_B_HEX =
    "d131dd02c5e6eec4693d9a0698aff95c2fcab50712467eab4004583eb8fb7f8955ad340609f4b30283e488832571415a085125e8f7cdc99fd91dbdf280373c5bd8823e3156348f5bae6dacd436c919c6dd53e23487da03fd02396306d248cda0e99f33420f577ee8ce54b67080a80d1ec69821bcb6a8839396f9652b6ff72a70";

export default function HashCollisionPage() {
    const [hashA, setHashA] = useState<string>("");
    const [hashB, setHashB] = useState<string>("");
    const [calculating, setCalculating] = useState(false);

    // Function to calculate MD5 from hex string
    const calculateMD5 = (hexInput: string) => {
        const md5 = forge.md.md5.create();
        // Convert hex string to bytes
        const bytes = forge.util.hexToBytes(hexInput);
        md5.update(bytes);
        return md5.digest().toHex();
    };

    const handleVerify = () => {
        setCalculating(true);
        setTimeout(() => {
            const hA = calculateMD5(COLLISION_A_HEX);
            const hB = calculateMD5(COLLISION_B_HEX);
            setHashA(hA);
            setHashB(hB);
            setCalculating(false);
        }, 500); // Fake delay for effect
    };

    // Highlight differences
    const renderDiff = (hex1: string, hex2: string) => {
        const elements = [];
        for (let i = 0; i < hex1.length; i += 2) {
            const byte1 = hex1.substr(i, 2);
            const byte2 = hex2.substr(i, 2);
            if (byte1 !== byte2) {
                elements.push(
                    <span key={i} className="bg-red-200 text-red-800 font-bold px-0.5 rounded">
                        {byte1}
                    </span>
                );
            } else {
                elements.push(<span key={i}>{byte1}</span>);
            }
            // Add space every 2 bytes for readability (optional, maybe every 16 bytes)
            if ((i + 2) % 32 === 0) elements.push(" ");
        }
        return elements;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    Hash Collision Demo
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                    A hash collision occurs when two <strong>different</strong> inputs produce the <strong>same</strong> hash output.
                    This is catastrophic for security, as it allows attackers to forge signatures or bypass integrity checks.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Input A */}
                <div className="space-y-3">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                        <span>Input Block A (Hex)</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">128 bytes</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs break-all leading-relaxed text-slate-600 dark:text-slate-400">
                        {renderDiff(COLLISION_A_HEX, COLLISION_B_HEX)}
                    </div>
                </div>

                {/* Input B */}
                <div className="space-y-3">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                        <span>Input Block B (Hex)</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">128 bytes</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs break-all leading-relaxed text-slate-600 dark:text-slate-400">
                        {renderDiff(COLLISION_B_HEX, COLLISION_A_HEX)}
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleVerify}
                    disabled={calculating}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {calculating ? "Calculating..." : "Calculate MD5 Hashes"}
                    {!calculating && <ArrowRight className="w-4 h-4" />}
                </button>
            </div>

            {/* Results */}
            {(hashA || calculating) && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-semibold mb-4">Result</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">MD5(Block A)</div>
                            <div className="font-mono text-xl sm:text-2xl text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                {hashA || "..."}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">MD5(Block B)</div>
                            <div className="font-mono text-xl sm:text-2xl text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                {hashB || "..."}
                            </div>
                        </div>

                        {hashA && hashA === hashB && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-red-700 dark:text-red-300">Collision Verified!</div>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        Despite having different content (see highlighted bytes above), both blocks produce the exact same MD5 hash.
                                        This is why MD5 is considered <strong>broken</strong> and should never be used for security signatures.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="mb-2">
                        <strong>Why does this happen?</strong> MD5 produces a 128-bit output. By the Pigeonhole Principle, collisions must exist because there are more possible inputs than outputs. However, finding them should be computationally infeasible.
                    </p>
                    <p>
                        Researchers found mathematical weaknesses in MD5 (differential cryptanalysis) that allow generating collisions in seconds rather than billions of years.
                    </p>
                </div>
            </div>
        </div>
    );
}
