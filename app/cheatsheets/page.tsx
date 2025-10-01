import Section from '@/components/Section'

export default function CheatsheetsPage(){
	return (
		<div className="space-y-8">
			<Section title="OWASP Top 10 (2021)">
				<ul className="list-disc pl-5 text-sm space-y-1">
					<li><a className="text-primary" href="https://owasp.org/Top10/" target="_blank" rel="noreferrer">OWASP Top 10 official site</a></li>
					<li>A01: Broken Access Control</li>
					<li>A02: Cryptographic Failures</li>
					<li>A03: Injection</li>
					<li>A04: Insecure Design</li>
					<li>A05: Security Misconfiguration</li>
					<li>A06: Vulnerable and Outdated Components</li>
					<li>A07: Identification and Authentication Failures</li>
					<li>A08: Software and Data Integrity Failures</li>
					<li>A09: Security Logging and Monitoring Failures</li>
					<li>A10: Server-Side Request Forgery</li>
				</ul>
			</Section>
			<Section title="MITRE ATT&CK">
				<p className="text-sm text-slate-300">Quick lookup: <a className="text-primary" href="https://attack.mitre.org/" target="_blank" rel="noreferrer">MITRE ATT&CK Matrix</a></p>
			</Section>
		</div>
	)
} 