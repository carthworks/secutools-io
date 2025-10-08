"use client";

import React, { ChangeEvent, useRef, useState } from "react";

/**
 * CertificateParser (TypeScript + React)
 * - Client-side component that dynamically imports node-forge for parsing.
 * - Accepts pasted PEM, base64 DER, or file uploads (.pem/.crt/.cer/.der).
 *
 * Replace / adapt server-side if you prefer parsing on the server to avoid bundling node-forge.
 */

type CertOut = {
  subject: string;
  issuer: string;
  subjectAttributes?: any;
  issuerAttributes?: any;
  serialNumber?: string | null;
  notBefore?: string;
  notAfter?: string;
  daysToExpiry?: number;
  expired?: boolean;
  expiresSoon?: boolean;
  signatureAlgorithm?: string;
  publicKeyPem?: string;
  publicKeyAlgorithm?: string;
  publicKeySize?: number | null;
  fingerprintSHA256?: string;
  subjectAltNames?: string[];
  rawPem?: string;
};

const isPem = (text: string) => /-----BEGIN CERTIFICATE-----/i.test(text);
const isBase64 = (text: string) => {
  const s = text.trim().replace(/\r?\n/g, "");
  return /^[A-Za-z0-9+/=]+$/.test(s) && s.length > 200;
};

function arrBufToString(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let str = "";
  // build in chunks for memory safety
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return str;
}

function derBytesToPem(derBytes: string) {
  const b64 = typeof btoa === "function" ? btoa(derBytes) : Buffer.from(derBytes, "binary").toString("base64");
  const chunks = b64.match(/.{1,64}/g) || [b64];
  const pem = "-----BEGIN CERTIFICATE-----\n" + chunks.join("\n") + "\n-----END CERTIFICATE-----\n";
  return pem;
}

function attrsToString(attrs: any[] = []) {
  return attrs.map((a) => `${a.shortName || a.name}=${a.value}`).join(", ");
}

function formatFingerprint(hex: string) {
  if (!hex) return "";
  const pairs = hex.toUpperCase().match(/.{1,2}/g);
  return pairs ? pairs.join(":") : hex.toUpperCase();
}

const readFileAsArrayBuffer = (file: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.onerror = (e) => reject(e);
    fr.readAsArrayBuffer(file);
  });

