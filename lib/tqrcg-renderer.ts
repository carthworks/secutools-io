// File: lib/tqrcg-renderer.ts
import { QRMatrix, ModuleType, QRCodeEncoder, ErrorCorrectionLevel } from "./qr-engine";

export type DotShape = "square" | "dots" | "rounded" | "classy" | "fluid";
export type EyeFrameShape = "square" | "rounded" | "circle" | "leaf";
export type EyePupilShape = "square" | "rounded" | "circle" | "diamond";
export type GradientType = "none" | "linear" | "radial";
export type FrameStyle = "none" | "tqrcg-banner" | "badge-top" | "badge-bottom" | "card-frame";

export interface TQRCGOptions {
  // Data
  text: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  
  // Body dot styling
  dotShape: DotShape;
  colorType: GradientType;
  fgColor1: string;
  fgColor2: string;
  gradientAngle?: number; // in degrees, default 45
  bgColor: string; // hex or "transparent"

  // Eye styling
  eyeFrameShape: EyeFrameShape;
  eyePupilShape: EyePupilShape;
  useCustomEyeColor: boolean;
  eyeOuterColor: string;
  eyeInnerColor: string;

  // Center Logo
  logoSrc?: string; // data URL or SVG/image URL
  logoSize: number; // 0.15 to 0.30
  logoBackground: "circle" | "rounded" | "none";
  logoBgColor: string;
  logoPadding: number;

  // TQRCG Frame / Banner
  frameStyle: FrameStyle;
  frameText: string;
  frameTextColor: string;
  frameBgColor: string;
  
  // Implanted Image (Artistic QR / Photo Mosaic)
  implantedImageSrc?: string;
  implantedImageMode?: "pixel-sampler" | "background-blend" | "center-watermark" | "none";
  implantedImageOpacity?: number; // 0.1 to 1.0

  // Canvas output dimension
  margin: number; // in modules, e.g. 2 to 4
  size: number; // pixel width/height e.g. 600
}

export const DEFAULT_TQRCG_OPTIONS: TQRCGOptions = {
  text: "https://carthworks.vercel.app/",
  errorCorrectionLevel: "H",
  dotShape: "dots",
  colorType: "none",
  fgColor1: "#0284c7",
  fgColor2: "#0369a1",
  gradientAngle: 45,
  bgColor: "#ffffff",
  eyeFrameShape: "rounded",
  eyePupilShape: "rounded",
  useCustomEyeColor: true,
  eyeOuterColor: "#b91c1c",
  eyeInnerColor: "#b91c1c",
  logoSrc: "",
  logoSize: 0.22,
  logoBackground: "circle",
  logoBgColor: "#ffffff",
  logoPadding: 6,
  frameStyle: "tqrcg-banner",
  frameText: "To use logos, create a Dynamic QR Code",
  frameTextColor: "#ffffff",
  frameBgColor: "#65a30d",
  implantedImageSrc: "",
  implantedImageMode: "none",
  implantedImageOpacity: 0.5,
  margin: 3,
  size: 640,
};

