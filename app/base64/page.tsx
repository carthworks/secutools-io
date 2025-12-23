"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Upload, Download, Check } from "lucide-react";

type EncodingType = "base64" | "base32" | "base64url" | "hex";
type Mode = "encode" | "decode";

export default function Base64Page() {
    const [mode, setMode] = useState<Mode>("encode");
    const [encodingType, setEncodingType] = useState<EncodingType>("base64");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // Base32 alphabet
    const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    const base32Encode = (str: string): string => {
        const bytes = new TextEncoder().encode(str);
        let bits = "";
        for (const byte of bytes) {
            bits += byte.toString(2).padStart(8, "0");
        }

        let result = "";
        for (let i = 0; i < bits.length; i += 5) {
            const chunk = bits.slice(i, i + 5).padEnd(5, "0");
            result += BASE32_ALPHABET[parseInt(chunk, 2)];
        }

        // Add padding
        while (result.length % 8 !== 0) {
            result += "=";
        }

        return result;
    };

    const base32Decode = (str: string): string => {
        const cleaned = str.replace(/=/g, "").toUpperCase();
        let bits = "";

        for (const char of cleaned) {
            const index = BASE32_ALPHABET.indexOf(char);
            if (index === -1) throw new Error("Invalid Base32 character");
            bits += index.toString(2).padStart(5, "0");
        }

        const bytes: number[] = [];
        for (let i = 0; i < bits.length; i += 8) {
            if (i + 8 <= bits.length) {
                bytes.push(parseInt(bits.slice(i, i + 8), 2));
            }
        }

        return new TextDecoder().decode(new Uint8Array(bytes));
    };

    const handleConvert = () => {
        setError("");
        setOutput("");

        try {
            if (!input.trim()) {
                setError("Please enter some text");
                return;
            }

            let result = "";

            if (mode === "encode") {
                switch (encodingType) {
                    case "base64":
                        result = btoa(input);
                        break;
                    case "base64url":
                        result = btoa(input)
                            .replace(/\+/g, "-")
                            .replace(/\//g, "_")
                            .replace(/=/g, "");
                        break;
                    case "base32":
                        result = base32Encode(input);
                        break;
                    case "hex":
                        result = Array.from(new TextEncoder().encode(input))
                            .map((b) => b.toString(16).padStart(2, "0"))
                            .join("");
                        break;
                }
            } else {
                // Decode
                switch (encodingType) {
                    case "base64":
                        result = atob(input);
                        break;
                    case "base64url":
                        let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
                        while (base64.length % 4) {
                            base64 += "=";
                        }
                        result = atob(base64);
                        break;
                    case "base32":
                        result = base32Decode(input);
                        break;
                    case "hex":
                        const hexStr = input.replace(/\s/g, "");
                        if (hexStr.length % 2 !== 0) {
                            throw new Error("Invalid hex string length");
                        }
                        const bytes = [];
                        for (let i = 0; i < hexStr.length; i += 2) {
                            bytes.push(parseInt(hexStr.substr(i, 2), 16));
                        }
                        result = new TextDecoder().decode(new Uint8Array(bytes));
                        break;
                }
            }

            setOutput(result);
        } catch (err: any) {
            setError(err.message || "Conversion failed");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setInput(text);
        };
        reader.readAsText(file);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadOutput = () => {
        const blob = new Blob([output], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${mode}-${encodingType}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <section className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                    Base64/Base32 Encoder/Decoder
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Encode and decode text using Base64, Base32, Base64URL, or Hex encoding
                </p>
            </section>

            <Section title="Configuration" subtitle="Choose your encoding options">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mode
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode("encode")}
                                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mode === "encode"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                Encode
                            </button>
                            <button
                                onClick={() => setMode("decode")}
                                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mode === "decode"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                Decode
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Encoding Type
                        </label>
                        <select
                            value={encodingType}
                            onChange={(e) => setEncodingType(e.target.value as EncodingType)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="base64">Base64</option>
                            <option value="base64url">Base64 URL-Safe</option>
                            <option value="base32">Base32</option>
                            <option value="hex">Hexadecimal</option>
                        </select>
                    </div>
                </div>
            </Section>

            <Section title="Input" subtitle={mode === "encode" ? "Enter text to encode" : "Enter encoded text to decode"}>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Upload File</span>
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".txt"
                            />
                        </label>
                    </div>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "encode" ? "Enter text to encode..." : "Enter encoded text to decode..."}
                        className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />

                    <button
                        onClick={handleConvert}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        {mode === "encode" ? "Encode" : "Decode"}
                    </button>
                </div>
            </Section>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                        <strong>Error:</strong> {error}
                    </p>
                </div>
            )}

            {output && (
                <Section title="Output" subtitle="Result">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span className="text-sm">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span className="text-sm">Copy</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={downloadOutput}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-sm">Download</span>
                            </button>
                        </div>

                        <textarea
                            value={output}
                            readOnly
                            className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm"
                        />

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Output length:</strong> {output.length} characters
                            </p>
                        </div>
                    </div>
                </Section>
            )}

            <Section title="About" subtitle="Encoding information">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Base64</h3>
                        <p className="text-slate-600">
                            Standard Base64 encoding using A-Z, a-z, 0-9, +, / characters with = padding.
                            Commonly used for encoding binary data in text format.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Base64 URL-Safe</h3>
                        <p className="text-slate-600">
                            URL-safe variant that replaces + with - and / with _, removes padding.
                            Safe for use in URLs and filenames.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Base32</h3>
                        <p className="text-slate-600">
                            Uses A-Z and 2-7 characters. More human-readable than Base64,
                            case-insensitive, and avoids ambiguous characters.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Hexadecimal</h3>
                        <p className="text-slate-600">
                            Base16 encoding using 0-9 and a-f characters. Each byte is represented
                            by two hex digits.
                        </p>
                    </div>
                </div>
            </Section>
        </div>
    );
}
