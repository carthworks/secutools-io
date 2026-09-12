import type { Metadata } from "next";
import TQRCGGenerator from "@/components/TQRCGGenerator";

export const metadata: Metadata = {
  title: "The QR Code Generator (TQRCG) — Customizable & Image to QR | SecuTools",
  description:
    "Convert images, files, URLs, contacts, and text into customizable TQRCG format QR codes with custom dot shapes, corner eye styles, logos, gradients, and frames. 100% free and privacy-friendly.",
  keywords: [
    "QR Code Generator",
    "TQRCG",
    "Image to QR Code",
    "Custom QR Code",
    "QR Code with Logo",
    "Color QR Code",
    "Vector QR Code SVG",
    "SecuTools",
  ],
  openGraph: {
    title: "The QR Code Generator (TQRCG) — SecuTools.io",
    description:
      "Create, customize and download TQRCG format QR codes with custom dot styles, gradients, logos, and frame banners.",
    type: "website",
  },
};

export default function QRCodeGeneratorPage() {
  return <TQRCGGenerator />;
}
