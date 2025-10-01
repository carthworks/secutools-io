"use client"
import { useState } from 'react'
import Section from '@/components/Section'

function readUint32(view: DataView, offset: number, le: boolean){ return le ? view.getUint32(offset, true) : view.getUint32(offset, false) }
function readUint16(view: DataView, offset: number, le: boolean){ return le ? view.getUint16(offset, true) : view.getUint16(offset, false) }

function parsePcap(buf: ArrayBuffer){
	const view = new DataView(buf)
	const magic = view.getUint32(0, false)
	let le = false
	if (magic === 0xa1b2c3d4) le = false
	else if (magic === 0xd4c3b2a1) le = true
	else return { error: 'Not a PCAP file (magic mismatch)' }
	const snaplen = readUint32(view, 16, le)
	const network = readUint32(view, 20, le)
	let offset = 24
	const packets: any[] = []
	while (offset + 16 <= view.byteLength){
		const tsSec = readUint32(view, offset + 0, le)
		const tsUsec = readUint32(view, offset + 4, le)
		const inclLen = readUint32(view, offset + 8, le)
		const origLen = readUint32(view, offset + 12, le)
		offset += 16
		const data = new Uint8Array(buf, offset, Math.min(inclLen, snaplen))
		packets.push({ ts: new Date(tsSec * 1000 + Math.floor(tsUsec/1000)).toISOString(), inclLen, origLen, firstBytes: Array.from(data.slice(0, 16)).map(b=>b.toString(16).padStart(2,'0')).join(' ') })
		offset += inclLen
	}
	return { magic: magic.toString(16), snaplen, network, packets }
}

export default function PCAPPage(){
	const [summary, setSummary] = useState<any>(null)

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>){
		const f = e.target.files?.[0]
		if (!f) return
		const ab = await f.arrayBuffer()
		setSummary(parsePcap(ab))
	}

	return (
		<div className="space-y-8">
			<Section title="PCAP Decoder (MVP)" subtitle="Shows packet timestamps, sizes, and first bytes">
				<input type="file" accept=".pcap" onChange={handleFile} className="bg-slate-950 border border-slate-800 rounded p-2" />
				<pre className="mt-3 text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{summary? JSON.stringify(summary, null, 2): ''}</pre>
			</Section>
		</div>
	)
} 