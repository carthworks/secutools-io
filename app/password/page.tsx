"use client"
import { useMemo, useState } from 'react'
import Section from '@/components/Section'

function estimateEntropy(pass: string): number {
	let pool = 0
	if (/[a-z]/.test(pass)) pool += 26
	if (/[A-Z]/.test(pass)) pool += 26
	if (/[0-9]/.test(pass)) pool += 10
	if (/[^A-Za-z0-9]/.test(pass)) pool += 32
	if (pool === 0) return 0
	return Math.log2(pool) * pass.length
}

const commonSample = new Set(['password','123456','qwerty','letmein','admin','welcome','iloveyou'])

function generatePassword(len: number, useLower=true, useUpper=true, useDigits=true, useSymbols=true): string {
	const lower = 'abcdefghijklmnopqrstuvwxyz'
	const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const digits = '0123456789'
	const symbols = '!@#$%^&*()-_=+[]{};:,.?/\\'
	let alphabet = ''
	if (useLower) alphabet += lower
	if (useUpper) alphabet += upper
	if (useDigits) alphabet += digits
	if (useSymbols) alphabet += symbols
	if (!alphabet) return ''
	const array = new Uint32Array(len)
	crypto.getRandomValues(array)
	return Array.from(array, v => alphabet[v % alphabet.length]).join('')
}

export default function PasswordPage(){
	const [pwd, setPwd] = useState('')
	const [len, setLen] = useState(16)
	const [opts, setOpts] = useState({ lower:true, upper:true, digits:true, symbols:true })

	const entropy = useMemo(()=>estimateEntropy(pwd), [pwd])
	const verdict = entropy >= 80 ? 'Strong' : entropy >= 60 ? 'Good' : entropy >= 40 ? 'Weak' : 'Very Weak'
	const inCommon = commonSample.has(pwd)

	return (
		<div className="space-y-8">
			<Section title="Password Strength Checker" subtitle="Entropy estimate and common password check">
				<div className="flex flex-col gap-3">
					<input value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Enter password" className="w-full bg-slate-950 border border-slate-800 rounded p-2" />
					<div className="text-sm">Entropy: {entropy.toFixed(1)} bits — {verdict}{inCommon ? ' (Common password!)' : ''}</div>
				</div>
			</Section>
			<Section title="Secure Password Generator" subtitle="Client-side cryptographically random">
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-3 text-sm">
						<label className="flex items-center gap-1"><input type="checkbox" checked={opts.lower} onChange={e=>setOpts({...opts, lower:e.target.checked})}/>lower</label>
						<label className="flex items-center gap-1"><input type="checkbox" checked={opts.upper} onChange={e=>setOpts({...opts, upper:e.target.checked})}/>upper</label>
						<label className="flex items-center gap-1"><input type="checkbox" checked={opts.digits} onChange={e=>setOpts({...opts, digits:e.target.checked})}/>digits</label>
						<label className="flex items-center gap-1"><input type="checkbox" checked={opts.symbols} onChange={e=>setOpts({...opts, symbols:e.target.checked})}/>symbols</label>
						<input type="number" value={len} min={4} max={128} onChange={e=>setLen(Number(e.target.value))} className="w-24 bg-slate-950 border border-slate-800 rounded p-1" />
						<button onClick={()=>setPwd(generatePassword(len, opts.lower, opts.upper, opts.digits, opts.symbols))} className="px-3 py-1 rounded bg-primary text-black font-medium">Generate</button>
					</div>
				</div>
			</Section>
		</div>
	)
} 