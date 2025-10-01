import { NextRequest } from 'next/server'
import tls from 'node:tls'

function getCertInfo(host: string, port: number): Promise<any> {
	return new Promise((resolve) => {
		const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
			const cert = socket.getPeerCertificate(true)
			const protocol = socket.getProtocol()
			resolve({
				protocol,
				cert: {
					subject: cert.subject,
					issuer: cert.issuer,
					valid_from: cert.valid_from,
					valid_to: cert.valid_to,
					fingerprint256: cert.fingerprint256,
				}
			})
			socket.end()
		})
		// Basic error handling
		socket.on('error', (err) => resolve({ error: err.message }))
	})
}

export async function POST(req: NextRequest){
	const { host, port } = await req.json()
	if (!host) return Response.json({ error: 'host required' }, { status: 400 })
	const info = await getCertInfo(String(host), Number(port || 443))
	return Response.json(info)
} 