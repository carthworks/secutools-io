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
				<div className="grid sm:grid-cols-2 gap-4">
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Raw Log / JSON Input</label>
						<textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder="Paste raw Apache, Nginx, or JSON logs here..." className="w-full h-64 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
					</div>
					<div>
						<label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Formatted Output</label>
						<textarea readOnly value={out} placeholder="Beautified output will appear here..." className="w-full h-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg p-3 font-mono text-xs focus:outline-none shadow-sm" />
					</div>
				</div>
				<button onClick={beautify} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm">Beautify Logs</button>
			</Section>
		</div>
	)
} 