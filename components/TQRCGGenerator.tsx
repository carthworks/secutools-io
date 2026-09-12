"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Link as IconLink,
  Wifi,
  Coins,
  Calendar,
  MapPin,
  FileText,
  Layers,
  User,
  AlignLeft,
  Smartphone,
  MessageSquare,
  Mail,
  Phone,
  Share2,
  Image as IconImage,
  Upload,
  Download,
  Copy,
  Check,
  Palette,
  Sparkles,
  Sliders,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  FileDown,
  Info,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Navigation,
} from "lucide-react";
import {
  TQRCGOptions,
  DEFAULT_TQRCG_OPTIONS,
  TQRCG_PRESETS,
  BUILTIN_LOGOS,
  renderTQRCGCanvas,
  generateTQRCGSVG,
  DotShape,
  EyeFrameShape,
  EyePupilShape,
  GradientType,
  FrameStyle,
} from "@/lib/tqrcg-renderer";

type TabType =
  | "url"
  | "wifi"
  | "crypto"
  | "calendar"
  | "geo"
  | "image"
  | "pdf"
  | "multi-url"
  | "contact"
  | "text"
  | "app"
  | "sms"
  | "email"
  | "phone"
  | "social";

interface SocialLink {
  platform: string;
  url: string;
}

interface MultiUrlItem {
  title: string;
  url: string;
}

