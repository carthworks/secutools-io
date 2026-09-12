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
					<textarea value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste JWT" className="w-full h-28 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
					<input value={secret} onChange={e=>setSecret(e.target.value)} placeholder="Optional secret/public key (PEM)" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
					<button onClick={decode} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Decode</button>
					<pre className="text-xs whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 font-mono overflow-auto">{decoded ? JSON.stringify(decoded, null, 2) : ''}</pre>
					<div className="text-sm font-medium text-slate-700 dark:text-slate-300">{verified}</div>
				</div>
			</Section>
		</div>
	)
} 