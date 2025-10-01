"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function SSLPage(){
	const [host, setHost] = useState('example.com')
	const [port, setPort] = useState(443)
	const [info, setInfo] = useState<any>(null)

	async function check(){
		const res = await fetch('/api/ssl', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ host, port }) })
		setInfo(await res.json())
	}

	return (
		<div className="space-y-8">
			<Section title="SSL/TLS Certificate Checker" subtitle="Fetches cert chain and reports expiry, issuer, and protocol">
				<div className="flex flex-col gap-2">
					<div className="flex gap-2">
						<input value={host} onChange={e=>setHost(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded p-2" placeholder="domain" />
						<input type="number" value={port} onChange={e=>setPort(Number(e.target.value))} className="w-28 bg-slate-950 border border-slate-800 rounded p-2" />
						<button onClick={check} className="px-3 py-1 rounded bg-primary text-black font-medium">Check</button>
					</div>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{info? JSON.stringify(info, null, 2): ''}</pre>
				</div>
			</Section>
		</div>
	)
} 