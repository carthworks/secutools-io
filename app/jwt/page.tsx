"use client"
import { useState } from 'react'
import Section from '@/components/Section'

export default function JwtPage(){
	const [token, setToken] = useState('')
	const [secret, setSecret] = useState('')
	const [decoded, setDecoded] = useState<Record<string, unknown> | null>(null);
	const [verified, setVerified] = useState<string>('');

	async function decode() {
		try {
			const res = await fetch('/api/jwt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, secret }) });
			if (!res.ok) throw new Error('Network response was not ok');
			const data = await res.json();
			setDecoded(data.decoded);
			setVerified(data.verified ? 'Valid signature' : (data.error || 'Not verified'));
		} catch (error: any) {
			setDecoded(null);
			setVerified(error.message || 'Error decoding JWT');
		}
	}

	return (
		<div className="space-y-8">
			<Section title="JWT Decoder" subtitle="Decodes header and payload and verifies if a key is provided">
				<div className="flex flex-col gap-3">
					<textarea value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste JWT" className="w-full h-28 bg-slate-950 border border-slate-800 rounded p-2" />
					<input value={secret} onChange={e=>setSecret(e.target.value)} placeholder="Optional secret/public key (PEM)" className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
					<button onClick={decode} className="px-3 py-1 rounded bg-primary text-black font-medium">Decode</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded p-2">{decoded ? JSON.stringify(decoded, null, 2) : ''}</pre>
					<div className="text-sm">{verified}</div>
				</div>
			</Section>
		</div>
	)
} 