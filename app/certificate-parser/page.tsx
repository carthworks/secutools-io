// components/CertificateParser.jsx
import React, { useState, useRef } from "react";

/**
 * CertificateParser
 * - Dynamically imports node-forge only when parsing is requested (lighter initial bundle).
 * - Accepts pasted PEM, pasted DER (base64), or file upload (.crt .cer .pem .der).
 * - Shows details, expiry warnings, copy/export buttons.
 *
 * Usage: <CertificateParser />
 */

export default function CertificateParser() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cert, setCert] = useState(null);
  const fileInputRef = useRef(null);

  // Helpers
  const isPem = (text) => /-----BEGIN CERTIFICATE-----/i.test(text);
  const isBase64 = (text) => {
    // rough heuristic: long line of base64 chars
    const s = text.trim().replace(/\r?\n/g, "");
    return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 200;
  };

  function arrBufToString(buf) {
    const bytes = new Uint8Array(buf);
    let str = "";
    for (let i = 0; i < bytes.length; ++i) {
      str += String.fromCharCode(bytes[i]);
    }
    return str;
  }

  function derBytesToPem(derBytes) {
    // derBytes is a binary string (each char is a byte)
    const b64 = btoa(derBytes);
    const pem = "-----BEGIN CERTIFICATE-----\n"
      + b64.match(/.{1,64}/g).join("\n")
      + "\n-----END CERTIFICATE-----\n";
    return pem;
  }

  // convert forge attribute array to readable string
  function attrsToString(attrs = []) {
    return attrs.map(a => `${a.shortName || a.name}=${a.value}`).join(", ");
  }

  const formatFingerprint = (hex) => {
    return hex.toUpperCase().match(/.{2}/g).join(":");
  };

  const readFileAsArrayBuffer = (file) =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsArrayBuffer(file);
    });

  const parseCertificate = async (sourceText) => {
    setError(null);
    setCert(null);
    setLoading(true);
    try {
      const forge = await import("node-forge");
      let pem = null;

      // if user provided a file via input variable (we also support file upload handler)
      if (!sourceText && fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const ab = await readFileAsArrayBuffer(file);
        const bin = arrBufToString(ab);
        // If file contains PEM header on binary->string: present
        if (isPem(bin) || isPem(file.name)) {
          pem = bin;
        } else {
          // treat as DER binary
          pem = derBytesToPem(bin);
        }
      } else if (isPem(sourceText)) {
        pem = sourceText;
      } else if (isBase64(sourceText)) {
        // treat pasted base64 DER
        const b64 = sourceText.trim().replace(/\r?\n/g, "");
        const derBytes = atob(b64); // binary string
        pem = derBytesToPem(derBytes);
      } else {
        // try to detect if it's hex or raw; fallback: if it looks like text but not PEM, attempt to parse as PEM after trimming
        if (sourceText && sourceText.trim().length > 0) {
          // Maybe user pasted PEM but spaces/line endings got altered:
          if (sourceText.indexOf("BEGIN CERTIFICATE") !== -1) {
            pem = sourceText;
          } else {
            throw new Error("Unable to determine certificate format. Paste a PEM (-----BEGIN CERTIFICATE-----) or upload a DER/PEM file.");
          }
        } else {
          throw new Error("No certificate data provided.");
        }
      }

      // Now parse with forge
      let certObj = null;
      try {
        certObj = forge.pki.certificateFromPem(pem);
      } catch (e) {
        // sometimes certificateFromPem fails for certain DER-derived forms, try ASN.1 parsing
        try {
          const der = forge.util.decode64(pem.replace(/-----.*-----/g, "").replace(/\s+/g, ""));
          const asn1 = forge.asn1.fromDer(der);
          certObj = forge.pki.certificateFromAsn1(asn1);
        } catch (e2) {
          throw new Error("Failed to parse certificate content. Ensure it's valid PEM or DER.");
        }
      }

      // Extract SANs (subjectAltName)
      let san = [];
      try {
        const ext = certObj.getExtension("subjectAltName");
        if (ext && ext.altNames) {
          san = ext.altNames.map((n) => n.value || n.ip || n.host || n.otherName || JSON.stringify(n));
        }
      } catch (ex) {
        // ignore
      }

      // fingerprint (sha256)
      const derAsn1 = forge.pki.certificateToAsn1(certObj);
      const derBytes = forge.asn1.toDer(derAsn1).getBytes();
      const md = forge.md.sha256.create();
      md.update(derBytes);
      const fp = md.digest().toHex();

      // public key pem
      const publicKeyPem = forge.pki.publicKeyToPem(certObj.publicKey);

      // key algorithm & size
      let keyAlgorithm = "unknown";
      let keySize = null;
      try {
        if (certObj.publicKey.n && certObj.publicKey.e) {
          keyAlgorithm = "RSA";
          keySize = certObj.publicKey.n.bitLength ? certObj.publicKey.n.bitLength() : null;
        } else if (certObj.publicKey.q) {
          keyAlgorithm = "EC";
          // node-forge doesn't give curve name easily here — left as EC
        } else {
          keyAlgorithm = certObj.publicKey.algorithm || keyAlgorithm;
        }
      } catch (e) {
        // ignore
      }

      const now = new Date();
      const notBefore = certObj.validity.notBefore;
      const notAfter = certObj.validity.notAfter;
      const msLeft = notAfter.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      const serialHex = certObj.serialNumber ? certObj.serialNumber.replace(/^0+/, "") : null;

      const out = {
        subject: attrsToString(certObj.subject.attributes),
        issuer: attrsToString(certObj.issuer.attributes),
        subjectAttributes: certObj.subject.attributes,
        issuerAttributes: certObj.issuer.attributes,
        serialNumber: serialHex,
        notBefore: notBefore.toISOString(),
        notAfter: notAfter.toISOString(),
        daysToExpiry: daysLeft,
        expired: daysLeft < 0,
        expiresSoon: daysLeft >= 0 && daysLeft <= 30,
        signatureAlgorithm: certObj.siginfo && certObj.siginfo.algorithmOid ? (forge.pki.oids[certObj.siginfo.algorithmOid] || certObj.siginfo.algorithmOid) : certObj.signatureAlgorithmOid || "unknown",
        publicKeyPem,
        publicKeyAlgorithm: keyAlgorithm,
        publicKeySize: keySize,
        fingerprintSHA256: formatFingerprint(fp),
        subjectAltNames: san,
        rawPem: pem,
      };

      setCert(out);
      setError(null);
    } catch (err) {
      console.error("parse error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // UI actions
  const handleFileUpload = async (ev) => {
    setError(null);
    setCert(null);
    const file = ev.target.files?.[0];
    if (!file) return;
    // read as array buffer then parse
    try {
      const ab = await readFileAsArrayBuffer(file);
      const binary = arrBufToString(ab);
      // create PEM
      let pem;
      if (isPem(binary)) pem = binary;
      else pem = derBytesToPem(binary);
      setInput(pem);
      // auto-parse
      await parseCertificate(pem);
    } catch (e) {
      console.error(e);
      setError("Failed to read file: " + (e.message || e));
    }
  };

  const copyToClipboard = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      alert(label);
    } catch {
      alert("Copy failed — clipboard may be blocked");
    }
  };

  const downloadJson = (obj) => {
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

        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept=".pem,.crt,.cer,.der,application/x-x509-ca-cert" />
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
              <div>Serial: <span className="font-mono">{cert.serialNumber}</span></div>
              <div className="mt-2">Expires: <span className={cert.expired ? "text-rose-600" : cert.expiresSoon ? "text-amber-600" : ""}>{cert.notAfter}</span></div>
              <div className="text-slate-500">Days left: {cert.daysToExpiry}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-slate-600">Fingerprint (SHA-256)</div>
              <div className="font-mono text-xs">{cert.fingerprintSHA256}</div>

              <div className="text-sm text-slate-600 mt-2">Signature algorithm</div>
              <div className="text-sm">{cert.signatureAlgorithm}</div>

              <div className="text-sm text-slate-600 mt-2">Public key</div>
              <div className="text-xs font-mono break-words">{cert.publicKeyAlgorithm}{cert.publicKeySize ? ` (${cert.publicKeySize} bits)` : ""}</div>
            </div>

            <div>
              <div className="text-sm text-slate-600">Subject Alternative Names (SANs)</div>
              {cert.subjectAltNames.length ? (
                <ul className="mt-1 text-sm">
                  {cert.subjectAltNames.map((s, idx) => <li key={idx} className="font-mono text-xs">{s}</li>)}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">No SANs found</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 rounded border" onClick={() => copyToClipboard(cert.rawPem, "PEM copied")}>Copy PEM</button>
            <button className="px-3 py-1 rounded border" onClick={() => copyToClipboard(JSON.stringify(cert, null, 2), "Certificate JSON copied")}>Copy JSON</button>
            <button className="px-3 py-1 rounded border" onClick={() => downloadJson(cert)}>Download JSON</button>
            <button className="px-3 py-1 rounded border" onClick={() => copyToClipboard(cert.fingerprintSHA256, "Fingerprint copied")}>Copy Fingerprint</button>
          </div>

          {cert.expired && <div className="mt-3 text-sm text-rose-600">Certificate is expired.</div>}
          {!cert.expired && cert.expiresSoon && <div className="mt-3 text-sm text-amber-600">Certificate expires soon (<= 30 days).</div>}
        </div>
      )}
    </div>
  );
}
