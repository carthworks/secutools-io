"use client"
import { useState } from "react"
import Link from "next/link"

export default function Navigation() {
const [isOpen, setIsOpen] = useState(false)

const categories = [
{
title: "Cryptography",
icon: "",
tools: [
{ slug: "hash", title: "Hash Tools", desc: "MD5, SHA1, SHA256, SHA512" },
{ slug: "jwt", title: "JWT Decoder", desc: "Decode and verify JWTs" },
{ slug: "password", title: "Password Utilities", desc: "Strength checker and generator" }
]
},
{
title: "Network Analysis",
icon: "",
tools: [
{ slug: "ip-dns", title: "IP & DNS Toolkit", desc: "GeoIP, DNS records, rDNS" },
{ slug: "ssl", title: "SSL/TLS Checker", desc: "Certificate info and expiry" },
{ slug: "port", title: "Port Check", desc: "TCP reachability" },
{ slug: "headers", title: "HTTP Headers", desc: "CORS & CSP overview" }
]
},
{
title: "Threat Intelligence",
icon: "",
tools: [
{ slug: "ioc", title: "IOC Extractor", desc: "Extract IPs, URLs, hashes, emails" },
{ slug: "cve", title: "CVE Lookup", desc: "Fetch details from CIRCL CVE" },
{ slug: "threat", title: "Threat Intel Check", desc: "VirusTotal/AbuseIPDB" },
{ slug: "whois", title: "WHOIS / RDAP", desc: "Ownership & registration" }
]
},
{
title: "Analysis Tools",
icon: "",
tools: [
{ slug: "logs", title: "Log Beautifier", desc: "Format JSON, Apache, Nginx" },
{ slug: "pcap", title: "PCAP Decoder", desc: "View timestamps, sizes, hex" },
{ slug: "timestamp", title: "Timestamp Converter", desc: "Unix  Human time" },
{ slug: "subdomain", title: "Subdomain Finder", desc: "Dictionary-based" }
]
},
{
title: "Testing & Payloads",
icon: "",
tools: [
{ slug: "payloads", title: "XSS/SQLi Payloads", desc: "Encoders and test payloads" },
{ slug: "cheatsheets", title: "Cheatsheets", desc: "OWASP Top 10, MITRE ATT&CK" }
]
}
]

return (
<header className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10">
<div className="container-page flex items-center justify-between py-4">
<Link href="/" className="font-semibold text-lg">
<span className="text-primary"></span> Cybersecurity Handy Tools
</Link>

<nav className="hidden sm:flex gap-4 text-sm text-slate-600">
<div className="relative">
<button 
onClick={() => setIsOpen(!isOpen)}
className="flex items-center gap-1 hover:text-slate-800 transition-colors"
>
Tool Categories
<svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
</svg>
</button>

{isOpen && (
<div className="absolute top-full left-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
<div className="p-4">
<div className="grid grid-cols-1 gap-4">
{categories.map((category, index) => (
<div key={index} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
<div className="flex items-center gap-2 mb-2">
<span className="text-lg">{category.icon}</span>
<h3 className="font-semibold text-slate-800 text-sm">{category.title}</h3>
</div>
<div className="grid grid-cols-1 gap-1">
{category.tools.map((tool) => (
<Link
key={tool.slug}
href={`/${tool.slug}`}
className="block px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded transition-colors"
onClick={() => setIsOpen(false)}
>
<div className="font-medium">{tool.title}</div>
<div className="text-slate-500">{tool.desc}</div>
</Link>
))}
</div>
</div>
))}
</div>
<div className="mt-3 pt-3 border-t border-slate-200">
<Link 
href="/tools" 
className="block text-center text-sm font-medium text-primary hover:text-primary-dark"
onClick={() => setIsOpen(false)}
>
View All Tools 
</Link>
</div>
</div>
</div>
)}
</div>

<Link href="/about">About</Link>
<Link href="/contact">Contact</Link>
<a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noreferrer">OWASP</a>
</nav>
</div>
</header>
)
}