export const TQRCG_PRESETS: { id: string; name: string; options: Partial<TQRCGOptions>; previewBadge: string }[] = [
  {
    id: "tqrcg-original",
    name: "TQRCG Blue & Brick",
    previewBadge: "🚀",
    options: {
      dotShape: "dots",
      colorType: "none",
      fgColor1: "#0284c7",
      bgColor: "#ffffff",
      eyeFrameShape: "rounded",
      eyePupilShape: "rounded",
      useCustomEyeColor: true,
      eyeOuterColor: "#b91c1c",
      eyeInnerColor: "#b91c1c",
      frameStyle: "tqrcg-banner",
      frameText: "To use logos, create a Dynamic QR Code",
      frameTextColor: "#ffffff",
      frameBgColor: "#65a30d",
    },
  },
  {
    id: "classic-mono",
    name: "Classic Monochrome",
    previewBadge: "⬛",
    options: {
      dotShape: "square",
      colorType: "none",
      fgColor1: "#000000",
      bgColor: "#ffffff",
      eyeFrameShape: "square",
      eyePupilShape: "square",
      useCustomEyeColor: false,
      eyeOuterColor: "#000000",
      eyeInnerColor: "#000000",
      frameStyle: "none",
    },
  },
  {
    id: "cyber-violet",
    name: "Cyberpunk Violet",
    previewBadge: "⚡",
    options: {
      dotShape: "rounded",
      colorType: "linear",
      fgColor1: "#8b5cf6",
      fgColor2: "#06b6d4",
      gradientAngle: 135,
      bgColor: "#0f172a",
      eyeFrameShape: "rounded",
      eyePupilShape: "circle",
      useCustomEyeColor: true,
      eyeOuterColor: "#38bdf8",
      eyeInnerColor: "#a855f7",
      frameStyle: "card-frame",
      frameText: "SECURE SCAN",
      frameTextColor: "#38bdf8",
      frameBgColor: "#1e293b",
    },
  },
  {
    id: "emerald-shield",
    name: "Emerald Security",
    previewBadge: "🛡️",
    options: {
      dotShape: "classy",
      colorType: "linear",
      fgColor1: "#059669",
      fgColor2: "#10b981",
      bgColor: "#f0fdf4",
      eyeFrameShape: "leaf",
      eyePupilShape: "rounded",
      useCustomEyeColor: true,
      eyeOuterColor: "#047857",
      eyeInnerColor: "#10b981",
      frameStyle: "badge-bottom",
      frameText: "VERIFIED SECURE",
      frameTextColor: "#ffffff",
      frameBgColor: "#059669",
    },
  },
  {
    id: "sunset-glow",
    name: "Sunset Orange",
    previewBadge: "🌅",
    options: {
      dotShape: "fluid",
      colorType: "linear",
      fgColor1: "#f97316",
      fgColor2: "#ec4899",
      gradientAngle: 45,
      bgColor: "#ffffff",
      eyeFrameShape: "circle",
      eyePupilShape: "circle",
      useCustomEyeColor: true,
      eyeOuterColor: "#ea580c",
      eyeInnerColor: "#db2777",
      frameStyle: "badge-top",
      frameText: "SCAN ME",
      frameTextColor: "#ffffff",
      frameBgColor: "#ea580c",
    },
  },
  {
    id: "midnight-gold",
    name: "Midnight Luxury",
    previewBadge: "👑",
    options: {
      dotShape: "dots",
      colorType: "linear",
      fgColor1: "#eab308",
      fgColor2: "#f59e0b",
      bgColor: "#18181b",
      eyeFrameShape: "rounded",
      eyePupilShape: "diamond",
      useCustomEyeColor: true,
      eyeOuterColor: "#fbbf24",
      eyeInnerColor: "#d97706",
      frameStyle: "card-frame",
      frameText: "EXCLUSIVE ACCESS",
      frameTextColor: "#fbbf24",
      frameBgColor: "#27272a",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Built-in SVG Icons for Center Logo                                         */
/* -------------------------------------------------------------------------- */

export const BUILTIN_LOGOS = [
  {
    id: "rocket",
    name: "Rocket (TQRCG)",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  },
  {
    id: "shield",
    name: "SecuTools Shield",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    id: "lock",
    name: "Security Lock",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  },
  {
    id: "globe",
    name: "Web Link",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  },
  {
    id: "qr",
    name: "QR Scan",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>`,
  },
  {
    id: "image",
    name: "Photo / Image",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  },
  {
    id: "sparkles",
    name: "Sparkles AI",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
  {
    id: "wifi",
    name: "Wi-Fi Signal",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>`,
  },
  {
    id: "bitcoin",
    name: "Crypto Bitcoin",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c3.926.692 4.966-4.807.828-5.5m-2.044 7.47-5.908-1.042m7.952-6.428-.347 1.97m-1.216-1.97-5.908-1.042m0 0 .347-1.97m0 0 1.97.347m5.908 1.042 1.97.347"/></svg>`,
  },
  {
    id: "calendar",
    name: "Calendar Event",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="m9 16 2 2 4-4"/></svg>`,
  },
  {
    id: "map-pin",
    name: "Geo Location",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
];

/* -------------------------------------------------------------------------- */
/* Canvas Drawing Implementation                                              */
/* -------------------------------------------------------------------------- */

export async function renderTQRCGCanvas(
  canvas: HTMLCanvasElement,
  options: TQRCGOptions
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const matrix: QRMatrix = QRCodeEncoder.create(
    options.text || " ",
    options.errorCorrectionLevel
  );

  const moduleCount = matrix.size;
  const margin = options.margin;
  const totalModules = moduleCount + margin * 2;

  // Frame heights calculations
  let extraTopHeight = 0;
  let extraBottomHeight = 0;
  let bannerHeight = 0;

  if (options.frameStyle === "badge-top") {
    extraTopHeight = 56;
  } else if (options.frameStyle === "badge-bottom") {
    extraBottomHeight = 56;
  } else if (options.frameStyle === "tqrcg-banner") {
    bannerHeight = 44;
    extraBottomHeight = bannerHeight;
  } else if (options.frameStyle === "card-frame") {
    extraTopHeight = 48;
    extraBottomHeight = 48;
  }

  const canvasWidth = options.size;
  const qrAreaSize = canvasWidth;
  const moduleSize = qrAreaSize / totalModules;
  const canvasHeight = Math.round(qrAreaSize + extraTopHeight + extraBottomHeight);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // 1. Draw Background
  if (options.bgColor === "transparent") {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 2. Setup Foreground FillStyle (Gradient or Solid)
  let fgStyle: string | CanvasGradient = options.fgColor1;
  const qrTop = extraTopHeight + margin * moduleSize;
  const qrLeft = margin * moduleSize;
  const qrRight = qrLeft + moduleCount * moduleSize;
  const qrBottom = qrTop + moduleCount * moduleSize;
  const qrAreaWidth = qrRight - qrLeft;
  const qrAreaHeight = qrBottom - qrTop;

  // Load Implanted Image if active
  let loadedImplantImg: HTMLImageElement | null = null;
  let implantPixelData: ImageData | null = null;

  if (options.implantedImageSrc && options.implantedImageMode && options.implantedImageMode !== "none") {
    try {
      loadedImplantImg = new Image();
      loadedImplantImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        if (!loadedImplantImg) return resolve();
        loadedImplantImg.onload = () => resolve();
        loadedImplantImg.onerror = () => reject(new Error("Failed to load implanted image"));
        loadedImplantImg.src = options.implantedImageSrc!;
      });

      // If pixel-sampler mode or background-blend, prepare offscreen canvas
      const offCanvas = document.createElement("canvas");
      offCanvas.width = moduleCount;
      offCanvas.height = moduleCount;
      const offCtx = offCanvas.getContext("2d");
      if (offCtx && loadedImplantImg) {
        offCtx.drawImage(loadedImplantImg, 0, 0, moduleCount, moduleCount);
        implantPixelData = offCtx.getImageData(0, 0, moduleCount, moduleCount);
      }

      // Draw background blend if selected
      if (options.implantedImageMode === "background-blend" && loadedImplantImg) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(options.implantedImageOpacity ?? 0.45, 0.9));
        ctx.drawImage(loadedImplantImg, qrLeft, qrTop, qrAreaWidth, qrAreaHeight);
        ctx.restore();
      }
    } catch {
      // Gracefully continue if image fails
    }
  }

  if (options.colorType === "linear") {
    const angleRad = ((options.gradientAngle ?? 45) * Math.PI) / 180;
    const cx = (qrLeft + qrRight) / 2;
    const cy = (qrTop + qrBottom) / 2;
    const len = (qrRight - qrLeft) / 2;
    const x0 = cx - Math.cos(angleRad) * len;
    const y0 = cy - Math.sin(angleRad) * len;
    const x1 = cx + Math.cos(angleRad) * len;
    const y1 = cy + Math.sin(angleRad) * len;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, options.fgColor1);
    grad.addColorStop(1, options.fgColor2 || options.fgColor1);
    fgStyle = grad;
  } else if (options.colorType === "radial") {
    const cx = (qrLeft + qrRight) / 2;
    const cy = (qrTop + qrBottom) / 2;
    const radius = ((qrRight - qrLeft) / 2) * 1.2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, options.fgColor1);
    grad.addColorStop(1, options.fgColor2 || options.fgColor1);
    fgStyle = grad;
  }

  // 3. Identify Finder Areas to skip default body drawing
  const isFinderModule = (r: number, c: number): boolean => {
    return (
      (r < 7 && c < 7) ||
      (r < 7 && c >= moduleCount - 7) ||
      (r >= moduleCount - 7 && c < 7)
    );
  };

  // 4. Logo clearance area (if logo is active, optionally clear center modules for readability)
  let logoCleared = false;
  let logoMinR = 0,
    logoMaxR = 0,
    logoMinC = 0,
    logoMaxC = 0;
  if (options.logoSrc || options.implantedImageMode === "center-watermark") {
    const logoRatio = Math.min(Math.max(options.logoSize, 0.12), 0.32);
    const logoModuleSpan = Math.floor(moduleCount * logoRatio);
    const center = Math.floor(moduleCount / 2);
    logoMinR = center - Math.floor(logoModuleSpan / 2);
    logoMaxR = center + Math.ceil(logoModuleSpan / 2);
    logoMinC = center - Math.floor(logoModuleSpan / 2);
    logoMaxC = center + Math.ceil(logoModuleSpan / 2);
    logoCleared = true;
  }

  // 5. Draw Body Modules
  ctx.fillStyle = fgStyle;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderModule(r, c)) continue;
      if (!matrix.modules[r][c]) continue;

      // Check if inside logo area
      if (logoCleared && r >= logoMinR && r <= logoMaxR && c >= logoMinC && c <= logoMaxC) {
        continue;
      }

      const x = qrLeft + c * moduleSize;
      const y = qrTop + r * moduleSize;

      // If pixel-sampler mode is active, sample color from implanted photo!
      if (options.implantedImageMode === "pixel-sampler" && implantPixelData) {
        const pIdx = (r * moduleCount + c) * 4;
        const pr = implantPixelData.data[pIdx];
        const pg = implantPixelData.data[pIdx + 1];
        const pb = implantPixelData.data[pIdx + 2];
        // Darken slightly to guarantee sharp contrast for camera scanners
        const factor = 0.5;
        ctx.fillStyle = `rgb(${Math.floor(pr * factor)}, ${Math.floor(pg * factor)}, ${Math.floor(pb * factor)})`;
      } else {
        ctx.fillStyle = fgStyle;
      }

      drawDot(ctx, x, y, moduleSize, options.dotShape, r, c, matrix, qrLeft, qrTop);
    }
  }

  // 6. Draw 3 Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 },
  ];

  for (const pos of finderPositions) {
    const eyeX = qrLeft + pos.c * moduleSize;
    const eyeY = qrTop + pos.r * moduleSize;
    const eyeSize = 7 * moduleSize;

    drawFinderPattern(
      ctx,
      eyeX,
      eyeY,
      eyeSize,
      moduleSize,
      options,
      pos.r === 0 && pos.c === 0 ? "tl" : pos.r === 0 ? "tr" : "bl"
    );
  }

  // 7. Draw Center Logo (if present)
  if (options.logoSrc) {
    await drawCenterLogo(
      ctx,
      (qrLeft + qrRight) / 2,
      (qrTop + qrBottom) / 2,
      (qrRight - qrLeft) * options.logoSize,
      options
    );
  }

  // 8. Draw TQRCG Frame / Banner
  drawFrame(ctx, canvasWidth, canvasHeight, extraTopHeight, extraBottomHeight, options);
}

/* -------------------------------------------------------------------------- */
/* Module Dot Drawing Helper                                                  */
/* -------------------------------------------------------------------------- */

function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: DotShape,
  r: number,
  c: number,
  matrix: QRMatrix,
  qrLeft: number,
  qrTop: number
): void {
  const pad = size * 0.05;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const rx = x + pad;
  const ry = y + pad;

  ctx.beginPath();

  switch (shape) {
    case "dots": {
      const radius = (size * 0.92) / 2;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rounded": {
      const radius = size * 0.35;
      drawRoundedRectPath(ctx, rx, ry, w, h, radius);
      ctx.fill();
      break;
    }
    case "classy": {
      // Starry diamond shape
      ctx.moveTo(cx, ry);
      ctx.lineTo(rx + w, cy);
      ctx.lineTo(cx, ry + h);
      ctx.lineTo(rx, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "fluid": {
      // Fluid connecting dots: round only corners that do not connect to adjacent modules
      const top = r > 0 && matrix.modules[r - 1][c];
      const bottom = r < matrix.size - 1 && matrix.modules[r + 1][c];
      const left = c > 0 && matrix.modules[r][c - 1];
      const right = c < matrix.size - 1 && matrix.modules[r][c + 1];

      const rad = size * 0.45;
      const rtl = !top && !left ? rad : 0;
      const rtr = !top && !right ? rad : 0;
      const rbr = !bottom && !right ? rad : 0;
      const rbl = !bottom && !left ? rad : 0;

      drawCustomRoundedRect(ctx, rx, ry, w, h, rtl, rtr, rbr, rbl);
      ctx.fill();
      break;
    }
    case "square":
    default: {
      ctx.fillRect(rx, ry, w, h);
      break;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Finder Eye Drawing Helper                                                  */
/* -------------------------------------------------------------------------- */

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  moduleSize: number,
  options: TQRCGOptions,
  corner: "tl" | "tr" | "bl"
): void {
  const outerColor = options.useCustomEyeColor ? options.eyeOuterColor : options.fgColor1;
  const innerColor = options.useCustomEyeColor ? options.eyeInnerColor : options.fgColor1;

  ctx.save();

  // 1. Outer Frame (7x7 modules)
  ctx.fillStyle = outerColor;
  drawEyeOuterFrame(ctx, x, y, size, moduleSize, options.eyeFrameShape, corner);

  // 2. Clear Space (between outer frame and pupil)
  const spaceOffset = moduleSize;
  const spaceSize = size - 2 * moduleSize;
  if (options.bgColor === "transparent") {
    ctx.clearRect(x + spaceOffset, y + spaceOffset, spaceSize, spaceSize);
  } else {
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(x + spaceOffset, y + spaceOffset, spaceSize, spaceSize);
  }

  // 3. Inner Pupil (3x3 modules)
  const pupilOffset = 2 * moduleSize;
  const pupilSize = 3 * moduleSize;
  ctx.fillStyle = innerColor;
  drawEyePupil(ctx, x + pupilOffset, y + pupilOffset, pupilSize, options.eyePupilShape, corner);

  ctx.restore();
}

function drawEyeOuterFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  modSize: number,
  shape: EyeFrameShape,
  corner: "tl" | "tr" | "bl"
): void {
  ctx.beginPath();

  switch (shape) {
    case "rounded": {
      // Outer rounded rect with inner cutout
      const rOuter = size * 0.28;
      const rInner = Math.max(0, (size - 2 * modSize) * 0.2);

      drawRoundedRectPath(ctx, x, y, size, size, rOuter);
      // Cutout inner in counter-clockwise for compound path
      drawRoundedRectPath(ctx, x + modSize, y + modSize, size - 2 * modSize, size - 2 * modSize, rInner, true);
      ctx.fill();
      break;
    }
    case "circle": {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2, false);
      ctx.arc(cx, cy, (size - 2 * modSize) / 2, 0, Math.PI * 2, true);
      ctx.fill();
      break;
    }
    case "leaf": {
      // Organic leaf shape pointing inwards or outwards
      const r0 = size * 0.45;
      let rtl = 0,
        rtr = 0,
        rbr = 0,
        rbl = 0;
      if (corner === "tl") {
        rtl = r0;
        rbr = r0;
      } else if (corner === "tr") {
        rtr = r0;
        rbl = r0;
      } else {
        rbl = r0;
        rtr = r0;
      }
      drawCustomRoundedRect(ctx, x, y, size, size, rtl, rtr, rbr, rbl);
      drawCustomRoundedRect(
        ctx,
        x + modSize,
        y + modSize,
        size - 2 * modSize,
        size - 2 * modSize,
        rtl * 0.6,
        rtr * 0.6,
        rbr * 0.6,
        rbl * 0.6,
        true
      );
      ctx.fill();
      break;
    }
    case "square":
    default: {
      ctx.rect(x, y, size, size);
      ctx.rect(x + modSize, y + modSize, size - 2 * modSize, size - 2 * modSize);
      ctx.fill("evenodd");
      break;
    }
  }
}

function drawEyePupil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: EyePupilShape,
  corner: "tl" | "tr" | "bl"
): void {
  ctx.beginPath();
  const cx = x + size / 2;
  const cy = y + size / 2;

  switch (shape) {
    case "rounded": {
      const rad = size * 0.35;
      drawRoundedRectPath(ctx, x, y, size, size, rad);
      ctx.fill();
      break;
    }
    case "circle": {
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "diamond": {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + size, cy);
      ctx.lineTo(cx, y + size);
      ctx.lineTo(x, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "square":
    default: {
      ctx.fillRect(x, y, size, size);
      break;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Center Logo Drawing Helper                                                 */
/* -------------------------------------------------------------------------- */

async function drawCenterLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  logoSize: number,
  options: TQRCGOptions
): Promise<void> {
  const pad = options.logoPadding;
  const bgSize = logoSize + pad * 2;
  const bgX = cx - bgSize / 2;
  const bgY = cy - bgSize / 2;

  ctx.save();

  // Draw Logo Background Badge
  if (options.logoBackground !== "none") {
    ctx.fillStyle = options.logoBgColor || "#ffffff";
    ctx.beginPath();
    if (options.logoBackground === "circle") {
      ctx.arc(cx, cy, bgSize / 2, 0, Math.PI * 2);
    } else {
      drawRoundedRectPath(ctx, bgX, bgY, bgSize, bgSize, bgSize * 0.28);
    }
    ctx.fill();

    // Subtle border shadow
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Load and draw image
  if (options.logoSrc) {
    try {
      let imgSrc = options.logoSrc;

      // If it's a raw SVG string or built-in, convert to data URI
      if (imgSrc.startsWith("<svg")) {
        imgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(imgSrc)}`;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load logo image"));
        img.src = imgSrc;
      });

      const imgX = cx - logoSize / 2;
      const imgY = cy - logoSize / 2;
      ctx.drawImage(img, imgX, imgY, logoSize, logoSize);
    } catch {
      // Ignore logo draw failure gracefully
    }
  }

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* TQRCG Frame / Banner Drawing Helper                                        */
/* -------------------------------------------------------------------------- */

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  topH: number,
  bottomH: number,
  options: TQRCGOptions
): void {
  if (options.frameStyle === "none") return;

  ctx.save();

  if (options.frameStyle === "tqrcg-banner") {
    // Exact TQRCG Style Banner at bottom of QR Code
    const bannerY = h - bottomH;
    ctx.fillStyle = options.frameBgColor || "#65a30d";
    
    // Bottom rounded banner bar
    drawCustomRoundedRect(ctx, 0, bannerY, w, bottomH, 0, 0, 8, 8);
    ctx.fill();

    // Banner Text
    ctx.fillStyle = options.frameTextColor || "#ffffff";
    ctx.font = "bold 18px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.frameText || "To use logos, create a Dynamic QR Code", w / 2, bannerY + bottomH / 2);
  } else if (options.frameStyle === "badge-top") {
    // Top CTA header
    ctx.fillStyle = options.frameBgColor || "#0284c7";
    drawCustomRoundedRect(ctx, 0, 0, w, topH, 12, 12, 0, 0);
    ctx.fill();

    ctx.fillStyle = options.frameTextColor || "#ffffff";
    ctx.font = "bold 20px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.frameText || "SCAN ME", w / 2, topH / 2);
  } else if (options.frameStyle === "badge-bottom") {
    // Bottom CTA footer
    const bannerY = h - bottomH;
    ctx.fillStyle = options.frameBgColor || "#0284c7";
    drawCustomRoundedRect(ctx, 0, bannerY, w, bottomH, 0, 0, 12, 12);
    ctx.fill();

    ctx.fillStyle = options.frameTextColor || "#ffffff";
    ctx.font = "bold 20px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.frameText || "SCAN ME", w / 2, bannerY + bottomH / 2);
  } else if (options.frameStyle === "card-frame") {
    // Elegant frame card around QR code with header and footer
    ctx.strokeStyle = options.frameBgColor || "#38bdf8";
    ctx.lineWidth = 3;
    drawRoundedRectPath(ctx, 6, 6, w - 12, h - 12, 16);
    ctx.stroke();

    ctx.fillStyle = options.frameTextColor || "#38bdf8";
    ctx.font = "bold 16px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.frameText || "SECURE QR CODE", w / 2, topH / 2);
  }

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Geometry Utilities                                                         */
/* -------------------------------------------------------------------------- */

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  counterClockwise = false
): void {
  const rad = Math.min(r, w / 2, h / 2);
  if (counterClockwise) {
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x, y + rad);
    ctx.arcTo(x, y + h, x + rad, y + h, rad);
    ctx.arcTo(x + w, y + h, x + w, y + h - rad, rad);
    ctx.arcTo(x + w, y, x + w - rad, y, rad);
    ctx.arcTo(x, y, x, y + rad, rad);
    ctx.closePath();
    return;
  }
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawCustomRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rtl: number,
  rtr: number,
  rbr: number,
  rbl: number,
  counterClockwise = false
): void {
  if (counterClockwise) {
    ctx.moveTo(x + rtl, y);
    ctx.lineTo(x, y + rtl);
    ctx.lineTo(x, y + h - rbl);
    if (rbl) ctx.arcTo(x, y + h, x + rbl, y + h, rbl);
    ctx.lineTo(x + w - rbr, y + h);
    if (rbr) ctx.arcTo(x + w, y + h, x + w, y + h - rbr, rbr);
    ctx.lineTo(x + w, y + rtr);
    if (rtr) ctx.arcTo(x + w, y, x + w - rtr, y, rtr);
    ctx.lineTo(x + rtl, y);
    if (rtl) ctx.arcTo(x, y, x, y + rtl, rtl);
    ctx.closePath();
    return;
  }
  ctx.moveTo(x + rtl, y);
  ctx.lineTo(x + w - rtr, y);
  if (rtr) ctx.arcTo(x + w, y, x + w, y + rtr, rtr);
  ctx.lineTo(x + w, y + h - rbr);
  if (rbr) ctx.arcTo(x + w, y + h, x + w - rbr, y + h, rbr);
  ctx.lineTo(x + rbl, y + h);
  if (rbl) ctx.arcTo(x, y + h, x, y + h - rbl, rbl);
  ctx.lineTo(x, y + rtl);
  if (rtl) ctx.arcTo(x, y, x + rtl, y, rtl);
  ctx.closePath();
}

