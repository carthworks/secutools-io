import { NextRequest } from 'next/server'

export async function POST(req: NextRequest){
	const { ip } = await req.json()
	const target = ip?.trim() || ''
	const url = `https://ipapi.co/${encodeURIComponent(target)}/json/`
	const res = await fetch(url, { headers: { 'user-agent': 'Cybersecurity-Handy-Tools' } })
	const data = await res.json()
	return Response.json(data)
} 