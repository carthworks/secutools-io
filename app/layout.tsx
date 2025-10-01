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
<footer className="border-t border-slate-200">
<div className="container-page py-6 text-xs text-slate-500">
Built for learning. No tracking. All processing runs client-side unless a checker needs a public API.
</div>
</footer>
</body>
</html>
)
}