/* -------------------------------------------------------------------------- */
/* SVG Generation Helper (Vector format)                                      */
/* -------------------------------------------------------------------------- */

export function generateTQRCGSVG(options: TQRCGOptions): string {
  const matrix = QRCodeEncoder.create(
    options.text || " ",
    options.errorCorrectionLevel
  );

  const moduleCount = matrix.size;
  const margin = options.margin;
  const totalModules = moduleCount + margin * 2;
  const size = options.size;
  const modSize = size / totalModules;

  let extraTop = 0;
  let extraBottom = 0;
  if (options.frameStyle === "badge-top") extraTop = 56;
  else if (options.frameStyle === "badge-bottom") extraBottom = 56;
  else if (options.frameStyle === "tqrcg-banner") extraBottom = 44;
  else if (options.frameStyle === "card-frame") {
    extraTop = 48;
    extraBottom = 48;
  }

  const svgH = size + extraTop + extraBottom;
  const qrTop = extraTop + margin * modSize;
  const qrLeft = margin * modSize;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${svgH}" width="${size}" height="${svgH}">\n`;

  // Background
  if (options.bgColor !== "transparent") {
    svgContent += `  <rect width="${size}" height="${svgH}" fill="${options.bgColor}" />\n`;
  }

  // Defs (Gradients)
  svgContent += `  <defs>\n`;
  if (options.colorType === "linear") {
    svgContent += `    <linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">\n`;
    svgContent += `      <stop offset="0%" stop-color="${options.fgColor1}" />\n`;
    svgContent += `      <stop offset="100%" stop-color="${options.fgColor2 || options.fgColor1}" />\n`;
    svgContent += `    </linearGradient>\n`;
  }
  svgContent += `  </defs>\n`;

  const fillAttr = options.colorType === "linear" ? 'url(#qrGrad)' : options.fgColor1;

  // Draw body dots
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= moduleCount - 7) || (r >= moduleCount - 7 && c < 7);

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinder(r, c) || !matrix.modules[r][c]) continue;
      const x = qrLeft + c * modSize;
      const y = qrTop + r * modSize;

      if (options.dotShape === "dots") {
        svgContent += `  <circle cx="${x + modSize / 2}" cy="${y + modSize / 2}" r="${(modSize * 0.92) / 2}" fill="${fillAttr}" />\n`;
      } else if (options.dotShape === "rounded") {
        svgContent += `  <rect x="${x + modSize * 0.05}" y="${y + modSize * 0.05}" width="${modSize * 0.9}" height="${modSize * 0.9}" rx="${modSize * 0.3}" fill="${fillAttr}" />\n`;
      } else {
        svgContent += `  <rect x="${x}" y="${y}" width="${modSize}" height="${modSize}" fill="${fillAttr}" />\n`;
      }
    }
  }

  // Draw Finders
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 },
  ];
  const outerColor = options.useCustomEyeColor ? options.eyeOuterColor : options.fgColor1;
  const innerColor = options.useCustomEyeColor ? options.eyeInnerColor : options.fgColor1;

  for (const pos of finderPositions) {
    const fx = qrLeft + pos.c * modSize;
    const fy = qrTop + pos.r * modSize;
    const fsize = 7 * modSize;
    const rx = options.eyeFrameShape === "rounded" ? fsize * 0.28 : options.eyeFrameShape === "circle" ? fsize / 2 : 0;

    // Outer
    svgContent += `  <rect x="${fx}" y="${fy}" width="${fsize}" height="${fsize}" rx="${rx}" fill="${outerColor}" />\n`;
    // Space Cutout
    svgContent += `  <rect x="${fx + modSize}" y="${fy + modSize}" width="${fsize - 2 * modSize}" height="${fsize - 2 * modSize}" rx="${Math.max(0, rx - modSize)}" fill="${options.bgColor === "transparent" ? "#ffffff" : options.bgColor}" />\n`;
    // Pupil
    const prx = options.eyePupilShape === "rounded" ? (3 * modSize) * 0.35 : options.eyePupilShape === "circle" ? (3 * modSize) / 2 : 0;
    svgContent += `  <rect x="${fx + 2 * modSize}" y="${fy + 2 * modSize}" width="${3 * modSize}" height="${3 * modSize}" rx="${prx}" fill="${innerColor}" />\n`;
  }

  // Bottom Banner
  if (options.frameStyle === "tqrcg-banner") {
    svgContent += `  <rect x="0" y="${svgH - 44}" width="${size}" height="44" rx="8" fill="${options.frameBgColor || "#65a30d"}" />\n`;
    svgContent += `  <text x="${size / 2}" y="${svgH - 22}" fill="${options.frameTextColor || "#ffffff"}" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${options.frameText}</text>\n`;
  }

  svgContent += `</svg>`;
  return svgContent;
}
