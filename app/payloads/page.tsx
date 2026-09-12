"use client"
import { useMemo, useState } from 'react'
import Section from '@/components/Section'

function htmlEntities(str: string){
	return str.replace(/./g, (c) => `&#${c.charCodeAt(0)};`)
}
function urlEncode(str: string){
	return encodeURIComponent(str)
}
function jsStringEncode(str: string){
	return str.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t').replace(/"/g,'\\"').replace(/'/g, "\\'")
}

const defaultXss = '<script>alert(1)</script>'

const basicSQLi = [
	"' OR '1'='1 -- ",
	"' OR '1'='1 /*",
	"admin'--",
	"admin' #",
	"' UNION SELECT null-- ",
	"' UNION SELECT username, password FROM users-- ",
]

export default function PayloadsPage(){
	const [payload, setPayload] = useState(defaultXss)
	const encoded = useMemo(()=>({
		html: htmlEntities(payload),
		url: urlEncode(payload),
		js: jsStringEncode(payload),
	}), [payload])

	return (
		<div className="space-y-8">
			<Section title="XSS Encoder" subtitle="Encode a payload into HTML entities, URL encoding, JS string">
				<div className="flex flex-col gap-4">
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Raw XSS Payload</label>
						<textarea value={payload} onChange={e=>setPayload(e.target.value)} className="w-full h-24 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
					</div>
					<div className="grid sm:grid-cols-3 gap-3 text-xs">
						<div><div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">HTML Entities</div><textarea readOnly className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 font-mono shadow-sm" value={encoded.html} /></div>
						<div><div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">URL Encoded</div><textarea readOnly className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 font-mono shadow-sm" value={encoded.url} /></div>
						<div><div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">JS String</div><textarea readOnly className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-2.5 font-mono shadow-sm" value={encoded.js} /></div>
					</div>
				</div>
			</Section>
			<Section title="Basic SQLi Test Payloads" subtitle="Common SQL injection test patterns">
				<div className="grid sm:grid-cols-2 gap-2">
					{basicSQLi.map((p, i)=> (
						<div key={i} className="font-mono text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 select-all shadow-sm">
							{p}
						</div>
					))}
				</div>
			</Section>
		</div>
	)
} 