import { NextRequest } from 'next/server'

export async function POST(req: NextRequest){
	const { url } = await req.json()
	try {
		const res = await fetch(url, { method: 'GET', redirect: 'follow' })
		const headers: Record<string, string> = {}
		res.headers.forEach((v, k)=> headers[k] = v)
		const cors = {
			allowOrigin: headers['access-control-allow-origin'] || null,
			allowMethods: headers['access-control-allow-methods'] || null,
			allowHeaders: headers['access-control-allow-headers'] || null,
		}
		const csp = headers['content-security-policy'] || null
		return Response.json({ status: res.status, headers, cors, csp })
	} catch (e){
		return Response.json({ error: (e as Error).message }, { status: 400 })
	}
} 