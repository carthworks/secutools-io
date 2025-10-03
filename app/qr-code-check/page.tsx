"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Analysis = {
  type: "url" | "text";
  value: string;
  warnings: string[];
};

function analyzeContent(content: string): Analysis {
  const warnings: string[] = [];
  try {
    const url = new URL(content);
    if (url.protocol !== "https:") warnings.push("Non-HTTPS link");
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname)) warnings.push("IP-based URL");
    if (/(bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd)/i.test(url.hostname)) warnings.push("Shortened link");
    return { type: "url", value: url.href, warnings };
  } catch {
    return { type: "text", value: content, warnings };
  }
}

export default function QrScannerSafe(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start camera stream safely
  async function startCamera(): Promise<void> {
    setError(null);
    setResult(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser.");
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
        setError("Video element not available.");
        stopCamera();
        return;
      }

      video.srcObject = stream;

      // Wait for metadata (dimensions) to be available before scanning.
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          video.play().then(resolve).catch(reject);
        };
        const onError = (ev: Event) => reject(new Error("Video playback error"));
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onError, { once: true });

        // If the video already has metadata, resolve immediately
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          resolve();
        }
      });

      // Safe: dimensions are available now
      setScanning(true);
      // scan every 300ms (adjustable)
      scanIntervalRef.current = window.setInterval(scanFrame, 300);
    } catch (err) {
      // Permission denied or other errors
      // eslint-disable-next-line no-console
      console.error("startCamera error:", err);
      setError("Unable to access camera. Check permissions and try again.");
      stopCamera();
    }
  }

  function stopCamera(): void {
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
  }

  // core frame scanning routine with null-safety
  function scanFrame(): void {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // guard against video not ready (prevents videoWidth null/0)
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    canvas.width = vw;
    canvas.height = vh;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      ctx.drawImage(video, 0, 0, vw, vh);
      const imageData = ctx.getImageData(0, 0, vw, vh);
      const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      if (qr && qr.data) {
        // Found QR code — analyze and optionally stop scanning
        setResult(analyzeContent(qr.data));
        // keep scanning if you want continuous detection, otherwise stop:
        // stopCamera();
      }
    } catch (err) {
      // canvas read can fail in some environments; don't crash the app
      // eslint-disable-next-line no-console
      console.error("scanFrame error:", err);
    }
  }

  // File upload based decoder (safe, uses FileReader + Image load)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>): void {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      // eslint-disable-next-line no-console
      console.error("FileReader error", reader.error);
      setError("Failed to read the image file.");
    };

    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) {
        setError("Empty image file.");
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError("Canvas not supported.");
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
          if (qr && qr.data) {
            setResult(analyzeContent(qr.data));
          } else {
            setError("No QR code found in the image.");
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Decoding uploaded image failed", err);
          setError("Failed to decode QR code from the image.");
        } finally {
          // cleanup
          img.onload = null;
          img.onerror = null;
        }
      };
      img.onerror = (ev) => {
        // eslint-disable-next-line no-console
        console.error("Image load error", ev);
        setError("Invalid image file.");
        img.onload = null;
        img.onerror = null;
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="max-w-3xl mx-auto space-y-6" aria-labelledby="qr-title">
      <div>
        <h3 id="qr-title" className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
          🛡️ QR Code Security Analyzer
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Scan a QR with camera or upload an image. Decoding happens in your browser.
        </p>
      </div>

      {/* Video + hidden canvas */}
      <div className="rounded-lg border p-4 bg-white dark:bg-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          {!scanning ? (
            <button
              type="button"
              onClick={() => startCamera().catch((e) => {
                // eslint-disable-next-line no-console
                console.error("startCamera top-level error", e);
                setError("Unable to start camera.");
              })}
              className="px-3 py-1 bg-indigo-600 text-white rounded"
            >
              Start Camera
            </button>
          ) : (
            <button type="button" onClick={stopCamera} className="px-3 py-1 bg-rose-600 text-white rounded">
              Stop Camera
            </button>
          )}
          <span className="text-xs text-slate-500">Use the environment/back camera for best results.</span>
        </div>

        <div className="bg-black/5 rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-auto bg-black" playsInline muted />
        </div>

        {/* offscreen canvas used for scanning */}
        <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />
      </div>

      {/* File Upload */}
      <div className="rounded-lg border p-4 bg-white dark:bg-slate-800">
        <label htmlFor="qr-file" className="block text-sm font-medium mb-2">
          📁 Upload QR Code Image
        </label>
        <input id="qr-file" type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm" />
        <p className="text-xs text-slate-500 mt-2">PNG/JPG screenshots work well.</p>
      </div>

      {/* Results */}
      {result && (
        <div className="p-4 rounded-lg border shadow bg-white dark:bg-slate-800" aria-live="polite">
          <h4 className="font-semibold mb-2">Decoded Result</h4>
          {result.type === "url" ? (
            <a href={result.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all">
              {result.value}
            </a>
          ) : (
            <p className="break-all">{result.value}</p>
          )}

          {result.warnings.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
