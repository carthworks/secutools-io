"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function HeadersPage(){
	const [target, setTarget] = useState('https://example.com')
	const [data, setData] = useState<any>(null)
	async function fetchHeaders(){
		const res = await fetch('/api/headers', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ url: target }) })
		setData(await res.json())
	}
	return (
		<div className="space-y-8">
			<Section title="HTTP Headers Analyzer" subtitle="Shows headers and highlights CORS/CSP">
				<div className="flex gap-2">
					<input value={target} onChange={e=>setTarget(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded p-2" />
					<button onClick={fetchHeaders} className="px-3 py-1 rounded bg-primary text-white font-medium">Fetch</button>
				</div>
				<pre className="mt-3 text-xs whitespace-pre-wrap bg-white border border-slate-200 rounded p-2 text-slate-800">{data? JSON.stringify(data, null, 2): ''}</pre>
			</Section>
		</div>
	)
} 