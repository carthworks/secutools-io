// components/ViewTickerClient.tsx
"use client";

import dynamic from "next/dynamic";

// dynamically import the actual client-only ticker. This dynamic call is safe
// because this file is a client component ("use client").
const ViewTicker = dynamic(() => import("./ViewTicker"), { ssr: false });

export default function ViewTickerClient() {
  return <ViewTicker />;
}
