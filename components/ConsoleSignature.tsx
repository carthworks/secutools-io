"use client";

import { useEffect, useRef } from "react";

export default function ConsoleSignature() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window === "undefined") return;

    // Styling tokens for DevTools console
    const bannerStyle =
      "font-size: 14px; font-weight: 800; color: #38bdf8; background: #0f172a; padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.4); text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);";
    const labelStyle = "font-weight: 700; color: #38bdf8;";
    const textStyle = "color: #94a3b8;";
    const linkStyle = "color: #a855f7; font-weight: 600; text-decoration: underline;";
    const quoteStyle = "font-style: italic; color: #10b981;";
    const tipLabelStyle = "font-weight: 800; color: #f59e0b;";
    const codeBadgeStyle =
      "font-family: monospace; font-weight: 700; color: #06b6d4; background: rgba(6, 182, 212, 0.15); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.3);";

    // 1. Main Header Badge
    console.log("%c⚡ SecuTools.io — Privacy-First Cybersecurity Toolkit", bannerStyle);

    // 2. Developer & Project Details
    console.log(
      "%c👨‍💻 Developer:%c Karthikeyan T (@carthworks)\n" +
        "%c✉️  Email:     %ctkarthikeyan@gmail.com\n" +
        "%c💼 LinkedIn:  %chttps://www.linkedin.com/in/carthworks\n" +
        "%c🐙 GitHub:    %chttps://github.com/carthworks\n" +
        "%c📦 Project:   %chttps://github.com/carthworks/secutools-io\n" +
        "%c🌐 Live Site:  %chttps://secutools.io\n" +
        "%c📜 License:   %cMIT\n" +
        '%c🛡️ Mission:   %c"Zero server telemetry. All cryptography and inspection run 100% client-side in your browser."',
      labelStyle,
      textStyle,
      labelStyle,
      textStyle,
      labelStyle,
      linkStyle,
      labelStyle,
      linkStyle,
      labelStyle,
      linkStyle,
      labelStyle,
      linkStyle,
      labelStyle,
      textStyle,
      labelStyle,
      quoteStyle
    );

    // 3. Interactive DevTools Helper Announcement
    console.log(
      "%c💡 DevTools Helper:%c Run %cSecuTools.help()%c to inspect tools and developer metadata in this console!",
      tipLabelStyle,
      textStyle,
      codeBadgeStyle,
      textStyle
    );

    // 4. Attach Interactive Window Object
    const secuApi = {
      version: "0.1.0",
      developer: {
        name: "Karthikeyan T",
        handle: "@carthworks",
        email: "tkarthikeyan@gmail.com",
        linkedIn: "https://www.linkedin.com/in/carthworks",
        github: "https://github.com/carthworks",
      },
      project: {
        name: "SecuTools.io",
        repo: "https://github.com/carthworks/secutools-io",
        license: "MIT",
        mission: "Privacy-first cybersecurity utilities for SOC analysts & security researchers.",
      },
      security: {
        reporting: "Please report vulnerabilities responsibly to tkarthikeyan@gmail.com",
        policy: "Zero client data tracking. No sensitive cryptographic inputs leave your machine.",
      },
      help: () => {
        console.table({
          "SecuTools.developer": "Author & contact links",
          "SecuTools.project": "Project repository & architecture",
          "SecuTools.security": "Responsible disclosure policy",
          "SecuTools.version": "Current release version",
        });
        return "🚀 Welcome to SecuTools DevTools Console!";
      },
    };

    (window as any).SecuTools = secuApi;
    (window as any).Secu = secuApi;
  }, []);

  return null;
}
