// File: components/StableIcon.tsx
"use client";

import React, { useEffect, useState } from "react";

/**
 * StableIcon
 * - Renders a size-preserving placeholder on the server (and until mount)
 * - After mount it renders the real Lucide icon component
 *
 * Usage: <StableIcon icon={MyIcon} className="w-5 h-5" />
 */
export default function StableIcon({
  icon: Icon,
  className = "w-5 h-5",
  title,
  ...rest
}: {
  icon: React.ComponentType<any> | null | undefined;
  className?: string;
  title?: string;
  [k: string]: any;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // server-safe placeholder to preserve layout and avoid markup mismatch
  if (!mounted || !Icon) {
    return (
      // keep same element dimensions as actual icon to avoid layout shift
      <span
        aria-hidden
        role="img"
        className={`${String(className)} inline-block`}
        {...(title ? { title } : {})}
      />
    );
  }

  // on client after mount render the actual icon
  return <Icon className={className} aria-hidden {...rest} />;
}
