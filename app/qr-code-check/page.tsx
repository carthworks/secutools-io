"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  Upload,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  Wifi,
  Coins,
  FileText,
} from "lucide-react";
import GalaxyGlobeBackground from "@/components/GalaxyGlobeBackground";

type Analysis = {
  type: "url" | "wifi" | "crypto" | "vcard" | "text";
  value: string;
  raw: string;
  warnings: string[];
  details?: Record<string, string>;
};

function analyzeContent(rawContent: string): Analysis {
  const trimmed = rawContent.trim();
  const warnings: string[] = [];
  const details: Record<string, string> = {};

  // 1. Wi-Fi Check
  if (trimmed.startsWith("WIFI:")) {
    const ssidMatch = trimmed.match(/S:([^;]+)/);
    const typeMatch = trimmed.match(/T:([^;]+)/);
    const passMatch = trimmed.match(/P:([^;]+)/);
    const hiddenMatch = trimmed.match(/H:([^;]+)/);

    if (ssidMatch) details["Network Name (SSID)"] = ssidMatch[1];
    if (typeMatch) details["Security Type"] = typeMatch[1];
    if (passMatch) details["Password"] = passMatch[1];
    if (hiddenMatch) details["Hidden Network"] = hiddenMatch[1];

    if (!typeMatch || typeMatch[1] === "nopass") {
      warnings.push("Unsecured Wi-Fi Network (Open / No Password)");
    }

    return {
      type: "wifi",
      value: `Wi-Fi: ${details["Network Name (SSID)"] || "Unknown"}`,
      raw: trimmed,
      warnings,
      details,
    };
  }

  // 2. Crypto URI
  if (/^(bitcoin|ethereum|solana|litecoin|doge|usdt):/i.test(trimmed)) {
    const parts = trimmed.split(":");
    const currency = parts[0].toUpperCase();
    const addressAndParams = parts.slice(1).join(":");
    const [address, queryString] = addressAndParams.split("?");

    details["Cryptocurrency"] = currency;
    details["Wallet Address"] = address;

    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((val, key) => {
        details[key.charAt(0).toUpperCase() + key.slice(1)] = val;
      });
    }

    return {
      type: "crypto",
      value: `${currency} Payment to ${address}`,
      raw: trimmed,
      warnings,
      details,
    };
  }

  // 3. vCard
  if (trimmed.startsWith("BEGIN:VCARD")) {
    const fnMatch = trimmed.match(/FN:(.+)/i);
    const telMatch = trimmed.match(/TEL.*:(.+)/i);
    const emailMatch = trimmed.match(/EMAIL.*:(.+)/i);
    const orgMatch = trimmed.match(/ORG:(.+)/i);

    if (fnMatch) details["Full Name"] = fnMatch[1].trim();
    if (orgMatch) details["Organization"] = orgMatch[1].trim();
    if (telMatch) details["Phone Number"] = telMatch[1].trim();
    if (emailMatch) details["Email"] = emailMatch[1].trim();

    return {
      type: "vcard",
      value: `Contact Card: ${details["Full Name"] || "Unknown"}`,
      raw: trimmed,
      warnings,
      details,
    };
  }

  // 4. URL Check
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      warnings.push(`Unusual protocol scheme: ${url.protocol}`);
    }
    if (url.protocol === "http:") {
      warnings.push("Insecure HTTP connection (unencrypted traffic)");
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname)) {
      warnings.push("IP-based direct URL (often used in phishing or malicious infrastructure)");
    }
    if (/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy)/i.test(url.hostname)) {
      warnings.push("Shortened redirect link (destination may hide malware or credential harvester)");
    }
    if (url.username || url.password) {
      warnings.push("URL contains embedded credentials (potential obfuscation tactic)");
    }

    details["Host / Domain"] = url.hostname;
    details["Path"] = url.pathname;
    details["Protocol"] = url.protocol;
    if (url.search) details["Query Parameters"] = url.search;

    return { type: "url", value: url.href, raw: trimmed, warnings, details };
  } catch {
    // 5. Plain Text / Raw Data
    return { type: "text", value: trimmed, raw: trimmed, warnings };
  }
}

/**
 * Universal Multi-Engine QR Decoder
 * - Checks Native BarcodeDetector first (extremely resilient with logos, styles & frames)
 * - Falls back to jsQR with white background canvas (handles transparent PNGs)
 * - Multi-scale sampling (original, 800px, 500px, 1200px)
 * - Contrast & Binarization enhancements
 */
