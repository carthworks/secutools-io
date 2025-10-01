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
<div className="space-y-8">
<Section title="Hash Calculator" subtitle="MD5, SHA1, SHA256, SHA512">
<div className="flex flex-col gap-3">
<textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter text or paste bytes (UTF-8)" className="w-full h-28 bg-white border border-slate-300 rounded p-2" />
<div className="flex items-center gap-2">
<select value={algo} onChange={e=>setAlgo(e.target.value)} className="bg-white border border-slate-300 rounded px-2 py-1">
{algoOptions.map(a=> <option key={a} value={a}>{a.toUpperCase()}</option>)}
</select>
<button onClick={calc} disabled={busy} className="px-3 py-1 rounded bg-primary text-white font-medium disabled:opacity-60">{busy? "Hashing..." : "Calculate"}</button>
</div>
<input value={output} readOnly className="w-full bg-white border border-slate-300 rounded p-2" />
</div>
</Section>
<Section title="Hash Identifier" subtitle="Guess likely algorithm from hash length/pattern">
<div className="flex flex-col gap-3">
<input value={toIdentify} onChange={e=>setToIdentify(e.target.value)} placeholder="Paste a hash (hex/base64)" className="w-full bg-white border border-slate-300 rounded p-2" />
<button onClick={()=>setIdentified(identifyHash(toIdentify))} className="px-3 py-1 rounded bg-slate-600 text-white">Identify</button>
<div className="text-sm text-slate-700">{identified.join(", ")}</div>
</div>
</Section>
</div>
)
}
