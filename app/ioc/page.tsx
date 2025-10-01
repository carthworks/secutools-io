"use client"
import { useState } from 'react'
import Section from '@/components/Section'

const regexes = {
	ip: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
	url: /\bhttps?:\/\/[^\s"'>)]+/gi,
	hash: /\b[a-f0-9]{32}\b|\b[a-f0-9]{40}\b|\b[a-f0-9]{64}\b|\b[a-f0-9]{128}\b/gi,
	email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
}

export default function IOCPage(){
	const [text, setText] = useState('Paste text/logs here')
	const [result, setResult] = useState<any>(null)

	function extract(){
		const r = {
			ips: text.match(regexes.ip) || [],
			urls: text.match(regexes.url) || [],
			hashes: text.match(regexes.hash) || [],
			emails: text.match(regexes.email) || [],
		}
		setResult(r)
	}

	return (
		<div className="space-y-8">
			<Section title="IOC Extractor" subtitle="Extract IPs, URLs, hashes, and emails from arbitrary text">
				<div className="flex flex-col gap-3">
					<textarea value={text} onChange={e=>setText(e.target.value)} className="w-full h-40 bg-slate-950 border border-slate-800 rounded p-2" />
					<button onClick={extract} className="px-3 py-1 rounded bg-primary text-black font-medium">Extract</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{result? JSON.stringify(result, null, 2) : ''}</pre>
				</div>
			</Section>
		</div>
	)
} 