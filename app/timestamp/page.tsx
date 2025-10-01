"use client"
import { useEffect, useState } from 'react'
import Section from '@/components/Section'

function toUnix(d: Date){ return Math.floor(d.getTime()/1000) }

export default function TimestampPage(){
	const [unix, setUnix] = useState<number>(()=>toUnix(new Date()))
	const [human, setHuman] = useState<string>('')

	useEffect(()=>{
		setHuman(new Date(unix*1000).toISOString())
	}, [unix])

	function fromHuman(){
		const t = Date.parse(human)
		if (!isNaN(t)) setUnix(Math.floor(t/1000))
	}

	return (
		<div className="space-y-8">
			<Section title="Timestamp Converter" subtitle="Unix ↔ ISO 8601">
				<div className="grid sm:grid-cols-2 gap-3 items-start">
					<div>
						<label className="text-xs text-slate-400">Unix</label>
						<input type="number" value={unix} onChange={e=>setUnix(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
					</div>
					<div>
						<label className="text-xs text-slate-400">ISO 8601</label>
						<input value={human} onChange={e=>setHuman(e.target.value)} onBlur={fromHuman} className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
					</div>
				</div>
			</Section>
		</div>
	)
} 