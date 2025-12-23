"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Key, Lock, Unlock, Check } from "lucide-react";

type Algorithm = "AES-GCM" | "AES-CBC" | "RSA-OAEP";
type Mode = "encrypt" | "decrypt";

export default function AESRSAPage() {
    const [algorithm, setAlgorithm] = useState<Algorithm>("AES-GCM");
    const [mode, setMode] = useState<Mode>("encrypt");
    const [message, setMessage] = useState("");
    const [password, setPassword] = useState("");
    const [rsaPublicKey, setRsaPublicKey] = useState("");
    const [rsaPrivateKey, setRsaPrivateKey] = useState("");
    const [output, setOutput] = useState("");
    const [iv, setIv] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [generatedPublicKey, setGeneratedPublicKey] = useState("");
    const [generatedPrivateKey, setGeneratedPrivateKey] = useState("");

    // Generate AES key from password
    const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: algorithm.startsWith("AES") ? algorithm : "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    };

    // Generate RSA key pair
    const generateRSAKeyPair = async () => {
        setError("");
        setLoading(true);

        try {
            const keyPair = await crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
            const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

            setGeneratedPublicKey(JSON.stringify(publicKeyJwk, null, 2));
            setGeneratedPrivateKey(JSON.stringify(privateKeyJwk, null, 2));
        } catch (err: any) {
            setError(err.message || "Key generation failed");
        } finally {
            setLoading(false);
        }
    };

    // AES Encryption
    const encryptAES = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !password) {
                throw new Error("Please enter message and password");
            }

            const enc = new TextEncoder();
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const ivBytes = crypto.getRandomValues(new Uint8Array(12));

            const key = await deriveKey(password, salt);
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: algorithm,
                    iv: ivBytes,
                },
                key,
                enc.encode(message)
            );

            // Combine salt + iv + encrypted data
            const combined = new Uint8Array(salt.length + ivBytes.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(ivBytes, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + ivBytes.length);

            const base64 = btoa(String.fromCharCode(...combined));
            setOutput(base64);
            setIv(btoa(String.fromCharCode(...ivBytes)));
        } catch (err: any) {
            setError(err.message || "Encryption failed");
        } finally {
            setLoading(false);
        }
    };

    // AES Decryption
    const decryptAES = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !password) {
                throw new Error("Please enter encrypted message and password");
            }

            const combined = Uint8Array.from(atob(message), (c) => c.charCodeAt(0));

            const salt = combined.slice(0, 16);
            const ivBytes = combined.slice(16, 28);
            const encrypted = combined.slice(28);

            const key = await deriveKey(password, salt);
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: algorithm,
                    iv: ivBytes,
                },
                key,
                encrypted
            );

            const dec = new TextDecoder();
            setOutput(dec.decode(decrypted));
        } catch (err: any) {
            setError(err.message || "Decryption failed. Wrong password or corrupted data.");
        } finally {
            setLoading(false);
        }
    };

    // RSA Encryption
    const encryptRSA = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !rsaPublicKey) {
                throw new Error("Please enter message and public key");
            }

            const publicKeyJwk = JSON.parse(rsaPublicKey);
            const publicKey = await crypto.subtle.importKey(
                "jwk",
                publicKeyJwk,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );

            const enc = new TextEncoder();
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                publicKey,
                enc.encode(message)
            );

            const base64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
            setOutput(base64);
        } catch (err: any) {
            setError(err.message || "Encryption failed");
        } finally {
            setLoading(false);
        }
    };

    // RSA Decryption
    const decryptRSA = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !rsaPrivateKey) {
                throw new Error("Please enter encrypted message and private key");
            }

            const privateKeyJwk = JSON.parse(rsaPrivateKey);
            const privateKey = await crypto.subtle.importKey(
                "jwk",
                privateKeyJwk,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["decrypt"]
            );

            const encrypted = Uint8Array.from(atob(message), (c) => c.charCodeAt(0));
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP",
                },
                privateKey,
                encrypted
            );

            const dec = new TextDecoder();
            setOutput(dec.decode(decrypted));
        } catch (err: any) {
            setError(err.message || "Decryption failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEncryptDecrypt = () => {
        if (algorithm.startsWith("AES")) {
            if (mode === "encrypt") {
                encryptAES();
            } else {
                decryptAES();
            }
        } else {
            if (mode === "encrypt") {
                encryptRSA();
            } else {
                decryptRSA();
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadOutput = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <section className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">
                    AES/RSA Encryptor
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Client-side encryption and decryption using AES and RSA algorithms
                </p>
            </section>

            <Section title="Configuration" subtitle="Choose encryption settings">
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Algorithm</label>
                        <select
                            value={algorithm}
                            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="AES-GCM">AES-GCM (Recommended)</option>
                            <option value="AES-CBC">AES-CBC</option>
                            <option value="RSA-OAEP">RSA-OAEP</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Mode</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode("encrypt")}
                                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mode === "encrypt"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <Lock className="w-4 h-4 inline mr-2" />
                                Encrypt
                            </button>
                            <button
                                onClick={() => setMode("decrypt")}
                                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mode === "decrypt"
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <Unlock className="w-4 h-4 inline mr-2" />
                                Decrypt
                            </button>
                        </div>
                    </div>

                    {algorithm === "RSA-OAEP" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                RSA Key Pair
                            </label>
                            <button
                                onClick={generateRSAKeyPair}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400"
                            >
                                <Key className="w-4 h-4 inline mr-2" />
                                Generate Keys
                            </button>
                        </div>
                    )}
                </div>
            </Section>

            {/* RSA Key Generation Output */}
            {generatedPublicKey && (
                <Section title="Generated RSA Keys" subtitle="Save these keys securely">
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700">Public Key (JWK)</label>
                                <button
                                    onClick={() => copyToClipboard(generatedPublicKey)}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    Copy
                                </button>
                            </div>
                            <textarea
                                value={generatedPublicKey}
                                readOnly
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Private Key (JWK) - Keep Secret!
                                </label>
                                <button
                                    onClick={() => copyToClipboard(generatedPrivateKey)}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    Copy
                                </button>
                            </div>
                            <textarea
                                value={generatedPrivateKey}
                                readOnly
                                className="w-full h-32 px-4 py-2 border border-red-300 rounded-lg bg-red-50 font-mono text-xs"
                            />
                            <p className="text-xs text-red-600 mt-1">
                                ⚠️ Never share your private key!
                            </p>
                        </div>
                    </div>
                </Section>
            )}

            {/* Input Section */}
            <Section
                title={mode === "encrypt" ? "Message to Encrypt" : "Encrypted Message"}
                subtitle={mode === "encrypt" ? "Enter your plaintext message" : "Enter encrypted data"}
            >
                <div className="space-y-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            mode === "encrypt"
                                ? "Enter message to encrypt..."
                                : "Enter encrypted message (Base64)..."
                        }
                        className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />

                    {algorithm.startsWith("AES") && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter encryption password"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {algorithm === "RSA-OAEP" && mode === "encrypt" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Public Key (JWK)
                            </label>
                            <textarea
                                value={rsaPublicKey}
                                onChange={(e) => setRsaPublicKey(e.target.value)}
                                placeholder="Paste public key JSON here..."
                                className="w-full h-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>
                    )}

                    {algorithm === "RSA-OAEP" && mode === "decrypt" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Private Key (JWK)
                            </label>
                            <textarea
                                value={rsaPrivateKey}
                                onChange={(e) => setRsaPrivateKey(e.target.value)}
                                placeholder="Paste private key JSON here..."
                                className="w-full h-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleEncryptDecrypt}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400"
                    >
                        {loading ? "Processing..." : mode === "encrypt" ? "Encrypt" : "Decrypt"}
                    </button>
                </div>
            </Section>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                        <strong>Error:</strong> {error}
                    </p>
                </div>
            )}

            {/* Output Display */}
            {output && (
                <Section title="Result" subtitle={mode === "encrypt" ? "Encrypted data" : "Decrypted message"}>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={() => copyToClipboard(output)}
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
                                onClick={() => downloadOutput(output, mode === "encrypt" ? "encrypted.txt" : "decrypted.txt")}
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

            {/* Info Section */}
            <Section title="About Encryption" subtitle="Algorithm information">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">AES-GCM</h3>
                        <p className="text-slate-600">
                            Advanced Encryption Standard with Galois/Counter Mode. Provides both encryption
                            and authentication. Recommended for most use cases.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">AES-CBC</h3>
                        <p className="text-slate-600">
                            AES with Cipher Block Chaining mode. Classic symmetric encryption algorithm.
                            Requires separate authentication.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">RSA-OAEP</h3>
                        <p className="text-slate-600">
                            Asymmetric encryption using RSA with Optimal Asymmetric Encryption Padding.
                            Slower but allows encryption without sharing keys.
                        </p>
                    </div>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>⚠️ Security Note:</strong> All encryption happens client-side in your browser.
                        Your keys and data never leave your device. However, for production use, consider
                        using established libraries and proper key management systems.
                    </p>
                </div>
            </Section>
        </div>
    );
}
