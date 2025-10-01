"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function PortPage(){
	const [host, setHost] = useState('example.com')
	const [port, setPort] = useState(443)
	const [resu, setResu] = useState<any>(null)
	async function check(){
		const res = await fetch('/api/port', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ host, port }) })
		setResu(await res.json())
	}
	return (
		<div className="space-y-8">
			<Section title="Port Check (TCP)">
				<div className="flex gap-2">
					<input value={host} onChange={e=>setHost(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded p-2" />
					<input type="number" value={port} onChange={e=>setPort(Number(e.target.value))} className="w-32 bg-white border border-slate-300 rounded p-2" />
					<button onClick={check} className="px-3 py-1 rounded bg-primary text-white font-medium">Check</button>
				</div>
				<pre className="mt-3 text-xs whitespace-pre-wrap bg-white border border-slate-200 rounded p-2 text-slate-800">{resu? JSON.stringify(resu, null, 2): ''}</pre>
			</Section>
		</div>
	)
} 