"use client";

import React, { useState, useEffect } from "react";
import {
    Key,
    Copy,
    Download,
    Shield,
    AlertTriangle,
    Zap,
    Lock,
    Unlock,
    CheckCircle2,
    XCircle,
    Edit3,
    Code
} from "lucide-react";

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

// Simple Base64URL encoding/decoding
function base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}


type AttackType = "none" | "hs256-to-none" | "expired" | "admin-claim";

type AttackTemplate = {
    name: string;
    description: string;
    severity: "high" | "medium";
    header?: { alg: string; typ: string };
    modifyPayload?: (payload: any) => any;
};

const ATTACK_TEMPLATES: Record<AttackType, AttackTemplate> = {
    none: {
        name: "Algorithm None Attack",
        description: "Remove signature and set algorithm to 'none'",
        severity: "high",
        header: { alg: "none", typ: "JWT" },
    },
    "hs256-to-none": {
        name: "HS256 to None",
        description: "Change algorithm from HS256 to none",
        severity: "high",
        header: { alg: "none", typ: "JWT" },
    },
    expired: {
        name: "Expired Token",
        description: "Set expiration to past date",
        severity: "medium",
        modifyPayload: (payload: any) => ({ ...payload, exp: Math.floor(Date.now() / 1000) - 3600 }),
    },
    "admin-claim": {
        name: "Admin Privilege Escalation",
        description: "Add admin role to claims",
        severity: "high",
        modifyPayload: (payload: any) => ({ ...payload, role: "admin", isAdmin: true }),
    },
};

