"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function WhoisPage(){
	const [query, setQuery] = useState('example.com')
	const [data, setData] = useState<any>(null)
	async function lookup(){
		const res = await fetch('/api/whois', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ query }) })
		setData(await res.json())
	}
	return (
		<div className="space-y-8">
			<Section title="WHOIS / RDAP">
				<div className="flex gap-2">
					<input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded p-2" />
					<button onClick={lookup} className="px-3 py-1 rounded bg-primary text-white font-medium">Lookup</button>
				</div>
				<pre className="mt-3 text-xs whitespace-pre-wrap bg-white border border-slate-200 rounded p-2 text-slate-800">{data? JSON.stringify(data, null, 2): ''}</pre>
			</Section>
		</div>
	)
} 