async function decodeQRCodeFromSource(
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): Promise<string | null> {
  // Pass 1: Native BarcodeDetector API (fastest, most robust)
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });
      const detected = await barcodeDetector.detect(source);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        return detected[0].rawValue;
      }
    } catch {
      // Continue to fallback
    }
  }

  // Helper to create solid white background canvas
  const getWhiteCanvas = (w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
    }
    return { c, ctx };
  };

  const naturalWidth =
    (source as any).videoWidth ||
    (source as any).naturalWidth ||
    (source as any).width ||
    0;
  const naturalHeight =
    (source as any).videoHeight ||
    (source as any).naturalHeight ||
    (source as any).height ||
    0;

  if (!naturalWidth || !naturalHeight) return null;

  // Scales to test
  const scaleConfigs: { max?: number; direct?: boolean }[] = [
    { direct: true }, // 1. Original dimensions with solid white backdrop
    { max: 800 },    // 2. Downscaled standard
    { max: 500 },    // 3. Medium resolution
    { max: 1200 },   // 4. Large HD sampling
    { max: 360 },    // 5. Compact sampling
  ];

  for (const config of scaleConfigs) {
    let w = naturalWidth;
    let h = naturalHeight;

    if (config.max) {
      if (naturalWidth > config.max || naturalHeight > config.max) {
        if (naturalWidth > naturalHeight) {
          w = config.max;
          h = Math.round((naturalHeight * config.max) / naturalWidth);
        } else {
          h = config.max;
          w = Math.round((naturalWidth * config.max) / naturalHeight);
        }
      }
    }

    const { c, ctx } = getWhiteCanvas(w, h);
    if (!ctx) continue;

    ctx.drawImage(source, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    // Standard jsQR with both inversions
    let code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (code?.data) return code.data;

    // High-contrast Grayscale pass (helps with colorful TQRCG custom dots & gradients)
    const { c: cContrast, ctx: ctxContrast } = getWhiteCanvas(w, h);
    if (ctxContrast) {
      ctxContrast.filter = "contrast(200%) grayscale(100%) brightness(105%)";
      ctxContrast.drawImage(source, 0, 0, w, h);
      const contrastData = ctxContrast.getImageData(0, 0, w, h);
      code = jsQR(contrastData.data, contrastData.width, contrastData.height, {
        inversionAttempts: "attemptBoth",
      });
      if (code?.data) return code.data;
    }

    // Adaptive thresholding pass
    const rawData = new Uint8ClampedArray(imageData.data);
    for (let i = 0; i < rawData.length; i += 4) {
      const luminance = 0.299 * rawData[i] + 0.587 * rawData[i + 1] + 0.114 * rawData[i + 2];
      const binary = luminance > 128 ? 255 : 0;
      rawData[i] = binary;
      rawData[i + 1] = binary;
      rawData[i + 2] = binary;
    }
    code = jsQR(rawData, w, h, { inversionAttempts: "attemptBoth" });
    if (code?.data) return code.data;
  }

  return null;
}

