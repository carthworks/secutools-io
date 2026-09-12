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
			<Section title="Subdomain Brute-Force (light)" subtitle="Enumerate subdomains using client-configured wordlists">
				<div className="grid sm:grid-cols-2 gap-4">
					<div className="space-y-3">
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Domain</label>
						<input value={domain} onChange={e=>setDomain(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="example.com" />
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Wordlist (one per line)</label>
						<textarea value={words} onChange={e=>setWords(e.target.value)} className="w-full h-48 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
						<button disabled={busy} onClick={run} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-60">{busy? 'Running...' : 'Start Scan'}</button>
					</div>
					<div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
						<div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Found Subdomains ({found.length}):</div>
						{found.length === 0 ? (
							<div className="text-xs text-slate-400 dark:text-slate-500 font-mono">Discovered records will appear here...</div>
						) : (
							<ul className="text-xs space-y-1.5 max-h-72 overflow-auto">
								{found.map((f,i)=>(<li key={i} className="font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg">{f}</li>))}
							</ul>
						)}
					</div>
				</div>
			</Section>
		</div>
	)
} 