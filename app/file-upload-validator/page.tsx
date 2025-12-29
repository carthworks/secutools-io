"use client";

import React, { useState, useCallback } from "react";
import {
    Upload,
    FileCheck,
    AlertTriangle,
    Shield,
    Copy,
    Download,
    CheckCircle2,
    XCircle,
    Info,
    FileWarning,
    Zap
} from "lucide-react";

type FileAnalysis = {
    name: string;
    size: number;
    type: string;
    extension: string;
    magicBytes: string;
    actualType: string;
    isSpoofed: boolean;
    securityScore: number;
    vulnerabilities: string[];
    recommendations: string[];
};

// Common file signatures (magic bytes)
const FILE_SIGNATURES: Record<string, { bytes: string; type: string }> = {
    "FFD8FF": { bytes: "FF D8 FF", type: "image/jpeg" },
    "89504E47": { bytes: "89 50 4E 47", type: "image/png" },
    "474946383": { bytes: "47 49 46 38", type: "image/gif" },
    "25504446": { bytes: "25 50 44 46", type: "application/pdf" },
    "504B0304": { bytes: "50 4B 03 04", type: "application/zip" },
    "D0CF11E0": { bytes: "D0 CF 11 E0", type: "application/msword" },
    "3C3F786D6C": { bytes: "3C 3F 78 6D 6C", type: "text/xml" },
    "7B5C727466": { bytes: "7B 5C 72 74 66", type: "application/rtf" },
};

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

function getScoreColor(score: number) {
    if (score >= 80) return "from-emerald-500 to-teal-600";
    if (score >= 60) return "from-blue-500 to-indigo-600";
    if (score >= 40) return "from-amber-500 to-orange-600";
    return "from-red-500 to-pink-600";
}

function getScoreLabel(score: number) {
    if (score >= 80) return "Secure";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate Risk";
    return "High Risk";
}

