"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function ThreatPage(){
	const [ip, setIp] = useState('')
	const [url, setUrl] = useState('')
	const [hash, setHash] = useState('')
	const [data, setData] = useState<any>(null)

	async function check(){
		const res = await fetch('/api/threat', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ ip, url, hash }) })
		setData(await res.json())
	}

	return (
		<div className="space-y-8">
			<Section title="Threat Intel Quick-Check" subtitle="VirusTotal and AbuseIPDB when API keys are configured in env">
				<div className="grid sm:grid-cols-3 gap-3">
					<input placeholder="IP (e.g. 1.1.1.1)" value={ip} onChange={e=>setIp(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" />
					<input placeholder="URL (e.g. https://...)" value={url} onChange={e=>setUrl(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" />
					<input placeholder="File hash (MD5/SHA256)" value={hash} onChange={e=>setHash(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" />
				</div>
				<button onClick={check} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Query</button>
				<pre className="mt-3 text-xs whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-mono overflow-auto">{data? JSON.stringify(data, null, 2): ''}</pre>
			</Section>
		</div>
	)
} 