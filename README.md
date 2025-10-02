#  Cybersecurity Handy Tools

A comprehensive toolkit of essential cybersecurity tools for students and professionals. Built with Next.js 14, TypeScript, and Tailwind CSS.

##  Features

- ** Cryptography Tools**: Hash calculators, JWT decoders, password utilities
- ** Network Analysis**: DNS lookups, SSL certificate checks, port scanning
- ** Threat Intelligence**: IOC extraction, CVE lookups, threat intel checks
- ** Analysis Tools**: Log parsing, PCAP analysis, timestamp conversion
- ** Testing & Payloads**: XSS/SQLi payloads, security cheatsheets

##  Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cybersecurity-handy-tools.git
cd cybersecurity-handy-tools

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Available Tools

### Cryptography
- **Hash Tools**: MD5, SHA1, SHA256, SHA512 calculators + identifier
- **JWT Decoder**: Decode and verify JSON Web Tokens
- **Password Utilities**: Strength checker and secure generator

### Network Analysis
- **IP & DNS Toolkit**: GeoIP lookup, DNS records (A, MX, TXT, NS), reverse DNS
- **SSL/TLS Checker**: Certificate expiry, issuer, cipher strength
- **Port Check**: TCP service reachability testing
- **HTTP Headers**: CORS & CSP policy analysis

### Threat Intelligence
- **IOC Extractor**: Extract IPs, URLs, hashes, emails from text
- **CVE Lookup**: Fetch vulnerability details from CIRCL CVE API
- **Threat Intel Check**: VirusTotal/AbuseIPDB integration (with API keys)
- **WHOIS/RDAP**: Domain and IP ownership lookup

### Analysis Tools
- **Log Beautifier**: Format JSON, Apache, Nginx, Syslog
- **PCAP Decoder**: View packet timestamps, sizes, hex data
- **Timestamp Converter**: Unix  Human-readable time
- **Subdomain Finder**: Dictionary-based subdomain enumeration

### Testing & Payloads
- **XSS/SQLi Payloads**: HTML entities, URL encoding, JS encoding + test payloads
- **Cheatsheets**: OWASP Top 10, MITRE ATT&CK quick reference

##  Configuration

### Environment Variables

Create a `.env.local` file for API integrations:

```bash
# Optional: VirusTotal API key for threat intel
VT_API_KEY=your_virustotal_api_key

# Optional: AbuseIPDB API key for IP reputation
ABUSEIPDB_KEY=your_abuseipdb_api_key
```

### API Keys Setup

1. **VirusTotal**: Get free API key at [virustotal.com](https://www.virustotal.com/)
2. **AbuseIPDB**: Get free API key at [abuseipdb.com](https://www.abuseipdb.com/)

##  Project Structure

```
cybersecurity-handy-tools/
 app/
    api/                 # API routes
       hash/           # Hash calculation
       jwt/            # JWT decoding
       dns/            # DNS lookups
       ssl/            # SSL certificate checks
       ...
    hash/               # Hash tools page
    jwt/                # JWT decoder page
    about/              # About page
    contact/            # Contact page
    tools/              # All tools overview
 components/
    Section.tsx         # Reusable section component
    Navigation.tsx      # Header navigation
 public/                 # Static assets
```

##  Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build Docker image
docker build -t cybersecurity-tools .

# Run container
docker run -p 3000:3000 cybersecurity-tools
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

##  Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start         # Start production server
npm run lint         # Run ESLint
```

### Adding New Tools

1. Create new page in `app/[tool-name]/page.tsx`
2. Add API route in `app/api/[tool-name]/route.ts` if needed
3. Update navigation in `components/Navigation.tsx`
4. Add to tools list in `app/tools/page.tsx`

##  Privacy & Security

- **Client-side Processing**: Most tools run entirely in the browser
- **No Data Storage**: No user data is stored or tracked
- **Open Source**: Full transparency with public codebase
- **API Keys**: Optional external API integrations only

##  Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/cybersecurity-handy-tools.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Submitting Changes

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- [OWASP](https://owasp.org/) for security guidelines
- [MITRE ATT&CK](https://attack.mitre.org/) for threat intelligence framework
- [CIRCL](https://www.circl.lu/) for CVE database
- [VirusTotal](https://www.virustotal.com/) for threat intelligence
- [AbuseIPDB](https://www.abuseipdb.com/) for IP reputation

##  Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/cybersecurity-handy-tools/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/cybersecurity-handy-tools/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/cybersecurity-handy-tools/discussions)
- **Email**: tkarthikeyan@gmail.com

##  Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/cybersecurity-handy-tools&type=Date)](https://star-history.com/#your-username/cybersecurity-handy-tools&Date)

---

**Built with  for the cybersecurity community**
