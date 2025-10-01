import { NextRequest } from 'next/server'
import crypto from 'node:crypto'

export async function POST(req: NextRequest) {
	const { algo, input } = await req.json()
	const map: Record<string, string> = { md5: 'md5', sha1: 'sha1', sha256: 'sha256', sha512: 'sha512' }
	const chosen = map[String(algo)?.toLowerCase()] || 'sha256'
	const hash = crypto.createHash(chosen).update(input ?? '', 'utf8').digest('hex')
	return new Response(JSON.stringify({ hash }), { headers: { 'content-type': 'application/json' } })
} 