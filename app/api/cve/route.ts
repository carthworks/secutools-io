import { NextRequest } from 'next/server'

export async function POST(req: NextRequest){
	const { id } = await req.json()
	if (!id || typeof id !== 'string') return Response.json({ error: 'id required (e.g. CVE-2023-12345)' }, { status: 400 })
	const url = `https://cve.circl.lu/api/cve/${encodeURIComponent(id)}`
	const res = await fetch(url, { headers: { 'user-agent': 'Cybersecurity-Handy-Tools' } })
	if (!res.ok) return Response.json({ error: `Lookup failed (${res.status})` }, { status: res.status })
	const data = await res.json()
	return Response.json(data)
} 