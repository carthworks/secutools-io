import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const manifestData = {
    name: "SecuTools.io — Free, Privacy-First Cybersecurity Tools",
    short_name: "SecuTools",
    description: "Fast, privacy-friendly online utilities for cybersecurity students, SOC analysts, and security researchers. Zero client data tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };

  return new NextResponse(JSON.stringify(manifestData, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
