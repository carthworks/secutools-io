import Link from 'next/link'

const tools = [
	{ slug: 'hash', title: 'Hash Tools', desc: 'MD5, SHA1, SHA256, SHA512, identifier' },
	{ slug: 'jwt', title: 'JWT Decoder', desc: 'Decode and verify JWTs' },
	{ slug: 'password', title: 'Password Utilities', desc: 'Strength checker and generator' },
	{ slug: 'ip-dns', title: 'IP & DNS Toolkit', desc: 'GeoIP, DNS records, rDNS' },
	{ slug: 'ssl', title: 'SSL/TLS Checker', desc: 'Certificate info and expiry' },
	{ slug: 'payloads', title: 'XSS/SQLi Payloads', desc: 'Encoders and test payloads' },
	{ slug: 'ioc', title: 'IOC Extractor', desc: 'Extract IPs, URLs, hashes, emails' },
	{ slug: 'logs', title: 'Log Beautifier', desc: 'Format JSON, Apache, Nginx, Syslog' },
	{ slug: 'timestamp', title: 'Timestamp Converter', desc: 'Unix ↔ Human time' },
	{ slug: 'cheatsheets', title: 'Cheatsheets', desc: 'OWASP Top 10, MITRE ATT&CK' },
	{ slug: 'cve', title: 'CVE Lookup', desc: 'Fetch details from CIRCL CVE' },
	{ slug: 'threat', title: 'Threat Intel Check', desc: 'VirusTotal/AbuseIPDB (with keys)' },
	{ slug: 'pcap', title: 'PCAP Decoder', desc: 'View timestamps, sizes, hex' },
	{ slug: 'whois', title: 'WHOIS / RDAP', desc: 'Ownership & registration' },
	{ slug: 'headers', title: 'HTTP Headers', desc: 'CORS & CSP overview' },
	{ slug: 'port', title: 'Port Check', desc: 'TCP reachability' },
	{ slug: 'subdomain', title: 'Subdomain Finder', desc: 'Dictionary-based' },
]

export default function HomePage() {
	return (
		<div className="space-y-10">
			<section className="text-center space-y-4">
				<h1 className="text-3xl sm:text-4xl font-semibold">Cybersecurity Handy Tools</h1>
				<p className="text-slate-600 max-w-2xl mx-auto">Everyday tools for students and professionals. Fast, privacy-friendly, and open.</p>
			</section>
			<section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{tools.map(t => (
					<Link key={t.slug} href={`/${t.slug}`} className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-4 block">
						<div className="font-medium">{t.title}</div>
						<div className="text-sm text-slate-500">{t.desc}</div>
					</Link>
				))}
			</section>
		</div>
	)
} 