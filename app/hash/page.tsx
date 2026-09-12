"use client"
import { useState } from "react"
import Section from "@/components/Section"

export default function HashToolsPage() {
const [input, setInput] = useState("")
const [algo, setAlgo] = useState("sha256")
const [output, setOutput] = useState("")
const [toIdentify, setToIdentify] = useState("")
const [identified, setIdentified] = useState<string[]>([])
const [busy, setBusy] = useState(false)

const algoOptions = ["md5","sha1","sha256","sha512"]

function identifyHash(hash: string): string[] {
const candidates: string[] = []
const h = hash.trim().toLowerCase()
if (/^[a-f0-9]{32}$/.test(h)) candidates.push("MD5")
if (/^[a-f0-9]{40}$/.test(h)) candidates.push("SHA1")
if (/^[a-f0-9]{56}$/.test(h)) candidates.push("SHA224")
if (/^[a-f0-9]{64}$/.test(h)) candidates.push("SHA256")
if (/^[a-f0-9]{96}$/.test(h)) candidates.push("SHA384")
if (/^[a-f0-9]{128}$/.test(h)) candidates.push("SHA512")
if (/^[A-Za-z0-9+\/]{22}==$/.test(h)) candidates.push("Base64 (16 bytes)")
return candidates.length ? candidates : ["Unknown"]
}

async function calc() {
setBusy(true)
try {
const res = await fetch("/api/hash", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ algo, input }) })
const data = await res.json()
setOutput(data.hash || "")
} finally {
setBusy(false)
}
}

return (
<div className="space-y-8 text-slate-900 dark:text-slate-100">
<Section title="Hash Calculator" subtitle="MD5, SHA1, SHA256, SHA512">
<div className="flex flex-col gap-3">
<textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text or paste bytes (UTF-8)" className="w-full h-28 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary" />
<div className="flex items-center gap-2">
<select value={algo} onChange={e=>setAlgo(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none">
{algoOptions.map(a=> <option key={a} value={a}>{a.toUpperCase()}</option>)}
</select>
<button onClick={calc} disabled={busy} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-60">{busy? "Hashing..." : "Calculate"}</button>
</div>
<input value={output} readOnly placeholder="Hash output will appear here" className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-sm outline-none" />
</div>
</Section>
<Section title="Hash Identifier" subtitle="Guess likely algorithm from hash length/pattern">
<div className="flex flex-col gap-3">
<input value={toIdentify} onChange={e=>setToIdentify(e.target.value)} placeholder="Paste a hash (hex/base64)" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary" />
<div className="flex items-center gap-3">
<button onClick={()=>setIdentified(identifyHash(toIdentify))} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors">Identify</button>
{identified.length > 0 && <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{identified.join(", ")}</div>}
</div>
</div>
</Section>
</div>
)
}
