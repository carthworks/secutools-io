"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function CVEPage(){
	const [id, setId] = useState('CVE-2023-12345')
	const [data, setData] = useState<any>(null)

	async function lookup(){
		const res = await fetch('/api/cve', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ id }) })
		setData(await res.json())
	}

	return (
		<div className="space-y-8">
			<Section title="CVE Lookup" subtitle="Uses public CIRCL CVE API">
				<div className="flex flex-col gap-2">
					<input value={id} onChange={e=>setId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" />
					<button onClick={lookup} className="px-3 py-1 rounded bg-primary text-black font-medium">Search</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{data? JSON.stringify(data, null, 2): ''}</pre>
				</div>
			</Section>
		</div>
	)
} 