export default function CertificateParserPage() {
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cert, setCert] = useState<CertOut | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseCertificate = async (sourceText?: string) => {
    setError(null);
    setCert(null);
    setLoading(true);
    try {
      // dynamic import; note: this will include node-forge in client bundle if used client-side
      const forge = await import("node-forge");

      let pem: string | null = null;
      const trimmed = (sourceText ?? input ?? "").trim();

      // file input case
      if ((!trimmed || trimmed.length === 0) && fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const ab = await readFileAsArrayBuffer(file);
        const bin = arrBufToString(ab);
        if (isPem(bin) || isPem(file.name)) {
          pem = bin;
        } else {
          pem = derBytesToPem(bin);
        }
      } else if (isPem(trimmed)) {
        pem = trimmed;
      } else if (isBase64(trimmed)) {
        // treat pasted base64 DER
        const b64 = trimmed.replace(/\r?\n/g, "");
        const derBytes = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
        pem = derBytesToPem(derBytes);
      } else if (trimmed.length > 0) {
        if (trimmed.indexOf("BEGIN CERTIFICATE") !== -1) {
          pem = trimmed;
        } else {
          throw new Error("Unable to determine certificate format. Paste PEM or base64 DER or upload a certificate file.");
        }
      } else {
        throw new Error("No certificate data provided.");
      }

      // use forge to parse; attempt certificateFromPem -> fallback to ASN.1
      let certObj: any = null;
      try {
        certObj = (forge as any).pki.certificateFromPem(pem);
      } catch (e1) {
        try {
          const b64 = pem.replace(/-----.*-----/g, "").replace(/\s+/g, "");
          const der = (forge as any).util.decode64(b64);
          const asn1 = (forge as any).asn1.fromDer(der);
          certObj = (forge as any).pki.certificateFromAsn1(asn1);
        } catch (e2) {
          throw new Error("Failed to parse certificate. Ensure the input is valid PEM or base64 DER.");
        }
      }

      // SANs
      let san: string[] = [];
      try {
        const ext = certObj.getExtension && certObj.getExtension("subjectAltName");
        if (ext && ext.altNames) {
          san = ext.altNames.map((n: any) => n.value || n.ip || n.host || JSON.stringify(n));
        }
      } catch (ex) {
        // ignore
      }

      // fingerprint (sha256)
      const derAsn1 = (forge as any).pki.certificateToAsn1(certObj);
      const derBytes = (forge as any).asn1.toDer(derAsn1).getBytes();
      const md = (forge as any).md.sha256.create();
      md.update(derBytes);
      const fp = md.digest().toHex();

      const publicKeyPem = (forge as any).pki.publicKeyToPem(certObj.publicKey);

      // key algorithm and size
      let keyAlgorithm = "unknown";
      let keySize: number | null = null;
      try {
        if (certObj.publicKey && certObj.publicKey.n && certObj.publicKey.e) {
          keyAlgorithm = "RSA";
          const n = certObj.publicKey.n;
          if (typeof n.bitLength === "function") keySize = n.bitLength();
        } else if (certObj.publicKey && certObj.publicKey.q) {
          keyAlgorithm = "EC";
        } else {
          keyAlgorithm = certObj.publicKey?.algorithm || "unknown";
        }
      } catch {
        // ignore
      }

      const now = new Date();
      const notBefore = certObj.validity?.notBefore;
      const notAfter = certObj.validity?.notAfter;
      const msLeft = notAfter ? notAfter.getTime() - now.getTime() : 0;
      const daysLeft = notAfter ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;
      const serialHex = certObj.serialNumber ? certObj.serialNumber.replace(/^0+/, "") : null;

      const out: CertOut = {
        subject: attrsToString(certObj.subject?.attributes || []),
        issuer: attrsToString(certObj.issuer?.attributes || []),
        subjectAttributes: certObj.subject?.attributes,
        issuerAttributes: certObj.issuer?.attributes,
        serialNumber: serialHex,
        notBefore: notBefore ? notBefore.toISOString() : undefined,
        notAfter: notAfter ? notAfter.toISOString() : undefined,
        daysToExpiry: daysLeft,
        expired: daysLeft < 0,
        expiresSoon: daysLeft >= 0 && daysLeft <= 30,
        signatureAlgorithm:
          (certObj.siginfo && certObj.siginfo.algorithmOid && ( (forge as any).pki.oids[certObj.siginfo.algorithmOid] || certObj.siginfo.algorithmOid )) ||
          certObj.signatureAlgorithmOid ||
          "unknown",
        publicKeyPem,
        publicKeyAlgorithm: keyAlgorithm,
        publicKeySize: keySize,
        fingerprintSHA256: formatFingerprint(fp),
        subjectAltNames: san,
        rawPem: pem,
      };

      setCert(out);
      setError(null);
    } catch (err: any) {
      console.error("parse error:", err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (ev: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCert(null);
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const ab = await readFileAsArrayBuffer(file);
      const binary = arrBufToString(ab);
      let pem: string;
      if (isPem(binary)) pem = binary;
      else pem = derBytesToPem(binary);
      setInput(pem);
      await parseCertificate(pem);
    } catch (e: any) {
      console.error(e);
      setError("Failed to read file: " + (e?.message || String(e)));
    } finally {
      // clear file input to allow re-upload of same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      alert(label);
    } catch {
      alert("Copy failed — clipboard may be blocked");
    }
  };

  const downloadJson = (obj: any) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificate-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white dark:bg-slate-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Certificate Parser</h2>
      <p className="text-sm text-slate-500 mb-4">
        Paste PEM, paste base64 DER, or upload a certificate file (.cer/.crt/.der/.pem). The parser extracts subject, issuer, SANs,
        fingerprint, public key and validity info.
      </p>

      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste PEM (-----BEGIN CERTIFICATE-----...), or base64 DER..."
          rows={6}
          className="w-full rounded border p-2 text-sm font-mono"
        />

        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pem,.crt,.cer,.der,application/x-x509-ca-cert"
            className="text-xs"
          />
          <button
            className="px-3 py-1 rounded bg-indigo-600 text-white"
            onClick={() => parseCertificate(input)}
            disabled={loading}
          >
            {loading ? "Parsing…" : "Parse"}
          </button>

          <button
            className="px-3 py-1 rounded border"
            onClick={() => {
              setInput("");
              setCert(null);
              setError(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Clear
          </button>
        </div>

        {error && <div className="p-3 rounded bg-rose-50 text-rose-700">{error}</div>}
      </div>

      {cert && (
        <div className="mt-4 border rounded p-3 bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-slate-600">Subject</div>
              <div className="font-medium">{cert.subject}</div>

              <div className="text-sm text-slate-600 mt-2">Issuer</div>
              <div className="font-medium">{cert.issuer}</div>
            </div>

            <div className="text-right text-xs">
              <div>
                Serial: <span className="font-mono">{cert.serialNumber ?? "—"}</span>
              </div>
              <div className="mt-2">
                Expires:{" "}
                <span className={cert.expired ? "text-rose-600" : cert.expiresSoon ? "text-amber-600" : ""}>
                  {cert.notAfter ?? "—"}
                </span>
              </div>
              <div className="text-slate-500">Days left: {cert.daysToExpiry ?? "—"}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-slate-600">Fingerprint (SHA-256)</div>
              <div className="font-mono text-xs break-words">{cert.fingerprintSHA256}</div>

              <div className="text-sm text-slate-600 mt-2">Signature algorithm</div>
              <div className="text-sm">{cert.signatureAlgorithm}</div>

              <div className="text-sm text-slate-600 mt-2">Public key</div>
              <div className="text-xs font-mono break-words">
                {cert.publicKeyAlgorithm}
                {cert.publicKeySize ? ` (${cert.publicKeySize} bits)` : ""}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-600">Subject Alternative Names (SANs)</div>
              {cert.subjectAltNames && cert.subjectAltNames.length > 0 ? (
                <ul className="mt-1 text-sm">
                  {cert.subjectAltNames.map((s, idx) => (
                    <li key={idx} className="font-mono text-xs">
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">No SANs found</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <button className="px-3 py-1 rounded border" onClick={() => copyToClipboard(cert.rawPem ?? "", "PEM copied")}>
              Copy PEM
            </button>
            <button
              className="px-3 py-1 rounded border"
              onClick={() => copyToClipboard(JSON.stringify(cert, null, 2), "Certificate JSON copied")}
            >
              Copy JSON
            </button>
            <button className="px-3 py-1 rounded border" onClick={() => downloadJson(cert)}>
              Download JSON
            </button>
            <button className="px-3 py-1 rounded border" onClick={() => copyToClipboard(cert.fingerprintSHA256 ?? "", "Fingerprint copied")}>
              Copy Fingerprint
            </button>
          </div>

          {cert.expired && <div className="mt-3 text-sm text-rose-600">Certificate is expired.</div>}
          {!cert.expired && cert.expiresSoon && <div className="mt-3 text-sm text-amber-600">Certificate expires soon (≤ 30 days).</div>}
        </div>
      )}
    </div>
  );
}
