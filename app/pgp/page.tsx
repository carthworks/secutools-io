"use client";

import { useState } from "react";
import Section from "@/components/Section";
import { Copy, Download, Key, Lock, Unlock, Check } from "lucide-react";
import * as openpgp from "openpgp";

type Tab = "generate" | "encrypt" | "decrypt" | "sign" | "verify";

export default function PGPPage() {
    const [activeTab, setActiveTab] = useState<Tab>("generate");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [publicKey, setPublicKey] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [message, setMessage] = useState("");
    const [recipientPublicKey, setRecipientPublicKey] = useState("");
    const [senderPrivateKey, setSenderPrivateKey] = useState("");
    const [output, setOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const generateKeyPair = async () => {
        setError("");
        setLoading(true);

        try {
            if (!name || !email) {
                throw new Error("Please enter name and email");
            }

            const { privateKey: privKey, publicKey: pubKey } = await openpgp.generateKey({
                type: "rsa",
                rsaBits: 2048,
                userIDs: [{ name, email }],
                passphrase: passphrase || undefined,
            });

            setPrivateKey(privKey);
            setPublicKey(pubKey);
        } catch (err: any) {
            setError(err.message || "Key generation failed");
        } finally {
            setLoading(false);
        }
    };

    const encryptMessage = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !recipientPublicKey) {
                throw new Error("Please enter message and recipient's public key");
            }

            const pubKey = await openpgp.readKey({ armoredKey: recipientPublicKey });

            const encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: message }),
                encryptionKeys: pubKey,
            });

            setOutput(encrypted as string);
        } catch (err: any) {
            setError(err.message || "Encryption failed");
        } finally {
            setLoading(false);
        }
    };

    const decryptMessage = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !senderPrivateKey) {
                throw new Error("Please enter encrypted message and your private key");
            }

            const privKey = await openpgp.decryptKey({
                privateKey: await openpgp.readPrivateKey({ armoredKey: senderPrivateKey }),
                passphrase: passphrase || undefined,
            });

            const encryptedMessage = await openpgp.readMessage({
                armoredMessage: message,
            });

            const { data: decrypted } = await openpgp.decrypt({
                message: encryptedMessage,
                decryptionKeys: privKey,
            });

            setOutput(decrypted as string);
        } catch (err: any) {
            setError(err.message || "Decryption failed");
        } finally {
            setLoading(false);
        }
    };

    const signMessage = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !senderPrivateKey) {
                throw new Error("Please enter message and your private key");
            }

            const privKey = await openpgp.decryptKey({
                privateKey: await openpgp.readPrivateKey({ armoredKey: senderPrivateKey }),
                passphrase: passphrase || undefined,
            });

            const signed = await openpgp.sign({
                message: await openpgp.createCleartextMessage({ text: message }),
                signingKeys: privKey,
            });

            setOutput(signed as string);
        } catch (err: any) {
            setError(err.message || "Signing failed");
        } finally {
            setLoading(false);
        }
    };

    const verifyMessage = async () => {
        setError("");
        setOutput("");
        setLoading(true);

        try {
            if (!message || !recipientPublicKey) {
                throw new Error("Please enter signed message and signer's public key");
            }

            const pubKey = await openpgp.readKey({ armoredKey: recipientPublicKey });
            const signedMessage = await openpgp.readCleartextMessage({
                cleartextMessage: message,
            });

            const verification = await openpgp.verify({
                message: signedMessage,
                verificationKeys: pubKey,
            });

            const { verified } = verification.signatures[0];
            await verified;

            setOutput("✅ Signature verified successfully!\n\nOriginal message:\n" + signedMessage.getText());
        } catch (err: any) {
            setError(err.message || "Verification failed");
            setOutput("❌ Signature verification failed");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadKey = (content: string, filename: string) => {
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
                    PGP Key Generator & Encryptor
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Generate PGP key pairs, encrypt/decrypt messages, and sign/verify signatures
                </p>
            </section>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200">
                {[
                    { id: "generate", label: "Generate Keys", icon: Key },
                    { id: "encrypt", label: "Encrypt", icon: Lock },
                    { id: "decrypt", label: "Decrypt", icon: Unlock },
                    { id: "sign", label: "Sign", icon: Key },
                    { id: "verify", label: "Verify", icon: Check },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeTab === tab.id
                                    ? "border-indigo-600 text-indigo-600 font-medium"
                                    : "border-transparent text-slate-600 hover:text-slate-800"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Generate Keys Tab */}
            {activeTab === "generate" && (
                <Section title="Generate PGP Key Pair" subtitle="Create new public and private keys">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Passphrase (optional)
                            </label>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                placeholder="Leave empty for no passphrase"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={generateKeyPair}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400"
                        >
                            {loading ? "Generating..." : "Generate Key Pair"}
                        </button>

                        {publicKey && (
                            <div className="space-y-4 mt-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-700">Public Key</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(publicKey)}
                                                className="text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => downloadKey(publicKey, "public-key.asc")}
                                                className="text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={publicKey}
                                        readOnly
                                        className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Private Key (Keep Secret!)
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(privateKey)}
                                                className="text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                Copy
                                            </button>
                                            <button
                                                onClick={() => downloadKey(privateKey, "private-key.asc")}
                                                className="text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={privateKey}
                                        readOnly
                                        className="w-full h-32 px-4 py-2 border border-red-300 rounded-lg bg-red-50 font-mono text-xs"
                                    />
                                    <p className="text-xs text-red-600 mt-1">
                                        ⚠️ Never share your private key with anyone!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Section>
            )}

            {/* Encrypt Tab */}
            {activeTab === "encrypt" && (
                <Section title="Encrypt Message" subtitle="Encrypt a message with recipient's public key">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter message to encrypt..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Recipient's Public Key
                            </label>
                            <textarea
                                value={recipientPublicKey}
                                onChange={(e) => setRecipientPublicKey(e.target.value)}
                                placeholder="Paste recipient's public key here..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>

                        <button
                            onClick={encryptMessage}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400"
                        >
                            {loading ? "Encrypting..." : "Encrypt Message"}
                        </button>
                    </div>
                </Section>
            )}

            {/* Decrypt Tab */}
            {activeTab === "decrypt" && (
                <Section title="Decrypt Message" subtitle="Decrypt a message with your private key">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Encrypted Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Paste encrypted message here..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Your Private Key
                            </label>
                            <textarea
                                value={senderPrivateKey}
                                onChange={(e) => setSenderPrivateKey(e.target.value)}
                                placeholder="Paste your private key here..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Passphrase (if set)
                            </label>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                placeholder="Enter passphrase if key is protected"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={decryptMessage}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400"
                        >
                            {loading ? "Decrypting..." : "Decrypt Message"}
                        </button>
                    </div>
                </Section>
            )}

            {/* Sign Tab */}
            {activeTab === "sign" && (
                <Section title="Sign Message" subtitle="Sign a message with your private key">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter message to sign..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Your Private Key
                            </label>
                            <textarea
                                value={senderPrivateKey}
                                onChange={(e) => setSenderPrivateKey(e.target.value)}
                                placeholder="Paste your private key here..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Passphrase (if set)
                            </label>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                placeholder="Enter passphrase if key is protected"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={signMessage}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400"
                        >
                            {loading ? "Signing..." : "Sign Message"}
                        </button>
                    </div>
                </Section>
            )}

            {/* Verify Tab */}
            {activeTab === "verify" && (
                <Section title="Verify Signature" subtitle="Verify a signed message">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Signed Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Paste signed message here..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Signer's Public Key
                            </label>
                            <textarea
                                value={recipientPublicKey}
                                onChange={(e) => setRecipientPublicKey(e.target.value)}
                                placeholder="Paste signer's public key here..."
                                className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs"
                            />
                        </div>

                        <button
                            onClick={verifyMessage}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-slate-400"
                        >
                            {loading ? "Verifying..." : "Verify Signature"}
                        </button>
                    </div>
                </Section>
            )}

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
                <Section title="Result" subtitle="Operation output">
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
                                onClick={() => downloadKey(output, "output.txt")}
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
                    </div>
                </Section>
            )}

            {/* Info Section */}
            <Section title="About PGP" subtitle="Pretty Good Privacy">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="mb-2">
                        <strong>PGP (Pretty Good Privacy)</strong> is an encryption program that provides
                        cryptographic privacy and authentication for data communication.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            <strong>Public Key:</strong> Share this with others so they can encrypt messages for you
                        </li>
                        <li>
                            <strong>Private Key:</strong> Keep this secret! Use it to decrypt messages sent to you
                        </li>
                        <li>
                            <strong>Signing:</strong> Prove that a message came from you
                        </li>
                        <li>
                            <strong>Verification:</strong> Verify that a message came from the claimed sender
                        </li>
                    </ul>
                </div>
            </Section>
        </div>
    );
}