export default function TQRCGGenerator() {
  const [activeTab, setActiveTab] = useState<TabType>("url");
  const [options, setOptions] = useState<TQRCGOptions>(DEFAULT_TQRCG_OPTIONS);
  const [selectedPreset, setSelectedPreset] = useState<string>("tqrcg-original");

  // Input states for tabs:
  // 1. URL
  const [urlInput, setUrlInput] = useState("https://carthworks.vercel.app/");
  
  // 2. Wi-Fi
  const [wifiSsid, setWifiSsid] = useState("SecuTools_Guest_5G");
  const [wifiPassword, setWifiPassword] = useState("CyberShield@2026");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  // 3. Crypto Wallet
  const [cryptoCurrency, setCryptoCurrency] = useState<"BTC" | "ETH" | "SOL" | "USDT" | "DOGE">("BTC");
  const [cryptoAddress, setCryptoAddress] = useState("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq");
  const [cryptoAmount, setCryptoAmount] = useState("0.05");
  const [cryptoMessage, setCryptoMessage] = useState("SecuTools Project Contribution");

  // 4. Calendar Event
  const [calTitle, setCalTitle] = useState("SecuTools Cyber Security Summit 2026");
  const [calLocation, setCalLocation] = useState("Moscone Center, San Francisco, CA");
  const [calStartDate, setCalStartDate] = useState("2026-10-15T09:00");
  const [calEndDate, setCalEndDate] = useState("2026-10-15T17:00");
  const [calDescription, setCalDescription] = useState("Keynote on Zero-Trust Architecture & Threat Intel Research");

  // 5. Geo-Location
  const [geoLat, setGeoLat] = useState("37.7749");
  const [geoLng, setGeoLng] = useState("-122.4194");
  const [geoQuery, setGeoQuery] = useState("San Francisco, CA");
  const [geoFormat, setGeoFormat] = useState<"maps-link" | "geo-uri">("maps-link");

  // 6. Text
  const [textInput, setTextInput] = useState("SecuTools.io — Privacy-First Security Utilities");
  
  // 7. Image Upload state
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("https://secutools.io/image-demo.png");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [imageFileSize, setImageFileSize] = useState<string>("");
  const [imageMode, setImageMode] = useState<"center-logo" | "image-url" | "thumbnail">("center-logo");

  // 8. PDF
  const [pdfUrl, setPdfUrl] = useState("https://secutools.io/sample.pdf");

  // 9. Contact (vCard)
  const [contact, setContact] = useState({
    firstName: "Alex",
    lastName: "Vance",
    org: "Cyber Security Lab",
    title: "Security Analyst",
    phone: "+1 555-0199",
    email: "alex@secutools.io",
    url: "https://secutools.io",
    address: "San Francisco, CA",
  });

  // 10. SMS
  const [smsPhone, setSmsPhone] = useState("+1 555-0199");
  const [smsMessage, setSmsMessage] = useState("Hello! Sent from SecuTools TQRCG.");

  // 11. Email
  const [emailTo, setEmailTo] = useState("contact@secutools.io");
  const [emailSubject, setEmailSubject] = useState("Security Report");
  const [emailBody, setEmailBody] = useState("Hi team, please find the security analysis report.");

  // 12. Phone
  const [phoneNumber, setPhoneNumber] = useState("+1 555-0199");

  // 13. App Store
  const [iosAppUrl, setIosAppUrl] = useState("https://apps.apple.com/app/id123456789");
  const [androidAppUrl, setAndroidAppUrl] = useState("https://play.google.com/store/apps/details?id=io.secutools");

  // 14. Multi-URL
  const [multiUrls, setMultiUrls] = useState<MultiUrlItem[]>([
    { title: "SecuTools Homepage", url: "https://secutools.io" },
    { title: "Threat Intel", url: "https://secutools.io/threat" },
    { title: "CVE Lookup", url: "https://secutools.io/cve" },
  ]);

  // 15. Socials
  const [socials, setSocials] = useState<SocialLink[]>([
    { platform: "GitHub", url: "https://github.com/carthworks" },
    { platform: "Twitter / X", url: "https://x.com/carthworks" },
    { platform: "LinkedIn", url: "https://linkedin.com/in/carthworks" },
  ]);

  // Toggles
  const [trackScans, setTrackScans] = useState(true);
  const [removeWatermark, setRemoveWatermark] = useState(false);

  // Customization studio drawer & Export states
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  /* -------------------------------------------------------------------------- */
  /* Reset Handler on Tab Switch                                                */
  /* -------------------------------------------------------------------------- */

  const handleTabSwitch = (newTab: TabType) => {
    setRenderError(null);
    setActiveTab(newTab);
  };

  const resetToDefaults = () => {
    setOptions(DEFAULT_TQRCG_OPTIONS);
    setSelectedPreset("tqrcg-original");
    setUrlInput("https://carthworks.vercel.app/");
    setTextInput("SecuTools.io — Privacy-First Security Utilities");
    setRenderError(null);
  };

  /* -------------------------------------------------------------------------- */
  /* Content Payload Builder                                                    */
  /* -------------------------------------------------------------------------- */

  const computePayload = useCallback((): string => {
    switch (activeTab) {
      case "url":
        return urlInput.trim() || "https://secutools.io";

      case "wifi": {
        const cleanSsid = wifiSsid.replace(/([\\;,:"])/g, "\\$1");
        const cleanPass = wifiPassword.replace(/([\\;,:"])/g, "\\$1");
        const enc = wifiEncryption === "nopass" ? "nopass" : wifiEncryption;
        const passPart = wifiEncryption !== "nopass" ? `P:${cleanPass};` : "";
        const hiddenPart = wifiHidden ? "H:true;" : "";
        return `WIFI:S:${cleanSsid};T:${enc};${passPart}${hiddenPart};`;
      }

      case "crypto": {
        const addr = cryptoAddress.trim();
        if (!addr) return "bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
        const amt = cryptoAmount.trim();
        const msg = cryptoMessage.trim();

        if (cryptoCurrency === "BTC") {
          const params = new URLSearchParams();
          if (amt) params.set("amount", amt);
          if (msg) params.set("message", msg);
          const q = params.toString();
          return `bitcoin:${addr}${q ? `?${q}` : ""}`;
        }
        if (cryptoCurrency === "ETH") {
          const params = new URLSearchParams();
          if (amt) params.set("value", amt);
          const q = params.toString();
          return `ethereum:${addr}${q ? `?${q}` : ""}`;
        }
        if (cryptoCurrency === "SOL") {
          const params = new URLSearchParams();
          if (amt) params.set("amount", amt);
          if (msg) params.set("memo", msg);
          const q = params.toString();
          return `solana:${addr}${q ? `?${q}` : ""}`;
        }
        return `${cryptoCurrency}:${addr}`;
      }

      case "calendar": {
        const formatCalTime = (isoStr: string) => {
          try {
            const d = new Date(isoStr);
            return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          } catch {
            return "20261015T090000Z";
          }
        };

        const dtStart = formatCalTime(calStartDate);
        const dtEnd = formatCalTime(calEndDate);

        return [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          `SUMMARY:${calTitle.trim()}`,
          calLocation.trim() ? `LOCATION:${calLocation.trim()}` : "",
          calDescription.trim() ? `DESCRIPTION:${calDescription.trim()}` : "",
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ]
          .filter(Boolean)
          .join("\n");
      }

      case "geo": {
        const lat = geoLat.trim() || "37.7749";
        const lng = geoLng.trim() || "-122.4194";
        if (geoFormat === "maps-link") {
          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
        }
        return `geo:${lat},${lng}?q=${encodeURIComponent(geoQuery.trim() || `${lat},${lng}`)}`;
      }

      case "image":
        if (imageMode === "thumbnail" && uploadedThumbnail) {
          return uploadedThumbnail;
        }
        if (imageMode === "image-url") {
          return imageUrlInput.trim() || "https://secutools.io/uploaded-image";
        }
        return imageUrlInput.trim() || "https://secutools.io/image";

      case "pdf":
        return pdfUrl.trim() || "https://secutools.io/document.pdf";

      case "text":
        return textInput.trim() || " ";

      case "contact": {
        const vcard = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${contact.lastName};${contact.firstName};;;`,
          `FN:${contact.firstName} ${contact.lastName}`.trim(),
          contact.org ? `ORG:${contact.org}` : "",
          contact.title ? `TITLE:${contact.title}` : "",
          contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : "",
          contact.email ? `EMAIL:${contact.email}` : "",
          contact.url ? `URL:${contact.url}` : "",
          contact.address ? `ADR;TYPE=WORK:;;${contact.address};;;;` : "",
          "END:VCARD",
        ]
          .filter(Boolean)
          .join("\n");
        return vcard;
      }

      case "sms":
        return `SMSTO:${smsPhone.trim()}:${smsMessage.trim()}`;

      case "email": {
        const params = new URLSearchParams();
        if (emailSubject) params.set("subject", emailSubject);
        if (emailBody) params.set("body", emailBody);
        const q = params.toString();
        return `mailto:${emailTo.trim()}${q ? `?${q}` : ""}`;
      }

      case "phone":
        return `tel:${phoneNumber.trim()}`;

      case "app":
        return iosAppUrl.trim() || androidAppUrl.trim() || "https://secutools.io";

      case "multi-url": {
        const valid = multiUrls.filter((item) => item.url.trim());
        if (valid.length === 1) return valid[0].url;
        return (
          "--- Links ---\n" +
          valid.map((item) => `${item.title ? `${item.title}: ` : ""}${item.url}`).join("\n")
        );
      }

      case "social": {
        const valid = socials.filter((item) => item.url.trim());
        if (valid.length === 1) return valid[0].url;
        return (
          "--- Social Profiles ---\n" +
          valid.map((item) => `${item.platform}: ${item.url}`).join("\n")
        );
      }

      default:
        return "https://secutools.io";
    }
  }, [
    activeTab,
    urlInput,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    cryptoCurrency,
    cryptoAddress,
    cryptoAmount,
    cryptoMessage,
    calTitle,
    calLocation,
    calStartDate,
    calEndDate,
    calDescription,
    geoLat,
    geoLng,
    geoQuery,
    geoFormat,
    imageMode,
    uploadedThumbnail,
    imageUrlInput,
    pdfUrl,
    textInput,
    contact,
    smsPhone,
    smsMessage,
    emailTo,
    emailSubject,
    emailBody,
    phoneNumber,
    iosAppUrl,
    androidAppUrl,
    multiUrls,
    socials,
  ]);

  /* -------------------------------------------------------------------------- */
  /* Real-time Render Effect                                                    */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const payload = computePayload();
    const newOptions: TQRCGOptions = {
      ...options,
      text: payload,
    };

    if (canvasRef.current) {
      setIsRendering(true);
      setRenderError(null);
      renderTQRCGCanvas(canvasRef.current, newOptions)
        .catch((err) => {
          setRenderError(err.message || "Unable to render QR code with current input.");
        })
        .finally(() => {
          setIsRendering(false);
        });
    }
  }, [computePayload, options]);

  /* -------------------------------------------------------------------------- */
  /* Image Upload & Intelligent Resizer / Logo Converter                        */
  /* -------------------------------------------------------------------------- */

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRenderError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setImageFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setImageUrlInput(`https://secutools.io/view/${encodeURIComponent(file.name)}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || "");
      setUploadedImageSrc(rawDataUrl);

      // Auto-set as Center Logo in TQRCG style
      setOptions((prev) => ({
        ...prev,
        logoSrc: rawDataUrl,
      }));

      // Generate ultra-compact thumbnail for data-URI mode (~300 bytes)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 36;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = Math.max(16, w);
        canvas.height = Math.max(16, h);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compactDataUrl = canvas.toDataURL("image/jpeg", 0.35);
          setUploadedThumbnail(compactDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  /* -------------------------------------------------------------------------- */
  /* Center Logo Upload                                                         */
  /* -------------------------------------------------------------------------- */

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRenderError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = String(event.target?.result || "");
      setOptions((prev) => ({
        ...prev,
        logoSrc: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  /* -------------------------------------------------------------------------- */
  /* Preset Selection                                                           */
  /* -------------------------------------------------------------------------- */

  const applyPreset = (presetId: string) => {
    setRenderError(null);
    setSelectedPreset(presetId);
    const p = TQRCG_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setOptions((prev) => ({
        ...prev,
        ...p.options,
      }));
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Export & Download Handlers                                                 */
  /* -------------------------------------------------------------------------- */

  const downloadPNG = (scale = 2) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    const exportOptions: TQRCGOptions = {
      ...options,
      text: computePayload(),
      size: 640 * scale,
    };

    renderTQRCGCanvas(exportCanvas, exportOptions).then(() => {
      const link = document.createElement("a");
      link.download = `TQRCG-QRCode-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
    });
  };

  const downloadSVG = () => {
    const svgString = generateTQRCGSVG({
      ...options,
      text: computePayload(),
    });

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.download = `TQRCG-QRCode-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const downloadPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Add Header Title
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text("The QR Code Generator (TQRCG)", 105, 30, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text("SecuTools.io — Privacy-First Security & Utilities", 105, 38, { align: "center" });

      // Embed QR Code in center
      const qrWidth = 110;
      const qrHeight = (canvas.height / canvas.width) * qrWidth;
      doc.addImage(imgData, "PNG", (210 - qrWidth) / 2, 50, qrWidth, qrHeight);

      // Add Payload Info
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const textToPrint = options.text.length > 80 ? options.text.substring(0, 77) + "..." : options.text;
      doc.text(`Encoded Data: ${textToPrint}`, 105, 55 + qrHeight + 12, { align: "center" });

      doc.save(`TQRCG-QRCode-Document-${Date.now()}.pdf`);
    } catch {
      downloadPNG();
    }
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      });
    } catch {
      navigator.clipboard.writeText(computePayload()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Tabs Config                                                                */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /* Two-Fold Tabs Config (No Scrollbar, Clean Two-Tier Layout)                 */
  /* -------------------------------------------------------------------------- */

  const [activeFoldView, setActiveFoldView] = useState<"both" | "fold1" | "fold2">("both");

  const FOLD_1_TABS = [
    { id: "url", label: "Web URL", icon: IconLink, tag: "Popular" },
    { id: "wifi", label: "Wi-Fi Connect", icon: Wifi, tag: "One-Tap" },
    { id: "image", label: "Image / Art", icon: IconImage, tag: "Artistic" },
    { id: "contact", label: "vCard Contact", icon: User },
    { id: "text", label: "Plain Text", icon: AlignLeft },
    { id: "pdf", label: "PDF Document", icon: FileText },
    { id: "multi-url", label: "Multi-Link Hub", icon: Layers },
  ];

  const FOLD_2_TABS = [
    { id: "crypto", label: "Crypto Pay", icon: Coins, tag: "Web3" },
    { id: "calendar", label: "Calendar Event", icon: Calendar },
    { id: "geo", label: "Location Map", icon: MapPin },
    { id: "app", label: "App Store", icon: Smartphone },
    { id: "sms", label: "Pre-filled SMS", icon: MessageSquare },
    { id: "email", label: "Email Mailto", icon: Mail },
    { id: "phone", label: "Phone Dialer", icon: Phone },
    { id: "social", label: "Social Links", icon: Share2 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <span>The QR Code Generator</span>
          <span className="text-indigo-600 dark:text-cyan-400 font-mono text-2xl sm:text-3xl">(TQRCG)</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
          All-in-one tool to convert Wi-Fi, Crypto wallets, events, locations, images, links, and contacts into customized TQRCG-format QR codes with dynamic dots, corner eyes, logos, and frames.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-7 text-white space-y-6">
        {/* Navigation Two-Fold Bar (No Horizontal Scrollbar) */}
        <div className="space-y-2.5 pb-2 border-b border-slate-800/80">
          {/* Fold Switcher Controls */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
              Select QR Content Format
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveFoldView("both")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  activeFoldView === "both"
                    ? "bg-slate-800 text-cyan-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All (2 Folds)
              </button>
              <button
                type="button"
                onClick={() => setActiveFoldView("fold1")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  activeFoldView === "fold1"
                    ? "bg-slate-800 text-cyan-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Fold 1: Essentials
              </button>
              <button
                type="button"
                onClick={() => setActiveFoldView("fold2")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  activeFoldView === "fold2"
                    ? "bg-slate-800 text-cyan-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Fold 2: Specialized
              </button>
            </div>
          </div>

          {/* Fold 1: Essentials & Media */}
          {(activeFoldView === "both" || activeFoldView === "fold1") && (
            <div className="space-y-1">
              {activeFoldView === "both" && (
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold pl-1">
                  Fold 1 — Web, Wi-Fi & Media
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
                {FOLD_1_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSwitch(tab.id as TabType)}
                      className={`relative flex items-center justify-center gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-cyan-950/80 text-cyan-300 border border-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]"
                          : "bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/70 hover:border-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fold 2: Specialized & Communications */}
          {(activeFoldView === "both" || activeFoldView === "fold2") && (
            <div className="space-y-1 pt-1">
              {activeFoldView === "both" && (
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold pl-1">
                  Fold 2 — Utilities, Web3 & Communications
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-2">
                {FOLD_2_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSwitch(tab.id as TabType)}
                      className={`relative flex items-center justify-center gap-2 py-2 px-2 sm:px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-cyan-950/80 text-cyan-300 border border-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]"
                          : "bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/70 hover:border-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Content Grid: Form (Left) & QR Code Live Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Area (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Tab 1: URL */}
            {activeTab === "url" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <IconLink className="w-5 h-5 text-cyan-400" /> Redirect to an existing web URL
                </h3>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setRenderError(null);
                      setUrlInput(e.target.value);
                    }}
                    placeholder="https://example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-10 shadow-inner"
                  />
                  {urlInput && (
                    <button
                      onClick={() => setUrlInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">Try something like https://example.com or any web destination.</p>
              </div>
            )}

            {/* Tab 2: Wi-Fi Instant Connect */}
            {activeTab === "wifi" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-cyan-400" /> Instant Wi-Fi Connect QR Code
                </h3>
                
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => {
                      setRenderError(null);
                      setWifiSsid(e.target.value);
                    }}
                    placeholder="e.g. MyHome_WiFi_5G"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showWifiPassword ? "text" : "password"}
                        value={wifiPassword}
                        onChange={(e) => {
                          setRenderError(null);
                          setWifiPassword(e.target.value);
                        }}
                        placeholder="Wi-Fi Password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWifiPassword(!showWifiPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showWifiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Security Type</label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => {
                        setRenderError(null);
                        setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass");
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Recommended)</option>
                      <option value="WEP">WEP (Legacy)</option>
                      <option value="nopass">No Password (Open)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => {
                      setRenderError(null);
                      setWifiHidden(e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                  />
                  <span>Hidden Network (SSID is not broadcasted)</span>
                </label>
              </div>
            )}

            {/* Tab 3: Crypto Payment */}
            {activeTab === "crypto" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-cyan-400" /> Cryptocurrency Payment Request
                </h3>

                <div className="flex items-center gap-2">
                  {(["BTC", "ETH", "SOL", "USDT", "DOGE"] as const).map((coin) => (
                    <button
                      key={coin}
                      onClick={() => {
                        setRenderError(null);
                        setCryptoCurrency(coin);
                        if (coin === "ETH" && !cryptoAddress.startsWith("0x")) {
                          setCryptoAddress("0x71C...b489");
                        } else if (coin === "SOL" && !cryptoAddress.startsWith("5")) {
                          setCryptoAddress("5Yv8mPzXoJ8z1c7n...");
                        }
                      }}
                      className={`text-xs py-1.5 px-3 rounded-xl border font-semibold transition ${
                        cryptoCurrency === coin
                          ? "bg-amber-950/70 border-amber-500 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Receiving Wallet Address</label>
                  <input
                    type="text"
                    value={cryptoAddress}
                    onChange={(e) => {
                      setRenderError(null);
                      setCryptoAddress(e.target.value);
                    }}
                    placeholder={`Enter ${cryptoCurrency} public address...`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Requested Amount ({cryptoCurrency})</label>
                    <input
                      type="number"
                      step="any"
                      value={cryptoAmount}
                      onChange={(e) => {
                        setRenderError(null);
                        setCryptoAmount(e.target.value);
                      }}
                      placeholder="0.05"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Payment Memo / Note</label>
                    <input
                      type="text"
                      value={cryptoMessage}
                      onChange={(e) => {
                        setRenderError(null);
                        setCryptoMessage(e.target.value);
                      }}
                      placeholder="e.g. Invoice #1042"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Calendar Event */}
            {activeTab === "calendar" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" /> Calendar Event (iCal)
                </h3>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Event Title</label>
                  <input
                    type="text"
                    value={calTitle}
                    onChange={(e) => {
                      setRenderError(null);
                      setCalTitle(e.target.value);
                    }}
                    placeholder="Event Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Location</label>
                  <input
                    type="text"
                    value={calLocation}
                    onChange={(e) => {
                      setRenderError(null);
                      setCalLocation(e.target.value);
                    }}
                    placeholder="Venue or Online Meeting URL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={calStartDate}
                      onChange={(e) => {
                        setRenderError(null);
                        setCalStartDate(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={calEndDate}
                      onChange={(e) => {
                        setRenderError(null);
                        setCalEndDate(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={calDescription}
                  onChange={(e) => {
                    setRenderError(null);
                    setCalDescription(e.target.value);
                  }}
                  placeholder="Event description / agenda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-xs resize-none"
                />
              </div>
            )}

            {/* Tab 5: Geo-Location */}
            {activeTab === "geo" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" /> Geo-Location & Google Maps
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Latitude</label>
                    <input
                      type="text"
                      value={geoLat}
                      onChange={(e) => {
                        setRenderError(null);
                        setGeoLat(e.target.value);
                      }}
                      placeholder="e.g. 37.7749"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Longitude</label>
                    <input
                      type="text"
                      value={geoLng}
                      onChange={(e) => {
                        setRenderError(null);
                        setGeoLng(e.target.value);
                      }}
                      placeholder="e.g. -122.4194"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Location Label / Query</label>
                  <input
                    type="text"
                    value={geoQuery}
                    onChange={(e) => {
                      setRenderError(null);
                      setGeoQuery(e.target.value);
                    }}
                    placeholder="e.g. San Francisco, California"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="geoformat"
                      checked={geoFormat === "maps-link"}
                      onChange={() => setGeoFormat("maps-link")}
                      className="text-cyan-500"
                    />
                    <span>Google Maps Web Link</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="geoformat"
                      checked={geoFormat === "geo-uri"}
                      onChange={() => setGeoFormat("geo-uri")}
                      className="text-cyan-500"
                    />
                    <span>Standard Geo URI (geo:lat,lng)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab 6: Image / File */}
            {activeTab === "image" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <IconImage className="w-5 h-5 text-cyan-400" /> Convert Uploaded Image to QR Code
                </h3>
                
                {/* Drag and Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click or drag & drop any image here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, WebP, SVG, GIF (Auto-optimized for QR logo embedding)
                  </p>
                </div>

                {/* Uploaded File Info Preview */}
                {uploadedImageSrc && (
                  <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                    <img
                      src={uploadedImageSrc}
                      alt="Uploaded preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-600 bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{imageFileName || "Uploaded Image"}</p>
                      <p className="text-xs text-cyan-400">{imageFileSize} • Embedded in TQRCG Format</p>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedImageSrc(null);
                        setUploadedThumbnail(null);
                        setImageFileName("");
                        setImageFileSize("");
                        setOptions((prev) => ({ ...prev, logoSrc: "" }));
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Image Embed & Implantation Modes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                      Image Implantation Mode:
                    </span>
                    {uploadedImageSrc && (
                      <span className="text-[11px] text-cyan-400 font-semibold">
                        ✨ Image Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Mode 1: Pixel Sampler / Halftone Mosaic */}
                    <button
                      onClick={() => {
                        setRenderError(null);
                        setImageMode("center-logo");
                        if (uploadedImageSrc) {
                          setOptions((prev) => ({
                            ...prev,
                            implantedImageSrc: uploadedImageSrc,
                            implantedImageMode: "pixel-sampler",
                            logoSrc: "",
                          }));
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        options.implantedImageMode === "pixel-sampler"
                          ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        🎨 Pixel-Art Sampler
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        QR modules inherit the colors of your photo (Halftone Art QR)
                      </span>
                    </button>

                    {/* Mode 2: Background Blend */}
                    <button
                      onClick={() => {
                        setRenderError(null);
                        setImageMode("center-logo");
                        if (uploadedImageSrc) {
                          setOptions((prev) => ({
                            ...prev,
                            implantedImageSrc: uploadedImageSrc,
                            implantedImageMode: "background-blend",
                            logoSrc: "",
                          }));
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        options.implantedImageMode === "background-blend"
                          ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        🖼️ Photo Blend Layer
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Blends photo in background with contrasting QR dots
                      </span>
                    </button>

                    {/* Mode 3: Center Logo Badge */}
                    <button
                      onClick={() => {
                        setRenderError(null);
                        setImageMode("center-logo");
                        if (uploadedImageSrc) {
                          setOptions((prev) => ({
                            ...prev,
                            implantedImageMode: "none",
                            logoSrc: uploadedImageSrc,
                          }));
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        options.logoSrc === uploadedImageSrc && options.implantedImageMode === "none"
                          ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        🛡️ Center Logo Badge
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Classic TQRCG format with photo in center badge
                      </span>
                    </button>

                    {/* Mode 4: Image View URL */}
                    <button
                      onClick={() => {
                        setRenderError(null);
                        setImageMode("image-url");
                        setOptions((prev) => ({
                          ...prev,
                          implantedImageMode: "none",
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        imageMode === "image-url" && options.implantedImageMode === "none" && !options.logoSrc
                          ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        🔗 Image Web URL
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Encodes link so camera opens or downloads the photo
                      </span>
                    </button>
                  </div>

                  {options.implantedImageMode === "background-blend" && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Background Photo Opacity</span>
                        <span>{Math.round((options.implantedImageOpacity ?? 0.5) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="0.85"
                        step="0.05"
                        value={options.implantedImageOpacity ?? 0.5}
                        onChange={(e) => {
                          setRenderError(null);
                          setOptions({
                            ...options,
                            implantedImageOpacity: parseFloat(e.target.value),
                          });
                        }}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  )}

                  {imageMode === "image-url" && (
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => {
                        setRenderError(null);
                        setImageUrlInput(e.target.value);
                      }}
                      placeholder="https://secutools.io/image.png"
                      className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tab 7: PDF */}
            {activeTab === "pdf" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" /> PDF Document QR Code
                </h3>
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => {
                    setRenderError(null);
                    setPdfUrl(e.target.value);
                  }}
                  placeholder="https://example.com/document.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
                <p className="text-xs text-slate-400">Direct download or viewer link to your hosted PDF file.</p>
              </div>
            )}

            {/* Tab 8: Plain Text */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-cyan-400" /> Plain Text or Message
                </h3>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => {
                    setRenderError(null);
                    setTextInput(e.target.value);
                  }}
                  placeholder="Enter any text, code snippet, or notes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>UTF-8 text encoding</span>
                  <span>{textInput.length} characters</span>
                </div>
              </div>
            )}

            {/* Tab 9: Contact */}
            {activeTab === "contact" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" /> vCard Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={contact.firstName}
                    onChange={(e) => {
                      setRenderError(null);
                      setContact({ ...contact, firstName: e.target.value });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={contact.lastName}
                    onChange={(e) => {
                      setRenderError(null);
                      setContact({ ...contact, lastName: e.target.value });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Organization / Company"
                    value={contact.org}
                    onChange={(e) => {
                      setRenderError(null);
                      setContact({ ...contact, org: e.target.value });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={contact.title}
                    onChange={(e) => {
                      setRenderError(null);
                      setContact({ ...contact, title: e.target.value });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={contact.phone}
                    onChange={(e) => {
                      setRenderError(null);
                      setContact({ ...contact, phone: e.target.value });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={contact.email}
                    onChange={(e) => {
                      setRenderError(null);
                      setContact({ ...contact, email: e.target.value });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Tab 10: SMS */}
            {activeTab === "sms" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" /> Pre-filled SMS Message
                </h3>
                <input
                  type="tel"
                  placeholder="Recipient Phone (+1...)"
                  value={smsPhone}
                  onChange={(e) => {
                    setRenderError(null);
                    setSmsPhone(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100"
                />
                <textarea
                  rows={3}
                  placeholder="Predefined SMS message text..."
                  value={smsMessage}
                  onChange={(e) => {
                    setRenderError(null);
                    setSmsMessage(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 resize-none"
                />
              </div>
            )}

            {/* Tab 11: Email */}
            {activeTab === "email" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyan-400" /> Send Email (Mailto)
                </h3>
                <input
                  type="email"
                  placeholder="Email To"
                  value={emailTo}
                  onChange={(e) => {
                    setRenderError(null);
                    setEmailTo(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => {
                    setRenderError(null);
                    setEmailSubject(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                />
                <textarea
                  rows={3}
                  placeholder="Email body text..."
                  value={emailBody}
                  onChange={(e) => {
                    setRenderError(null);
                    setEmailBody(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 resize-none"
                />
              </div>
            )}

            {/* Tab 12: Phone */}
            {activeTab === "phone" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-400" /> Direct Phone Dialer
                </h3>
                <input
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setRenderError(null);
                    setPhoneNumber(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-slate-100"
                />
                <p className="text-xs text-slate-400">Scanning this immediately prompts to dial the number.</p>
              </div>
            )}

            {/* Tab 13: App */}
            {activeTab === "app" && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" /> App Store Links
                </h3>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Apple App Store URL</label>
                  <input
                    type="url"
                    value={iosAppUrl}
                    onChange={(e) => {
                      setRenderError(null);
                      setIosAppUrl(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Google Play Store URL</label>
                  <input
                    type="url"
                    value={androidAppUrl}
                    onChange={(e) => {
                      setRenderError(null);
                      setAndroidAppUrl(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Tab 14: Multi-URL */}
            {activeTab === "multi-url" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" /> Multi-URL Landing Hub
                  </h3>
                  <button
                    onClick={() => {
                      setRenderError(null);
                      setMultiUrls([...multiUrls, { title: "New Link", url: "https://" }]);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Link
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {multiUrls.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Label"
                        value={item.title}
                        onChange={(e) => {
                          setRenderError(null);
                          const copy = [...multiUrls];
                          copy[idx].title = e.target.value;
                          setMultiUrls(copy);
                        }}
                        className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={item.url}
                        onChange={(e) => {
                          setRenderError(null);
                          const copy = [...multiUrls];
                          copy[idx].url = e.target.value;
                          setMultiUrls(copy);
                        }}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                      />
                      {multiUrls.length > 1 && (
                        <button
                          onClick={() => {
                            setRenderError(null);
                            setMultiUrls(multiUrls.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 15: Social */}
            {activeTab === "social" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-cyan-400" /> Social Profile Links
                  </h3>
                  <button
                    onClick={() => {
                      setRenderError(null);
                      setSocials([...socials, { platform: "Website", url: "https://" }]);
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {socials.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.platform}
                        onChange={(e) => {
                          setRenderError(null);
                          const copy = [...socials];
                          copy[idx].platform = e.target.value;
                          setSocials(copy);
                        }}
                        className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => {
                          setRenderError(null);
                          const copy = [...socials];
                          copy[idx].url = e.target.value;
                          setSocials(copy);
                        }}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                      />
                      {socials.length > 1 && (
                        <button
                          onClick={() => {
                            setRenderError(null);
                            setSocials(socials.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature switches / toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={trackScans}
                  onChange={(e) => setTrackScans(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <span>Track your scans <span className="text-amber-400">✦</span></span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={removeWatermark}
                  onChange={(e) => setRemoveWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <span>Remove watermark <span className="text-amber-400">✦</span></span>
              </label>

              <button
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="ml-auto text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>TQRCG Customizer</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            <div className="text-xs text-slate-400 flex items-center justify-between w-full max-w-[340px] px-1">
              <span>To enable tracking, <span className="underline text-slate-200 cursor-pointer">Dynamic QR</span></span>
              <button
                onClick={resetToDefaults}
                title="Reset all settings to default"
                className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-[11px] transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* QR Card Canvas Wrapper + Sidebar Presets */}
            <div className="flex items-center gap-3 w-full justify-center">
              {/* The Live Interactive Canvas Container */}
              <div className="relative p-2.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center min-h-[300px] min-w-[280px]">
                {isRendering && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                )}
                {renderError ? (
                  <div className="p-4 text-center text-xs text-rose-400 space-y-2 max-w-[260px]">
                    <Info className="w-6 h-6 mx-auto text-rose-500" />
                    <p>{renderError}</p>
                    <button
                      onClick={resetToDefaults}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] mt-2 inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Defaults
                    </button>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="max-w-[280px] sm:max-w-[310px] h-auto rounded-xl shadow-lg transition-transform duration-200"
                  />
                )}
              </div>

              {/* Side Preset Cards */}
              <div className="flex flex-col gap-2">
                {TQRCG_PRESETS.slice(0, 4).map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      title={preset.name}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-base border transition-all ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-950/60 shadow-md shadow-cyan-900/50 scale-105"
                          : "border-slate-800 bg-slate-950/70 hover:border-slate-600 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span>{preset.previewBadge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex items-center gap-2 w-full max-w-[340px]">
              {/* Save / Download High-Res PNG Button */}
              <button
                onClick={() => downloadPNG(2)}
                className="flex-1 bg-slate-200 hover:bg-white text-slate-900 font-bold py-2.5 px-4 rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
              >
                <span>Save</span>
              </button>

              {/* Download dropdown / buttons */}
              <div className="relative">
                <button
                  onClick={() => setDownloadDropdown(!downloadDropdown)}
                  title="Download Formats (PNG, SVG, PDF)"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 transition"
                >
                  <Download className="w-5 h-5" />
                </button>

                {downloadDropdown && (
                  <div className="absolute right-0 bottom-full mb-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-1">
                    <button
                      onClick={() => {
                        downloadPNG(3);
                        setDownloadDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PNG (High-Res)</span>
                    </button>
                    <button
                      onClick={() => {
                        downloadSVG();
                        setDownloadDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                      <span>SVG (Vector)</span>
                    </button>
                    <button
                      onClick={() => {
                        downloadPDF();
                        setDownloadDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>PDF Document</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Copy image to clipboard */}
              <button
                onClick={copyToClipboard}
                title="Copy QR to Clipboard"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 transition"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>

              {/* Open Customizer */}
              <button
                onClick={() => setShowCustomizer(!showCustomizer)}
                title="Customize Shapes & Colors"
                className={`p-2.5 rounded-xl border transition ${
                  showCustomizer
                    ? "bg-cyan-600 text-white border-cyan-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <Palette className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Customization Studio Drawer */}
        {showCustomizer && (
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-6 bg-slate-950/70 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                <Palette className="w-5 h-5" /> TQRCG Styling & Customization Studio
              </h3>
              <button
                onClick={() => setShowCustomizer(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Body Dot Styles */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Body Dot Shape
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "dots", label: "Rounded Dots (TQRCG)" },
                      { id: "square", label: "Square Modules" },
                      { id: "rounded", label: "Smooth Squircle" },
                      { id: "classy", label: "Classy Diamond" },
                      { id: "fluid", label: "Connecting Fluid" },
                    ] as { id: DotShape; label: string }[]
                  ).map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => {
                        setRenderError(null);
                        setOptions({ ...options, dotShape: shape.id });
                      }}
                      className={`text-xs py-2 px-2.5 rounded-lg border text-left transition ${
                        options.dotShape === shape.id
                          ? "bg-cyan-950 text-cyan-400 border-cyan-500 font-semibold"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Corner Eye Frames & Pupils */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Corner Eye Shape
                </label>
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Outer Frame</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["rounded", "square", "circle", "leaf"] as EyeFrameShape[]).map((ef) => (
                        <button
                          key={ef}
                          onClick={() => {
                            setRenderError(null);
                            setOptions({ ...options, eyeFrameShape: ef });
                          }}
                          className={`text-xs py-1.5 px-2 rounded-lg border capitalize ${
                            options.eyeFrameShape === ef
                              ? "bg-cyan-950 text-cyan-400 border-cyan-500"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {ef}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Inner Pupil</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["rounded", "square", "circle", "diamond"] as EyePupilShape[]).map((ep) => (
                        <button
                          key={ep}
                          onClick={() => {
                            setRenderError(null);
                            setOptions({ ...options, eyePupilShape: ep });
                          }}
                          className={`text-xs py-1.5 px-2 rounded-lg border capitalize ${
                            options.eyePupilShape === ep
                              ? "bg-cyan-950 text-cyan-400 border-cyan-500"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {ep}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Color Palettes & Gradients */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Colors & Gradients
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Foreground Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.fgColor1}
                        onChange={(e) => {
                          setRenderError(null);
                          setOptions({ ...options, fgColor1: e.target.value });
                        }}
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px]">{options.fgColor1}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Gradient End Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.fgColor2 || options.fgColor1}
                        onChange={(e) => {
                          setRenderError(null);
                          setOptions({
                            ...options,
                            colorType: "linear",
                            fgColor2: e.target.value,
                          });
                        }}
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px]">{options.fgColor2}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Eye Outer & Inner Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.eyeOuterColor}
                        onChange={(e) => {
                          setRenderError(null);
                          setOptions({
                            ...options,
                            useCustomEyeColor: true,
                            eyeOuterColor: e.target.value,
                            eyeInnerColor: e.target.value,
                          });
                        }}
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px]">{options.eyeOuterColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Background Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.bgColor === "transparent" ? "#ffffff" : options.bgColor}
                        onChange={(e) => {
                          setRenderError(null);
                          setOptions({ ...options, bgColor: e.target.value });
                        }}
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <button
                        onClick={() => {
                          setRenderError(null);
                          setOptions({
                            ...options,
                            bgColor: options.bgColor === "transparent" ? "#ffffff" : "transparent",
                          });
                        }}
                        className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300"
                      >
                        {options.bgColor === "transparent" ? "Solid" : "Transparent"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Logo, Badges & TQRCG Frame */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Center Logo & TQRCG Frame
                </label>

                {/* Built-in Icons */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Center Icon / Badge</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setRenderError(null);
                        setOptions({ ...options, logoSrc: "" });
                      }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        !options.logoSrc ? "bg-cyan-950 border-cyan-500 text-cyan-400" : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      None
                    </button>
                    {BUILTIN_LOGOS.map((logo) => (
                      <button
                        key={logo.id}
                        onClick={() => {
                          setRenderError(null);
                          setOptions({ ...options, logoSrc: logo.svg });
                        }}
                        className={`text-xs px-2 py-1 rounded-lg border ${
                          options.logoSrc === logo.svg
                            ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {logo.name.split(" ")[0]}
                      </button>
                    ))}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs px-2 py-1 rounded-lg border bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Custom
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* TQRCG Frame Style */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Banner & Frame</span>
                  <select
                    value={options.frameStyle}
                    onChange={(e) => {
                      setRenderError(null);
                      setOptions({ ...options, frameStyle: e.target.value as FrameStyle });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="none">No Frame</option>
                    <option value="tqrcg-banner">TQRCG Bottom Banner</option>
                    <option value="badge-top">Top CTA Banner</option>
                    <option value="badge-bottom">Bottom CTA Banner</option>
                    <option value="card-frame">Surrounding Card Frame</option>
                  </select>
                </div>

                {options.frameStyle !== "none" && (
                  <div>
                    <input
                      type="text"
                      value={options.frameText}
                      onChange={(e) => {
                        setRenderError(null);
                        setOptions({ ...options, frameText: e.target.value });
                      }}
                      placeholder="Frame Banner Text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                    />
                  </div>
                )}

                {/* Implanted Art Photo Controls */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] text-slate-300 font-bold block">
                    🎨 Implant Photo to QR
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setRenderError(null);
                        setOptions({ ...options, implantedImageMode: "none" });
                      }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        options.implantedImageMode === "none"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => {
                        setRenderError(null);
                        if (options.implantedImageSrc || uploadedImageSrc) {
                          setOptions({
                            ...options,
                            implantedImageSrc: options.implantedImageSrc || uploadedImageSrc || "",
                            implantedImageMode: "pixel-sampler",
                          });
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        options.implantedImageMode === "pixel-sampler"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      Pixel Art
                    </button>
                    <button
                      onClick={() => {
                        setRenderError(null);
                        if (options.implantedImageSrc || uploadedImageSrc) {
                          setOptions({
                            ...options,
                            implantedImageSrc: options.implantedImageSrc || uploadedImageSrc || "",
                            implantedImageMode: "background-blend",
                          });
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        options.implantedImageMode === "background-blend"
                          ? "bg-cyan-950 border-cyan-500 text-cyan-400"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      Blend
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights & Privacy Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side Privacy</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Wi-Fi keys, crypto addresses, files, and contact cards are encoded directly in your browser with zero telemetry.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-sm">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>TQRCG Pro Formatting</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Full support for custom dot geometries, eye frames, dual gradients, logos, and printable vectors.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-sm">
            <FileDown className="w-4 h-4 text-indigo-500" />
            <span>Multi-Format Export</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Export directly as High-Res PNG, scalable SVG vector, printable PDF flyer, or copy directly to clipboard.
          </p>
        </div>
      </div>
    </div>
  );
}
