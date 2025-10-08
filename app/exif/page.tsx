"use client";

import React, { useCallback, useRef, useState } from "react";

/* -------------------------
   Utilities & helpers
   ------------------------- */

type ExifMap = Record<string, any>;

function humanBytes(bytes: number) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
function mpCount(w: number, h: number) {
  if (!w || !h) return "—";
  const mp = (w * h) / 1_000_000;
  return `${w} x ${h} (${mp.toFixed(1)} megapixels)`;
}
function formatDateExif(dt?: string | null, fallback?: number) {
  if (typeof dt === "string") {
    // EXIF DateTime format: "YYYY:MM:DD HH:MM:SS"
    const normalized = dt.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d.toLocaleString();
  }
  if (typeof fallback === "number") return new Date(fallback).toLocaleString();
  return "—";
}
function fmtNumber(val: any, digits = 1) {
  if (val == null) return "—";
  const v = Array.isArray(val) ? val[0] : Number(val);
  if (!isFinite(v)) return String(val);
  return v.toFixed(digits);
}
function formatExposureTime(val: any) {
  if (val == null) return "—";
  const v = Array.isArray(val) ? val[0] : Number(val);
  if (!isFinite(v) || v <= 0) return String(val);
  if (v >= 1) return `${v}`; // e.g., "2"
  const denom = Math.round(1 / v);
  if (denom <= 0) return String(v);
  return `1/${denom}`;
}
function interpretFlash(val: any) {
  if (val == null) return "—";
  const code = Array.isArray(val) ? val[0] : Number(val);
  if (isNaN(code)) return String(val);
  const fired = (code & 0x1) === 1;
  const mode = (code & 0x18) === 0x10 ? "Auto" : (code & 0x18) === 0x08 ? "On" : "Unknown";
  return `${mode}, ${fired ? "Fired" : "Did not fire"}`;
}

/* -------------------------
   Minimal EXIF parser (JPEG APP1)
   - Parses IFD0, ExifIFD, GPS IFDs
   - Robust pointer coercion (handles arrays or numeric-like values)
   ------------------------- */

function getString(view: DataView, start: number, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(start + i);
    if (c === 0) break;
    out += String.fromCharCode(c);
  }
  return out;
}
function readUshort(view: DataView, offset: number, little: boolean) {
  return little ? view.getUint16(offset, true) : view.getUint16(offset, false);
}
function readUint(view: DataView, offset: number, little: boolean) {
  return little ? view.getUint32(offset, true) : view.getUint32(offset, false);
}
function readRational(view: DataView, offset: number, little: boolean) {
  const num = readUint(view, offset, little);
  const den = readUint(view, offset + 4, little);
  if (den === 0) return null;
  return num / den;
}

