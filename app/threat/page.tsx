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
				<div className="grid sm:grid-cols-3 gap-2">
					<input placeholder="IP" value={ip} onChange={e=>setIp(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" />
					<input placeholder="URL" value={url} onChange={e=>setUrl(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" />
					<input placeholder="File hash" value={hash} onChange={e=>setHash(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" />
				</div>
				<button onClick={check} className="mt-2 px-3 py-1 rounded bg-primary text-black font-medium">Query</button>
				<pre className="mt-2 text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{data? JSON.stringify(data, null, 2): ''}</pre>
			</Section>
		</div>
	)
} 