"use client"
import { useState } from 'react'
import Section from '@/components/Section'

function tryParseJSON(s: string){
	try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return null }
}

const apacheLike = /^(\S+) (\S+) (\S+) \[([^\]]+)\] "([A-Z]+) (\S+) ([^"]+)" (\d{3}) (\d+|-) "([^"]*)" "([^"]*)"/

function parseApache(line: string){
	const m = line.match(apacheLike)
	if (!m) return null
	return {
		ip: m[1], userIdent: m[2], userAuth: m[3], time: m[4], method: m[5], path: m[6], proto: m[7], status: Number(m[8]), size: m[9], referer: m[10], agent: m[11]
	}
}

export default function LogsPage(){
	const [raw, setRaw] = useState('')
	const [out, setOut] = useState('')

	function beautify(){
		const json = tryParseJSON(raw)
		if (json) { setOut(json); return }
		const lines = raw.split(/\r?\n/).filter(Boolean)
		const parsed = lines.map(l => parseApache(l) || { line: l })
		setOut(JSON.stringify(parsed, null, 2))
	}

	return (
		<div className="space-y-8">
			<Section title="Log Beautifier" subtitle="Pretty JSON and basic Apache/Nginx parser">
				<div className="grid sm:grid-cols-2 gap-3">
					<textarea value={raw} onChange={e=>setRaw(e.target.value)} className="h-64 bg-slate-950 border border-slate-800 rounded p-2" />
					<textarea readOnly value={out} className="h-64 bg-slate-950 border border-slate-800 rounded p-2" />
				</div>
				<button onClick={beautify} className="mt-3 px-3 py-1 rounded bg-primary text-black font-medium">Beautify</button>
			</Section>
		</div>
	)
} 