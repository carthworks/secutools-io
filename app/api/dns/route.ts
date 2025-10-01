import { NextRequest } from 'next/server'
import dns from 'node:dns/promises'

export async function POST(req: NextRequest){
	const body = await req.json()
	if (body.reverse){
		try {
			const result = await dns.reverse(body.reverse)
			return Response.json({ ptr: result })
		} catch (e){
			return Response.json({ error: (e as Error).message }, { status: 400 })
		}
	}
	const domain: string = body.domain
	if (!domain) return Response.json({ error: 'domain required' }, { status: 400 })
	try {
		const [a, mx, txt, ns] = await Promise.all([
			dns.resolve4(domain).catch(()=>[]),
			dns.resolveMx(domain).catch(()=>[]),
			dns.resolveTxt(domain).catch(()=>[]),
			dns.resolveNs(domain).catch(()=>[]),
		])
		return Response.json({ a, mx, txt, ns })
	} catch (e){
		return Response.json({ error: (e as Error).message }, { status: 400 })
	}
} 