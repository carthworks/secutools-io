import { NextRequest } from 'next/server'

export async function POST(req: NextRequest){
	const { query } = await req.json()
	if (!query || typeof query !== 'string') return Response.json({ error: 'query required (domain or ip)' }, { status: 400 })
	const isIP = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(query) || /^[0-9a-f:]+$/i.test(query)
	const endpoint = isIP ? `https://rdap.org/ip/${encodeURIComponent(query)}` : `https://rdap.org/domain/${encodeURIComponent(query)}`
	const res = await fetch(endpoint, { headers: { 'user-agent': 'Cybersecurity-Handy-Tools' } })
	if (!res.ok) return Response.json({ error: `Lookup failed (${res.status})` }, { status: res.status })
	const data = await res.json()
	return Response.json(data)
} 