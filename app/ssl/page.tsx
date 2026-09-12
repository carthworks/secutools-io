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
				<div className="flex flex-col gap-3">
					<div className="flex gap-2">
						<input value={host} onChange={e=>setHost(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="domain (e.g. example.com)" />
						<input type="number" value={port} onChange={e=>setPort(Number(e.target.value))} className="w-28 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" />
						<button onClick={check} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Check</button>
					</div>
					<pre className="text-xs whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-mono overflow-auto">{info? JSON.stringify(info, null, 2): ''}</pre>
				</div>
			</Section>
		</div>
	)
} 