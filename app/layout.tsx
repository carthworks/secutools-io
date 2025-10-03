import "./globals.css"
import Navigation from "@/components/Navigation"
import type { ReactNode } from "react"

export const metadata = {
title: "Cybersecurity Handy Tools",
description: "Free, privacy-friendly tools for students and professionals",
}

export default function RootLayout({ children }: { children: ReactNode }) {
return (
<html lang="en">
<body className="bg-white text-slate-800">
<Navigation />
<main className="container-page py-8">{children}</main>
<footer className="border-t border-slate-200 bg-slate-50">
  <div className="container-page py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
    <p>
      ⚡ Built for learning. No tracking. All processing runs client-side unless a checker needs a public API.
    </p>
    <div className="flex gap-4">
      <a href="/about" className="hover:text-slate-700">About</a>
      <a href="/privacy" className="hover:text-slate-700">Privacy</a>
      <a href="https://github.com/carthworks" target="_blank" rel="noreferrer" className="hover:text-slate-700">GitHub</a>
    </div>
  </div>
</footer>

</body>
</html>
)
}