function parseIFD(view: DataView, tiffStart: number, ifdOffset: number, little: boolean) {
  const tags: Record<number, any> = {};
  const dirStart = tiffStart + ifdOffset;
  const entries = readUshort(view, dirStart, little);
  for (let i = 0; i < entries; i++) {
    const entryOffset = dirStart + 2 + i * 12;
    const tag = readUshort(view, entryOffset, little);
    const type = readUshort(view, entryOffset + 2, little);
    const count = readUint(view, entryOffset + 4, little);
    const valueOffsetField = entryOffset + 8;

    const typeByteLen = (() => {
      switch (type) {
        case 1:
          return 1; // BYTE
        case 2:
          return 1; // ASCII
        case 3:
          return 2; // SHORT
        case 4:
          return 4; // LONG
        case 5:
          return 8; // RATIONAL
        case 7:
          return 1; // UNDEFINED
        default:
          return 1;
      }
    })();

    const valueByteLength = count * typeByteLen;
    let valuePointer = 0;
    if (valueByteLength <= 4) {
      valuePointer = valueOffsetField;
    } else {
      const off = readUint(view, valueOffsetField, little);
      valuePointer = tiffStart + off;
    }

    let value: any = null;
    try {
      if (type === 2) {
        // ASCII
        value = getString(view, valuePointer, count);
      } else if (type === 3) {
        // SHORT
        if (count === 1) value = readUshort(view, valuePointer, little);
        else {
          const arr: number[] = [];
          for (let j = 0; j < count; j++) {
            arr.push(readUshort(view, valuePointer + j * 2, little));
          }
          value = arr;
        }
      } else if (type === 4) {
        // LONG
        if (count === 1) value = readUint(view, valuePointer, little);
        else {
          const arr: number[] = [];
          for (let j = 0; j < count; j++) {
            arr.push(readUint(view, valuePointer + j * 4, little));
          }
          value = arr;
        }
      } else if (type === 5) {
        // RATIONAL (numerator/denominator)
        if (count === 1) {
          value = readRational(view, valuePointer, little); // may be number | null
        } else {
          // ensure count and valuePointer are numbers (they are), then safely read rationals
          const arr: number[] = [];
          for (let j = 0; j < count; j++) {
            const offset = valuePointer + j * 8; // number
            const v = readRational(view, offset, little); // number | null
            if (v != null) {
              arr.push(v);
            }
            // if you prefer to keep array length stable, push(v ?? 0) instead
          }
          value = arr;
        }
      } else {
        // OTHER / UNDEFINED / BYTE array
        const arr: number[] = [];
        for (let j = 0; j < Math.min(valueByteLength, 256); j++) {
          arr.push(view.getUint8(valuePointer + j));
        }
        value = arr;
      }
    } catch {
      value = null;
    }
    tags[tag] = value;
  }
  const nextIFDOffset = readUint(view, dirStart + 2 + entries * 12, little); // unused here
  return { tags, nextIFDOffset };
}


/* Tag dictionaries */
const TAGS: Record<number, string> = {
  0x010F: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x0132: "DateTime",
  0x8769: "ExifIFDPointer",
  0x8825: "GPSInfoIFDPointer",
  0x9003: "DateTimeOriginal",
  0x829A: "ExposureTime",
  0x829D: "FNumber",
  0x9209: "Flash",
  0x920A: "FocalLength",
  0x8827: "ISOSpeedRatings",
  0xA001: "ColorSpace",
  0xA002: "PixelXDimension",
  0xA003: "PixelYDimension",
};

const GPS_TAGS: Record<number, string> = {
  0x0000: "GPSVersionID",
  0x0001: "GPSLatitudeRef",
  0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef",
  0x0004: "GPSLongitude",
  0x0005: "GPSAltitudeRef",
  0x0006: "GPSAltitude",
};

