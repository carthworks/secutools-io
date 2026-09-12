import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SecuTools.io — Cybersecurity & Developer Tools",
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
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