export default function JWTFuzzer() {
    const [inputToken, setInputToken] = useState("");
    const [header, setHeader] = useState<any>({});
    const [payload, setPayload] = useState<any>({});
    const [signature, setSignature] = useState("");
    const [selectedAttack, setSelectedAttack] = useState<AttackType>("none");
    const [modifiedToken, setModifiedToken] = useState("");
    const [copied, setCopied] = useState(false);
    const [headerJson, setHeaderJson] = useState("");
    const [payloadJson, setPayloadJson] = useState("");
    const [isValid, setIsValid] = useState(false);

    // Parse JWT on input change
    useEffect(() => {
        if (!inputToken) {
            setHeader({});
            setPayload({});
            setSignature("");
            setIsValid(false);
            return;
        }

        try {
            const parts = inputToken.split('.');
            if (parts.length !== 3) {
                setIsValid(false);
                return;
            }

            const decodedHeader = JSON.parse(base64UrlDecode(parts[0]));
            const decodedPayload = JSON.parse(base64UrlDecode(parts[1]));

            setHeader(decodedHeader);
            setPayload(decodedPayload);
            setSignature(parts[2]);
            setHeaderJson(JSON.stringify(decodedHeader, null, 2));
            setPayloadJson(JSON.stringify(decodedPayload, null, 2));
            setIsValid(true);
        } catch (error) {
            setIsValid(false);
        }
    }, [inputToken]);

    // Generate modified token
    useEffect(() => {
        if (!isValid) {
            setModifiedToken("");
            return;
        }

        try {
            let modHeader = { ...header };
            let modPayload = { ...payload };

            // Apply attack template
            const attack = ATTACK_TEMPLATES[selectedAttack];
            if (attack) {
                if (attack.header) {
                    modHeader = { ...modHeader, ...attack.header };
                }
                if (attack.modifyPayload) {
                    modPayload = attack.modifyPayload(modPayload);
                }
            }

            // Try to parse custom JSON edits
            try {
                modHeader = JSON.parse(headerJson);
            } catch { }
            try {
                modPayload = JSON.parse(payloadJson);
            } catch { }

            const encodedHeader = base64UrlEncode(JSON.stringify(modHeader));
            const encodedPayload = base64UrlEncode(JSON.stringify(modPayload));

            // For "none" algorithm, remove signature
            const newSignature = modHeader.alg === "none" ? "" : signature;

            setModifiedToken(`${encodedHeader}.${encodedPayload}.${newSignature}`);
        } catch (error) {
            setModifiedToken("");
        }
    }, [header, payload, signature, selectedAttack, headerJson, payloadJson, isValid]);

    const exampleToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoidXNlciJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-orange-200 shadow-sm">
                        <Key className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Penetration Testing</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                        JWT Fuzzer
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Test JWT security by manipulating tokens, testing algorithm confusion attacks,
                        and exploring common JWT vulnerabilities.
                    </p>
                </div>

                {/* Warning Banner */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong className="font-semibold">Ethical Use Only:</strong> This tool is for authorized security testing and educational purposes.
                            Test only on systems you own or have permission to test.
                        </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Code className="w-4 h-4 text-orange-600" />
                                Input JWT Token
                            </label>
                            <button
                                onClick={() => setInputToken(exampleToken)}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                Load Example
                            </button>
                        </div>
                        <textarea
                            value={inputToken}
                            onChange={(e) => setInputToken(e.target.value)}
                            placeholder="Paste your JWT token here..."
                            className="w-full h-32 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none font-mono text-sm"
                        />
                        {inputToken && (
                            <div className="flex items-center gap-2 text-sm">
                                {isValid ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="text-emerald-700 font-medium">Valid JWT format</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        <span className="text-red-700 font-medium">Invalid JWT format</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {isValid && (
                    <>
                        {/* Attack Templates */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-600" />
                                Attack Templates
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {Object.entries(ATTACK_TEMPLATES).map(([key, attack]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedAttack(key as AttackType)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedAttack === key
                                            ? "border-orange-500 bg-orange-50 shadow-md"
                                            : "border-slate-200 hover:border-orange-300 bg-white"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {attack.severity === "high" ? (
                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <Shield className="w-4 h-4 text-amber-600" />
                                            )}
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${attack.severity === "high"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-amber-100 text-amber-700"
                                                }`}>
                                                {attack.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="font-semibold text-slate-800 text-sm mb-1">{attack.name}</div>
                                        <div className="text-xs text-slate-600">{attack.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Token Editor */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Header Editor */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Header
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        value={headerJson}
                                        onChange={(e) => setHeaderJson(e.target.value)}
                                        className="w-full h-64 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none font-mono text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Payload Editor */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Edit3 className="w-5 h-5" />
                                        Payload (Claims)
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        value={payloadJson}
                                        onChange={(e) => setPayloadJson(e.target.value)}
                                        className="w-full h-64 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none font-mono text-sm bg-slate-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modified Token Output */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Unlock className="w-5 h-5" />
                                    Modified JWT Token
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyText(modifiedToken, () => {
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        })}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                    <button
                                        onClick={() => downloadBlob(modifiedToken, "modified-jwt.txt")}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="bg-slate-900 rounded-xl p-4">
                                    <code className="text-orange-400 font-mono text-sm break-all">
                                        {modifiedToken || "No modified token generated"}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Token Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <div className="text-blue-700 font-semibold text-sm mb-2">Header</div>
                                <div className="text-xs text-blue-600 font-mono break-all">
                                    {modifiedToken.split('.')[0] || "—"}
                                </div>
                            </div>
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                                <div className="text-purple-700 font-semibold text-sm mb-2">Payload</div>
                                <div className="text-xs text-purple-600 font-mono break-all">
                                    {modifiedToken.split('.')[1] || "—"}
                                </div>
                            </div>
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                                <div className="text-orange-700 font-semibold text-sm mb-2">Signature</div>
                                <div className="text-xs text-orange-600 font-mono break-all">
                                    {modifiedToken.split('.')[2] || "(removed)"}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Info Card */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600">
                            <strong className="text-slate-900">Common JWT Vulnerabilities:</strong> Algorithm confusion (none attack),
                            weak signing keys, missing signature verification, expired token acceptance, and insufficient claim validation.
                            Always verify signatures server-side and use strong algorithms like RS256 or ES256.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
