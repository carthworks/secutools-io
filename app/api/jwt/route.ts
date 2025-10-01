import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
	const { token, secret } = await req.json()
	try {
		const decoded = jwt.decode(token, { complete: true })
		let verified = false
		if (secret) {
			try {
				jwt.verify(token, secret)
				verified = true
			} catch (e) {
				return new Response(JSON.stringify({ decoded, verified: false, error: (e as Error).message }), { headers: { 'content-type': 'application/json' } })
			}
		}
		return new Response(JSON.stringify({ decoded, verified }), { headers: { 'content-type': 'application/json' } })
	} catch (e) {
		return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400, headers: { 'content-type': 'application/json' } })
	}
} 