function coercePointer(rawPtr: any) {
  if (rawPtr == null) return null;
  if (Array.isArray(rawPtr)) rawPtr = rawPtr[0];
  const n = Number(rawPtr);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function parseExif(arrayBuffer: ArrayBuffer): ExifMap | null {
  const view = new DataView(arrayBuffer);
  let offset = 0;
  const length = view.byteLength;

  while (offset < length) {
    if (view.getUint8(offset) === 0xff && view.getUint8(offset + 1) === 0xe1) {
      const app1Length = view.getUint16(offset + 2, false);
      const exifHeaderStart = offset + 4;
      const header = String.fromCharCode(
        view.getUint8(exifHeaderStart),
        view.getUint8(exifHeaderStart + 1),
        view.getUint8(exifHeaderStart + 2),
        view.getUint8(exifHeaderStart + 3),
        view.getUint8(exifHeaderStart + 4),
        view.getUint8(exifHeaderStart + 5)
      );
      if (!header.startsWith("Exif")) {
        offset += 2 + app1Length;
        continue;
      }

      const tiffOffset = exifHeaderStart + 6;
      const byteOrderMarker = String.fromCharCode(view.getUint8(tiffOffset), view.getUint8(tiffOffset + 1));
      const little = byteOrderMarker === "II";
      const firstIFDOffset = readUint(view, tiffOffset + 4, little);
      const { tags: ifd0Tags } = parseIFD(view, tiffOffset, firstIFDOffset, little);

      const exif: ExifMap = {};
      // map IFD0 tags to names
      Object.entries(ifd0Tags).forEach(([k, v]) => {
        const id = parseInt(k, 10);
        const name = TAGS[id] ?? `Tag_${id.toString(16)}`;
        exif[name] = v;
      });

      // Exif IFD pointer (robust)
      const exifPtrRaw = ifd0Tags[0x8769];
      const exifPointer = coercePointer(exifPtrRaw);
      if (exifPointer) {
        const exifIFD = parseIFD(view, tiffOffset, exifPointer, little).tags;
        Object.entries(exifIFD).forEach(([k, v]) => {
          const id = parseInt(k, 10);
          const name = TAGS[id] ?? `ExifTag_${id.toString(16)}`;
          exif[name] = v;
        });
      }

      // GPS pointer (robust)
      const gpsPtrRaw = ifd0Tags[0x8825];
      const gpsPointer = coercePointer(gpsPtrRaw);
      if (gpsPointer) {
        const gpsIFD = parseIFD(view, tiffOffset, gpsPointer, little).tags;
        const gps: ExifMap = {};
        Object.entries(gpsIFD).forEach(([k, v]) => {
          const id = parseInt(k, 10);
          const name = GPS_TAGS[id] ?? `GPSTag_${id.toString(16)}`;
          gps[name] = v;
        });
        // convert GPS rationals -> decimal
        try {
          if (gps["GPSLatitude"] && gps["GPSLongitude"]) {
            const toDeg = (arr: any[], ref: string) => {
              const deg = Array.isArray(arr) ? arr[0] : arr;
              const min = Array.isArray(arr) ? arr[1] : 0;
              const sec = Array.isArray(arr) ? arr[2] : 0;
              const val = deg + min / 60 + sec / 3600;
              return ref === "S" || ref === "W" ? -val : val;
            };
            gps["DecimalLatitude"] = toDeg(gps["GPSLatitude"], gps["GPSLatitudeRef"]);
            gps["DecimalLongitude"] = toDeg(gps["GPSLongitude"], gps["GPSLongitudeRef"]);
          }
        } catch {}
        exif["GPS"] = gps;
      }

      return exif;
    } else {
      if (view.getUint8(offset) === 0xff) {
        const marker = view.getUint8(offset + 1);
        if (marker === 0xda) break; // start of image data
        const len = view.getUint16(offset + 2, false);
        offset += 2 + len;
      } else offset++;
    }
  }

  return null;
}

/* -------------------------
   Component
   ------------------------- */

export default function ExifViewerMetadata() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fileMeta, setFileMeta] = useState<{
    name?: string;
    size?: number;
    mime?: string;
    width?: number;
    height?: number;
    colorSpace?: string | number | null;
    created?: string | number | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const loadImageDimensions = (blob: Blob) =>
    new Promise<{ w: number; h: number }>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        URL.revokeObjectURL(url);
        resolve({ w, h });
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });

  const processArrayBuffer = async (ab: ArrayBuffer, meta?: { name?: string; size?: number; mime?: string; created?: number }) => {
    setError(null);
    setExif(null);
    setFileMeta(null);
    setImageUrl(null);
    setLoading(true);
    try {
      // preview blob
      const blob = new Blob([ab], { type: meta?.mime ?? "image/*" });
      const previewUrl = URL.createObjectURL(blob);
      setImageUrl(previewUrl);

      // dimensions
      let width: number | undefined;
      let height: number | undefined;
      try {
        const dims = await loadImageDimensions(blob);
        width = dims.w;
        height = dims.h;
      } catch {
        // ignore
      }

      // parse exif
      const parsed = parseExif(ab);
      setExif(parsed);

      // color space mapping if present
      let cs: string | number | null = null;
      if (parsed?.ColorSpace) {
        cs = parsed.ColorSpace === 1 ? "sRGB" : parsed.ColorSpace;
      } else {
        cs = null;
      }

      setFileMeta({
        name: meta?.name,
        size: meta?.size,
        mime: meta?.mime,
        width,
        height,
        colorSpace: cs,
        created: parsed?.DateTimeOriginal ?? meta?.created ?? parsed?.DateTime ?? null,
      });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const onFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const ab = await file.arrayBuffer();
        await processArrayBuffer(ab, { name: file.name, size: file.size, mime: file.type, created: file.lastModified });
      } catch (e: any) {
        setError("Failed to read file: " + (e?.message ?? e));
      } finally {
        // clear file input safely using ref
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        await onFile(e.dataTransfer.files[0]);
      }
    },
    [onFile]
  );

  const onBrowse = () => fileInputRef.current?.click();

  const onUrlFetch = async () => {
    setError(null);
    setExif(null);
    setImageUrl(null);
    setFileMeta(null);
    if (!sourceUrl) {
      setError("Enter an image URL (must permit CORS).");
      return;
    }
    try {
      const parsed = new URL(sourceUrl);
      if (!/^https?:/i.test(parsed.protocol)) {
        setError("Only http(s) URLs allowed.");
        return;
      }
    } catch {
      setError("Invalid URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(sourceUrl, { mode: "cors" });
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      const contentType = res.headers.get("content-type") ?? "image/*";
      const ab = await res.arrayBuffer();
      // derive filename if possible
      let filename = undefined;
      const cd = res.headers.get("content-disposition");
      if (cd) {
        const m = cd.match(/filename="?([^";]+)"?/);
        if (m) filename = m[1];
      }
      if (!filename) {
        try {
          const p = new URL(sourceUrl);
          filename = decodeURIComponent(p.pathname.split("/").pop() || "");
        } catch {}
      }
      // option 2: omit created field
await processArrayBuffer(ab, { name: filename, size: ab.byteLength, mime: contentType });

    } catch (err: any) {
      setError(
        `Failed to fetch image. Remote host must permit cross-origin reads (CORS). (${err?.message ?? err})`
      );
    } finally {
      setLoading(false);
    }
  };

  /* derived UI values */
  const displayName = fileMeta?.name ?? "—";
  const displaySize = fileMeta?.size ? `${humanBytes(fileMeta.size)} (${fileMeta.size} bytes)` : "—";
  const displayMime = fileMeta?.mime ?? "—";
  const displayImageSize = fileMeta?.width && fileMeta?.height ? mpCount(fileMeta.width, fileMeta.height) : "—";
  const displayColorSpace = fileMeta?.colorSpace ?? "—";
  const displayCreated = formatDateExif(typeof fileMeta?.created === "string" ? fileMeta?.created : null, typeof fileMeta?.created === "number" ? fileMeta.created : undefined);

  /* camera settings */
  const cameraMake = exif?.Make ?? "—";
  const cameraModel = exif?.Model ?? "—";
  const focalRaw = exif?.FocalLength ?? null;
  const focal = Array.isArray(focalRaw) ? focalRaw[0] : focalRaw;
  const apertureRaw = exif?.FNumber ?? null;
  const exposureRaw = exif?.ExposureTime ?? null;
  const isoRaw = exif?.ISOSpeedRatings ?? null;
  const flash = interpretFlash(exif?.Flash);

  const gps = exif?.GPS;
  const gpsText = gps && gps.DecimalLatitude && gps.DecimalLongitude ? `${gps.DecimalLatitude.toFixed(6)}, ${gps.DecimalLongitude.toFixed(6)}` : "No GPS data";

  return (
    <section className="max-w-4xl mx-auto p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">EXIF Viewer — Detailed Metadata</h1>
        <p className="text-sm text-slate-500 mt-1">
          Shows rich image metadata: file info, camera settings and location (when available).
        </p>
      </header>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded border border-dashed p-4 bg-white"
      >
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700">Image URL (optional)</label>
            <div className="flex gap-2 mt-1">
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button onClick={onUrlFetch} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
                Fetch
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-2">Or drag & drop / upload a file (recommended for reliable metadata).</div>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) await onFile(f);
                // clear using ref (onFile also clears)
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <button onClick={onBrowse} className="px-3 py-2 border rounded text-sm">
              Browse
            </button>
            <button
              onClick={() => {
                setExif(null);
                setImageUrl(null);
                setFileMeta(null);
                setSourceUrl("");
                setError(null);
              }}
              className="px-3 py-2 border rounded text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* main grid */}
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="rounded border bg-slate-50 p-3 min-h-[220px] flex items-center justify-center">
            {loading ? (
              <div>Loading…</div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Preview" className="max-h-96 object-contain" />
            ) : (
              <div className="text-slate-400">Preview will appear here</div>
            )}
          </div>

          <div className="rounded border bg-slate-900 text-slate-50 p-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold">Image metadata</h2>
            </div>

            <table className="w-full mt-3 text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-medium">Name</td>
                  <td className="py-1">{displayName}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">File size</td>
                  <td className="py-1">{displaySize}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">File type</td>
                  <td className="py-1">{displayMime.startsWith("image/") ? "JPEG" : displayMime}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">MIME type</td>
                  <td className="py-1">{displayMime}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Image size</td>
                  <td className="py-1">{displayImageSize}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Color space</td>
                  <td className="py-1">{displayColorSpace ?? "—"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Created</td>
                  <td className="py-1">{displayCreated}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Camera settings */}
          <div className="rounded border bg-white p-3">
            <h3 className="text-sm font-semibold">Camera settings</h3>
            <table className="w-full mt-3 text-sm">
              <tbody>
                <tr>
                  <td className="py-1 font-medium">Make</td>
                  <td className="py-1">{cameraMake}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Model</td>
                  <td className="py-1">{cameraModel}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Focal length</td>
                  <td className="py-1">{focal ? `${fmtNumber(focal, 1)} mm` : "—"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Aperture</td>
                  <td className="py-1">{apertureRaw ? fmtNumber(Array.isArray(apertureRaw) ? apertureRaw[0] : apertureRaw, 1) : "—"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Exposure</td>
                  <td className="py-1">{formatExposureTime(exposureRaw)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">ISO</td>
                  <td className="py-1">{isoRaw ?? "—"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Flash</td>
                  <td className="py-1">{flash}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* right column: location & actions */}
        <aside className="space-y-3">
          <div className="rounded border bg-white p-3">
            <h3 className="text-sm font-semibold">Location</h3>
            <div className="mt-2 text-sm">
              <div>{gpsText}</div>
              {gps && gps.DecimalLatitude && gps.DecimalLongitude && (
                <div className="mt-2">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                    href={`https://www.google.com/maps/search/?api=1&query=${gps.DecimalLatitude},${gps.DecimalLongitude}`}
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="rounded border bg-white p-3">
            <h3 className="text-sm font-semibold">Quick actions</h3>
            <div className="flex flex-col gap-2 mt-2">
              <button
                className="px-3 py-2 border rounded text-sm"
                onClick={() => {
                  const payload = {
                    name: displayName,
                    size: fileMeta?.size,
                    mime: fileMeta?.mime,
                    dimensions: fileMeta?.width && fileMeta?.height ? { w: fileMeta.width, h: fileMeta.height } : undefined,
                    exif,
                  };
                  navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
                  alert("Metadata copied to clipboard");
                }}
                disabled={!exif && !fileMeta}
              >
                Copy metadata
              </button>

              <button
                className="px-3 py-2 border rounded text-sm"
                onClick={() => {
                  const md = [`# EXIF Metadata`, `**Name:** ${displayName}`, `**File size:** ${displaySize}`, `**MIME:** ${displayMime}`, `**Image size:** ${displayImageSize}`, `**Created:** ${displayCreated}`, ``, `## Camera settings`, `- Make: ${cameraMake}`, `- Model: ${cameraModel}`, `- Focal length: ${focal ? `${fmtNumber(focal,1)} mm` : "—"}`, `- Aperture: ${apertureRaw ? fmtNumber(Array.isArray(apertureRaw) ? apertureRaw[0] : apertureRaw,1) : "—"}`, `- Exposure: ${formatExposureTime(exposureRaw)}`, `- ISO: ${isoRaw ?? "—"}`, `- Flash: ${flash}`, ``, `## Location`, `- ${gpsText}`].join("\n");
                  const blob = new Blob([md], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `exif_${displayName || "image"}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!exif && !fileMeta}
              >
                Export Markdown
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded border bg-red-50 p-3 text-sm text-red-700">
              ⚠ {error}
            </div>
          )}
        </aside>
      </div>

      <footer className="mt-4 text-xs text-slate-500">
        Note: This viewer extracts common EXIF fields. For complete metadata coverage use a dedicated EXIF library (exifreader / exif-js).
      </footer>
    </section>
  );
}
