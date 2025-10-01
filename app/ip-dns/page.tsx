"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function IpDnsPage(){
	const [domain, setDomain] = useState('example.com')
	const [ip, setIp] = useState('8.8.8.8')
	const [dns, setDns] = useState<any>(null)
	const [geo, setGeo] = useState<any>(null)
	const [ptr, setPtr] = useState<any>(null)

	async function lookupDNS(){
		const res = await fetch('/api/dns', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ domain }) })
		setDns(await res.json())
	}
	async function lookupGeo(){
		const res = await fetch('/api/geoip', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ ip }) })
		setGeo(await res.json())
	}
	async function lookupPTR(){
		const res = await fetch('/api/dns', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ reverse: ip }) })
		setPtr(await res.json())
	}

	return (
		<div className="space-y-8">
			<Section title="IP Geolocation">
				<div className="flex flex-col gap-2">
					<input value={ip} onChange={e=>setIp(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" placeholder="IP address" />
					<button onClick={lookupGeo} className="px-3 py-1 rounded bg-primary text-black font-medium">Lookup</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{geo? JSON.stringify(geo, null, 2): ''}</pre>
				</div>
			</Section>
			<Section title="DNS Records (A, MX, TXT, NS)">
				<div className="flex flex-col gap-2">
					<input value={domain} onChange={e=>setDomain(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" placeholder="domain.com" />
					<button onClick={lookupDNS} className="px-3 py-1 rounded bg-primary text-black font-medium">Lookup</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{dns? JSON.stringify(dns, null, 2): ''}</pre>
				</div>
			</Section>
			<Section title="Reverse DNS / PTR">
				<div className="flex flex-col gap-2">
					<input value={ip} onChange={e=>setIp(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-2" placeholder="IP address" />
					<button onClick={lookupPTR} className="px-3 py-1 rounded bg-primary text-black font-medium">Reverse Lookup</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{ptr? JSON.stringify(ptr, null, 2): ''}</pre>
				</div>
			</Section>
		</div>
	)
} 