import { NextRequest } from 'next/server'
import net from 'node:net'

export async function POST(req: NextRequest){
	const { host, port } = await req.json()
	return new Promise<Response>((resolve) => {
		const socket = net.connect({ host, port: Number(port || 80) })
		const start = Date.now()
		socket.on('connect', () => {
			const ms = Date.now() - start
			socket.end()
			resolve(Response.json({ reachable: true, ms }))
		})
		socket.setTimeout(5000, () => {
			socket.destroy()
			resolve(Response.json({ reachable: false, timeout: true }))
		})
		socket.on('error', (err) => {
			resolve(Response.json({ reachable: false, error: err.message }))
		})
	})
} 