export default function QrScannerSafe(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [scanning, setScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stopCamera = useCallback((): void => {
    setScanning(false);
    if (scanIntervalRef.current !== null) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  // Frame scanner for active camera stream
  const scanFrame = useCallback(async (): Promise<void> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    try {
      const text = await decodeQRCodeFromSource(video);
      if (text) {
        setResult(analyzeContent(text));
        setError(null);
        stopCamera();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Camera frame scan error", err);
    }
  }, [stopCamera]);

  // Start camera stream safely
  async function startCamera(): Promise<void> {
    setError(null);
    setResult(null);
    setPreviewImage(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Camera is not supported in this browser environment.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        setError("Video display element is not ready.");
        stopCamera();
        return;
      }

      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          video.play().then(resolve).catch(reject);
        };
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", () => reject(new Error("Video playback error")), { once: true });

        if (video.readyState >= 2 && video.videoWidth > 0) {
          resolve();
        }
      });

      setScanning(true);
      scanIntervalRef.current = window.setInterval(scanFrame, 250);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("startCamera error:", err);
      setError("Unable to access camera. Please check camera permissions in your browser.");
      stopCamera();
    }
  }

  // Process image file or data URI
  const processImage = useCallback((fileOrDataUrl: File | string) => {
    setError(null);
    setResult(null);
    setIsProcessing(true);

    const handleDataUrl = (dataUrl: string) => {
      setPreviewImage(dataUrl);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        try {
          const rawText = await decodeQRCodeFromSource(img);
          if (rawText) {
            setResult(analyzeContent(rawText));
            setError(null);
          } else {
            setError("No QR code detected in the image. Ensure the image is clear and contains a visible QR code.");
          }
        } catch (err: any) {
          setError(`Decoding failed: ${err?.message || "Unknown error"}`);
        } finally {
          setIsProcessing(false);
          img.onload = null;
          img.onerror = null;
        }
      };
      img.onerror = () => {
        setError("Failed to load image file. Please provide a valid PNG, JPG, or WEBP image.");
        setIsProcessing(false);
        img.onload = null;
        img.onerror = null;
      };
      img.src = dataUrl;
    };

    if (typeof fileOrDataUrl === "string") {
      handleDataUrl(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleDataUrl(String(e.target?.result || ""));
      };
      reader.onerror = () => {
        setError("Failed to read the uploaded file.");
        setIsProcessing(false);
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  };

  // Clipboard Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            processImage(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processImage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.raw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="max-w-4xl mx-auto space-y-6" aria-labelledby="qr-title">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-5 sm:p-7 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg shadow-indigo-500/5">
        <GalaxyGlobeBackground />
        <div className="relative z-10 space-y-1.5 text-center sm:text-left max-w-2xl">
          <h1 id="qr-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-emerald-400 bg-clip-text text-transparent">
              QR Code Security Analyzer & Scanner
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Upload any QR code image, paste from clipboard (<kbd className="px-1.5 py-0.5 text-xs bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono shadow-2xs">Ctrl+V</kbd>), or scan via camera. Client-side zero-knowledge security evaluation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Input Modes (Camera & File Upload) */}
        <div className="space-y-4">
          {/* Camera Scanner Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" /> Live Camera Scanner
              </h2>
              {scanning && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
                  Scanning Active
                </span>
              )}
            </div>

            <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[220px] flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-auto max-h-[300px] object-contain mx-auto ${scanning ? "block" : "hidden"}`}
                playsInline
                muted
              />
              {!scanning && (
                <div className="text-center p-6 space-y-2">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Camera preview will appear here</p>
                </div>
              )}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/40 rounded-xl flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-lg animate-pulse"></div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!scanning ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Start Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
                >
                  Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* File Upload & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all bg-white dark:bg-slate-900 ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700"
            }`}
          >
            <input
              ref={fileInputRef}
              id="qr-file"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Drop QR Code image here, or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP, SVG, TQRCG, screenshots, and clipboard paste (<kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl+V</kbd>)
                </p>
              </div>

              {previewImage && (
                <div className="pt-2 flex items-center justify-center">
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[140px] max-h-[140px] bg-slate-100 dark:bg-slate-950 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewImage} alt="Uploaded QR preview" className="object-contain w-full h-full rounded" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Decoded Results & Security Assessment */}
        <div className="space-y-4">
          {/* Status Messages */}
          {isProcessing && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center gap-3 text-indigo-700 dark:text-indigo-300">
              <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
              <div className="text-sm font-medium">Analyzing QR image with multi-pass security engines…</div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-sm text-rose-800 dark:text-rose-200 space-y-1" role="alert">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Detection Notice
              </div>
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Results Card */}
          {result && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {result.type === "url" && <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                  {result.type === "wifi" && <Wifi className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
                  {result.type === "crypto" && <Coins className="w-5 h-5 text-amber-500" />}
                  {result.type === "vcard" && <FileText className="w-5 h-5 text-emerald-500" />}
                  {result.type === "text" && <FileText className="w-5 h-5 text-slate-500" />}
                  <h3 className="font-bold text-slate-900 dark:text-white capitalize">
                    {result.type === "url" ? "URL Destination" : `${result.type} Payload`}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Decoded
                </span>
              </div>

              {/* Main Decoded Value */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Decoded Content
                </label>
                {result.type === "url" ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <a
                      href={result.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-mono text-xs sm:text-sm font-semibold hover:underline break-all block"
                    >
                      {result.value}
                    </a>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={result.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition"
                      >
                        Visit Link <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <pre className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                      {result.raw}
                    </pre>
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs flex items-center gap-1 transition shadow-xs"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Detailed Breakdown Fields */}
              {result.details && Object.keys(result.details).length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Parsed Fields
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(result.details).map(([k, v]) => (
                      <div key={k} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs">
                        <span className="font-medium text-slate-500 dark:text-slate-400 block">{k}</span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-slate-100 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Warnings */}
              {result.warnings.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Security Advisories ({result.warnings.length})
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  No immediate heuristic red flags or dangerous anomalies detected.
                </div>
              )}
            </div>
          )}

          {/* Fallback info when no result */}
          {!result && !isProcessing && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Awaiting QR Code Input</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Scan with your webcam/camera or upload any QR code file to view its decoded contents and security safety score.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