export default function FileUploadValidator() {
    const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);

    const analyzeFile = useCallback(async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase() || "";
        const vulnerabilities: string[] = [];
        const recommendations: string[] = [];
        let securityScore = 100;

        // Read first 8 bytes for magic number detection
        const buffer = await file.slice(0, 8).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const magicBytes = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');

        // Detect actual file type from magic bytes
        let actualType = "unknown";
        const hexStart = Array.from(bytes.slice(0, 4))
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join('');

        for (const [sig, info] of Object.entries(FILE_SIGNATURES)) {
            if (hexStart.startsWith(sig.substring(0, 8))) {
                actualType = info.type;
                break;
            }
        }

        // Check for MIME type spoofing
        const isSpoofed = actualType !== "unknown" && actualType !== file.type && file.type !== "";
        if (isSpoofed) {
            vulnerabilities.push(`MIME type spoofing detected: Declared as ${file.type} but appears to be ${actualType}`);
            securityScore -= 30;
        }

        // Check file extension
        const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'jar', 'app', 'deb', 'rpm'];
        if (dangerousExtensions.includes(extension)) {
            vulnerabilities.push(`Dangerous file extension: .${extension} - executable files pose security risks`);
            securityScore -= 25;
        }

        // Check for double extensions
        const parts = file.name.split('.');
        if (parts.length > 2) {
            vulnerabilities.push("Multiple file extensions detected - possible obfuscation attempt");
            securityScore -= 15;
        }

        // Check file size
        if (file.size > 50 * 1024 * 1024) {
            vulnerabilities.push("File size exceeds 50MB - potential DoS risk");
            securityScore -= 10;
        }

        // Check for null bytes in filename
        if (file.name.includes('\0')) {
            vulnerabilities.push("Null byte detected in filename - possible path traversal attempt");
            securityScore -= 20;
        }

        // Check for path traversal
        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
            vulnerabilities.push("Path traversal characters detected in filename");
            securityScore -= 20;
        }

        // Recommendations
        if (!isSpoofed) {
            recommendations.push("MIME type matches file signature - good");
        } else {
            recommendations.push("Validate file content server-side, not just extension");
        }

        if (file.size < 10 * 1024 * 1024) {
            recommendations.push("File size is reasonable");
        } else {
            recommendations.push("Consider implementing file size limits");
        }

        recommendations.push("Store uploaded files outside web root");
        recommendations.push("Rename files to prevent execution");
        recommendations.push("Scan files with antivirus before processing");

        setAnalysis({
            name: file.name,
            size: file.size,
            type: file.type || "unknown",
            extension,
            magicBytes,
            actualType,
            isSpoofed,
            securityScore: Math.max(0, securityScore),
            vulnerabilities,
            recommendations,
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) analyzeFile(file);
    }, [analyzeFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) analyzeFile(file);
    }, [analyzeFile]);

    function exportReport() {
        if (!analysis) return;
        const report = `# File Upload Security Analysis

**Filename:** ${analysis.name}
**Size:** ${(analysis.size / 1024).toFixed(2)} KB
**Declared Type:** ${analysis.type}
**Actual Type:** ${analysis.actualType}
**Extension:** .${analysis.extension}
**Magic Bytes:** ${analysis.magicBytes}
**Security Score:** ${analysis.securityScore}/100 (${getScoreLabel(analysis.securityScore)})
**MIME Spoofing:** ${analysis.isSpoofed ? "YES - CRITICAL" : "No"}

## Vulnerabilities (${analysis.vulnerabilities.length})
${analysis.vulnerabilities.map((v, i) => `${i + 1}. ${v}`).join("\n")}

## Recommendations (${analysis.recommendations.length})
${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

---
Generated by SecuTools.io File Upload Validator
`;
        downloadBlob(report, "file-upload-analysis.md", "text/markdown");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-sky-200 shadow-sm">
                        <Upload className="w-5 h-5 text-sky-600" />
                        <span className="text-sm font-medium text-sky-900">Penetration Testing</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        File Upload Validator
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Analyze uploaded files for security risks including MIME spoofing, dangerous extensions,
                        and malicious content. Validate before processing.
                    </p>
                </div>

                {/* Upload Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-dashed transition-all p-12 ${isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300"
                        }`}
                >
                    <div className="text-center space-y-4">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isDragging ? "bg-sky-100" : "bg-slate-100"
                            }`}>
                            <Upload className={`w-10 h-10 ${isDragging ? "text-sky-600" : "text-slate-400"}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                Drop a file here or click to upload
                            </h3>
                            <p className="text-sm text-slate-600">
                                Upload any file to analyze its security properties
                            </p>
                        </div>
                        <label className="inline-block">
                            <input
                                type="file"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                            <span className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer inline-block">
                                Choose File
                            </span>
                        </label>
                    </div>
                </div>

                {/* Analysis Results */}
                {analysis && (
                    <>
                        {/* Security Score */}
                        <div className={`bg-gradient-to-r ${getScoreColor(analysis.securityScore)} rounded-2xl p-8 text-white shadow-xl`}>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <div className="text-white/80 text-sm font-medium mb-1">Security Score</div>
                                    <div className="text-5xl font-bold">{analysis.securityScore}/100</div>
                                    <div className="text-white/90 text-lg font-semibold mt-1">{getScoreLabel(analysis.securityScore)}</div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{analysis.vulnerabilities.length}</div>
                                        <div className="text-white/80 text-sm">Issues</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{analysis.isSpoofed ? "YES" : "NO"}</div>
                                        <div className="text-white/80 text-sm">Spoofed</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Details */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-blue-600">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FileCheck className="w-5 h-5" />
                                    File Analysis
                                </h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Filename</div>
                                    <div className="text-sm text-slate-800 font-mono break-all">{analysis.name}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <div className="text-xs text-slate-500 font-medium mb-1">File Size</div>
                                    <div className="text-sm text-slate-800 font-semibold">{(analysis.size / 1024).toFixed(2)} KB</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Declared MIME Type</div>
                                    <div className="text-sm text-slate-800 font-mono">{analysis.type}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Actual Type (Magic Bytes)</div>
                                    <div className="text-sm text-slate-800 font-mono">{analysis.actualType}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Extension</div>
                                    <div className="text-sm text-slate-800 font-semibold">.{analysis.extension}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Magic Bytes (First 8)</div>
                                    <div className="text-sm text-slate-800 font-mono">{analysis.magicBytes}</div>
                                </div>
                            </div>
                        </div>

                        {/* Vulnerabilities */}
                        {analysis.vulnerabilities.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Security Issues ({analysis.vulnerabilities.length})
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    {analysis.vulnerabilities.map((vuln, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-red-800">{vuln}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Security Recommendations ({analysis.recommendations.length})
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {analysis.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800">{rec}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Export */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => copyText(JSON.stringify(analysis, null, 2), () => {
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                })}
                                className="px-6 py-3 bg-white border-2 border-slate-300 hover:border-sky-400 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? "Copied!" : "Copy JSON"}
                            </button>
                            <button
                                onClick={exportReport}
                                className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </>
                )}

                {/* Info Card */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600">
                            <strong className="text-slate-900">File Upload Security:</strong> Always validate files server-side.
                            Check magic bytes, not just extensions. Store uploads outside web root. Rename files to prevent execution.
                            Scan with antivirus. Implement size limits and content type validation.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
