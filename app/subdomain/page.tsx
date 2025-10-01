"use client"
import { useState } from 'react'
import Section from '@/components/Section'

const defaultWordlist = ['www','mail','dev','api','test','staging','admin','vpn','portal','m','cdn']

export default function SubdomainPage(){
	const [domain, setDomain] = useState('example.com')
	const [words, setWords] = useState(defaultWordlist.join('\n'))
	const [found, setFound] = useState<string[]>([])
	const [busy, setBusy] = useState(false)

	async function run(){
		setBusy(true)
		setFound([])
		const list = words.split(/\r?\n/).map(w=>w.trim()).filter(Boolean)
		for (const w of list){
			const sub = `${w}.${domain}`
			const res = await fetch('/api/dns', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ domain: sub }) })
			const data = await res.json()
			if (Array.isArray(data.a) && data.a.length > 0){
				setFound(prev => [...prev, `${sub} -> ${data.a.join(', ')}`])
			}
		}
		setBusy(false)
	}

	return (
		<div className="space-y-8">
			<Section title="Subdomain Brute-Force (light)">
				<div className="grid sm:grid-cols-2 gap-3">
					<div className="space-y-2">
						<input value={domain} onChange={e=>setDomain(e.target.value)} className="w-full bg-white border border-slate-300 rounded p-2" />
						<textarea value={words} onChange={e=>setWords(e.target.value)} className="w-full h-48 bg-white border border-slate-300 rounded p-2" />
						<button disabled={busy} onClick={run} className="px-3 py-1 rounded bg-primary text-white font-medium disabled:opacity-60">{busy? 'Running...' : 'Start'}</button>
					</div>
					<div className="space-y-2">
						<div className="text-sm text-slate-600">Found:</div>
						<ul className="text-sm list-disc pl-5">
							{found.map((f,i)=>(<li key={i} className="font-mono text-slate-800">{f}</li>))}
						</ul>
					</div>
				</div>
			</Section>
		</div>
	)
} 