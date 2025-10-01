import { NextRequest } from 'next/server'

export async function POST(req: NextRequest){
	const { ip, url, hash } = await req.json()
	const vtKey = process.env.VT_API_KEY
	const abuseKey = process.env.ABUSEIPDB_KEY
	const out: any = {}
	if (vtKey){
		try {
			if (ip) {
				const r = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(ip)}`, { headers: { 'x-apikey': vtKey } })
				out.vt_ip = r.ok ? await r.json() : { error: r.status }
			}
			if (url) {
				const r = await fetch('https://www.virustotal.com/api/v3/urls', { method:'POST', headers: { 'x-apikey': vtKey, 'content-type':'application/x-www-form-urlencoded' }, body: `url=${encodeURIComponent(url)}` })
				out.vt_url = r.ok ? await r.json() : { error: r.status }
			}
			if (hash){
				const r = await fetch(`https://www.virustotal.com/api/v3/files/${encodeURIComponent(hash)}`, { headers: { 'x-apikey': vtKey } })
				out.vt_hash = r.ok ? await r.json() : { error: r.status }
			}
		} catch (e){ out.vt_error = (e as Error).message }
	}
	if (abuseKey && ip){
		try {
			const r = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, { headers: { Key: abuseKey, Accept: 'application/json' } })
			out.abuseipdb = r.ok ? await r.json() : { error: r.status }
		} catch (e){ out.abuseipdb_error = (e as Error).message }
	}
	return Response.json(out)
} 