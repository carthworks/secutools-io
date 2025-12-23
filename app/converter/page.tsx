"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Check, ArrowRightLeft } from "lucide-react";

type Format = "text" | "unicode" | "hex" | "binary" | "decimal" | "octal" | "base64";

export default function ConverterPage() {
    const [inputFormat, setInputFormat] = useState<Format>("text");
    const [outputFormat, setOutputFormat] = useState<Format>("hex");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const formats: { value: Format; label: string }[] = [
        { value: "text", label: "Text (UTF-8)" },
        { value: "unicode", label: "Unicode (U+XXXX)" },
        { value: "hex", label: "Hexadecimal" },
        { value: "binary", label: "Binary" },
        { value: "decimal", label: "Decimal" },
        { value: "octal", label: "Octal" },
        { value: "base64", label: "Base64" },
    ];

    // Convert from text to bytes
    const textToBytes = (text: string): number[] => {
        return Array.from(new TextEncoder().encode(text));
    };

    // Convert from bytes to text
    const bytesToText = (bytes: number[]): string => {
        return new TextDecoder().decode(new Uint8Array(bytes));
    };

    // Parse input based on format
    const parseInput = (input: string, format: Format): number[] => {
        switch (format) {
            case "text":
                return textToBytes(input);

            case "unicode":
                // Parse U+XXXX format
                const unicodeMatches = input.match(/U\+[0-9A-Fa-f]+/g) || [];
                const codePoints = unicodeMatches.map((u) => parseInt(u.slice(2), 16));
                return textToBytes(String.fromCodePoint(...codePoints));

            case "hex":
                const hexStr = input.replace(/[^0-9A-Fa-f]/g, "");
                if (hexStr.length % 2 !== 0) throw new Error("Invalid hex string length");
                const bytes: number[] = [];
                for (let i = 0; i < hexStr.length; i += 2) {
                    bytes.push(parseInt(hexStr.substr(i, 2), 16));
                }
                return bytes;

            case "binary":
                const binStr = input.replace(/[^01]/g, "");
                if (binStr.length % 8 !== 0) throw new Error("Binary string must be multiple of 8 bits");
                const binBytes: number[] = [];
                for (let i = 0; i < binStr.length; i += 8) {
                    binBytes.push(parseInt(binStr.substr(i, 8), 2));
                }
                return binBytes;

            case "decimal":
                return input
                    .split(/[\s,]+/)
                    .filter((s) => s.trim())
                    .map((s) => {
                        const num = parseInt(s.trim(), 10);
                        if (isNaN(num) || num < 0 || num > 255) {
                            throw new Error(`Invalid decimal byte: ${s}`);
                        }
                        return num;
                    });

            case "octal":
                return input
                    .split(/[\s,]+/)
                    .filter((s) => s.trim())
                    .map((s) => {
                        const num = parseInt(s.trim(), 8);
                        if (isNaN(num) || num < 0 || num > 255) {
                            throw new Error(`Invalid octal byte: ${s}`);
                        }
                        return num;
                    });

            case "base64":
                const decoded = atob(input.replace(/\s/g, ""));
                return Array.from(decoded, (c) => c.charCodeAt(0));

            default:
                throw new Error("Unsupported input format");
        }
    };

    // Format output based on format
    const formatOutput = (bytes: number[], format: Format): string => {
        switch (format) {
            case "text":
                return bytesToText(bytes);

            case "unicode":
                const text = bytesToText(bytes);
                return Array.from(text)
                    .map((char) => `U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`)
                    .join(" ");

            case "hex":
                return bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ");

            case "binary":
                return bytes.map((b) => b.toString(2).padStart(8, "0")).join(" ");

            case "decimal":
                return bytes.join(", ");

            case "octal":
                return bytes.map((b) => b.toString(8).padStart(3, "0")).join(" ");

            case "base64":
                return btoa(String.fromCharCode(...bytes));

            default:
                throw new Error("Unsupported output format");
        }
    };

    const handleConvert = () => {
        setError("");
        setOutput("");

        try {
            if (!input.trim()) {
                setError("Please enter some input");
                return;
            }

            const bytes = parseInput(input, inputFormat);
            const result = formatOutput(bytes, outputFormat);
            setOutput(result);
        } catch (err: any) {
            setError(err.message || "Conversion failed");
        }
    };

    const swapFormats = () => {
        const temp = inputFormat;
        setInputFormat(outputFormat);
        setOutputFormat(temp);
        setInput(output);
        setOutput("");
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
        a.download = `converted-${outputFormat}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Get example for current input format
    const getExample = (format: Format): string => {
        const examples: Record<Format, string> = {
            text: "Hello World",
            unicode: "U+0048 U+0065 U+006C U+006C U+006F",
            hex: "48 65 6c 6c 6f",
            binary: "01001000 01100101 01101100 01101100 01101111",
            decimal: "72, 101, 108, 108, 111",
            octal: "110 145 154 154 157",
            base64: "SGVsbG8gV29ybGQ=",
        };
        return examples[format];
    };

    return (
        <div className="space-y-8">
            <section className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                    Unicode/Hex/Binary Converter
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Convert between Text, Unicode, Hexadecimal, Binary, Decimal, Octal, and Base64
                </p>
            </section>

            <Section title="Conversion Settings" subtitle="Choose input and output formats">
                <div className="grid md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Input Format
                        </label>
                        <select
                            value={inputFormat}
                            onChange={(e) => setInputFormat(e.target.value as Format)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {formats.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={swapFormats}
                            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                            title="Swap formats"
                        >
                            <ArrowRightLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Output Format
                        </label>
                        <select
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value as Format)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {formats.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Section>

            <Section title="Input" subtitle={`Enter ${formats.find((f) => f.value === inputFormat)?.label}`}>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-slate-600">
                            Example: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{getExample(inputFormat)}</code>
                        </label>
                    </div>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Enter ${formats.find((f) => f.value === inputFormat)?.label.toLowerCase()}...`}
                        className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />

                    <button
                        onClick={handleConvert}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Convert
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
                <Section title="Output" subtitle={`Result in ${formats.find((f) => f.value === outputFormat)?.label}`}>
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

            <Section title="Format Reference" subtitle="Understanding different formats">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Text (UTF-8)</h3>
                        <p className="text-slate-600 mb-2">
                            Standard text encoding. Each character can be 1-4 bytes.
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: Hello</code>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Unicode</h3>
                        <p className="text-slate-600 mb-2">
                            Unicode code points in U+XXXX format.
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: U+0048 U+0065</code>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Hexadecimal</h3>
                        <p className="text-slate-600 mb-2">
                            Base-16 representation. Each byte is 2 hex digits (0-9, A-F).
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: 48 65 6c 6c 6f</code>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Binary</h3>
                        <p className="text-slate-600 mb-2">
                            Base-2 representation. Each byte is 8 bits (0 or 1).
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: 01001000</code>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Decimal</h3>
                        <p className="text-slate-600 mb-2">
                            Base-10 representation. Each byte is 0-255.
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: 72, 101, 108</code>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Octal</h3>
                        <p className="text-slate-600 mb-2">
                            Base-8 representation. Each byte is 3 octal digits (0-7).
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: 110 145 154</code>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Base64</h3>
                        <p className="text-slate-600 mb-2">
                            Binary-to-text encoding using A-Z, a-z, 0-9, +, /.
                        </p>
                        <code className="text-xs bg-white px-2 py-1 rounded">Example: SGVsbG8=</code>
                    </div>
                </div>
            </Section>

            <Section title="Common Use Cases" subtitle="When to use each format">
                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <span className="font-semibold text-slate-800 min-w-[120px]">Hex:</span>
                        <span className="text-slate-600">
                            Debugging, memory dumps, color codes, MAC addresses
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-semibold text-slate-800 min-w-[120px]">Binary:</span>
                        <span className="text-slate-600">
                            Low-level programming, bit manipulation, network protocols
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-semibold text-slate-800 min-w-[120px]">Unicode:</span>
                        <span className="text-slate-600">
                            Internationalization, emoji analysis, character encoding issues
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-semibold text-slate-800 min-w-[120px]">Base64:</span>
                        <span className="text-slate-600">
                            Email attachments, data URLs, embedding binary in JSON/XML
                        </span>
                    </div>
                </div>
            </Section>
        </div>
    );
}
