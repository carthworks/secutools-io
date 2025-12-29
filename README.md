# 🛡️ SecuTools.io - Cybersecurity Toolkit

A comprehensive, production-ready toolkit of **essential cybersecurity tools** for security researchers, penetration testers, and developers. Built with Next.js 14, TypeScript, and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

- **🔐 Cryptography & Encoding**: Hash tools, JWT manipulation, PGP encryption, Base64 encoding
- **🌐 Web & Cloud Security**: CORS testing, security headers, URL analysis, device fingerprinting
- **🎯 Threat Intelligence**: IOC extraction, CVE lookups, threat intel checks, QR code analysis
- **🧪 Penetration Testing**: Command injection payloads, JWT fuzzing, file upload validation
- **🤖 AI Security**: Prompt testing, jailbreak detection, toxicity checking, context trimming
- **📚 Learning**: Security tips, prompt engineering, text-to-speech

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/secutools-io.git
cd secutools-io

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Available Tools (30+ Tools)

### 🔐 Cryptography & Encoding

| Tool | Description | Status |
|------|-------------|--------|
| **Hash Tools** | MD5, SHA1, SHA256, SHA512 calculators | ✅ Live |
| **JWT Decoder** | Decode and verify JSON Web Tokens | ✅ Live |
| **JWT Fuzzer** | Test JWT vulnerabilities with algorithm confusion attacks | ✅ Live |
| **Password Utilities** | Strength checker and secure generator | ✅ Live |
| **Hash Identifier** | Detect hash type from string | ✅ Live |
| **String Obfuscator** | ROT13, Caesar, XOR, Base conversions | ✅ Live |
| **Certificate Parser** | Parse PEM/DER certificates | ✅ Live |
| **Hash Collision Demo** | Visualize MD5/SHA1 collisions | ✅ Live |
| **Base64/Base32 Encoder** | Encode/decode with file support | ✅ Live |
| **PGP Key Generator** | Generate PGP keys, encrypt/decrypt | ✅ Live |
| **AES/RSA Encryptor** | Client-side encryption | ✅ Live |
| **Unicode/Hex Converter** | Convert between formats | ✅ Live |

### 🌐 Web & Cloud Security

| Tool | Description | Status |
|------|-------------|--------|
| **Security Headers Checker** | Inspect CSP, HSTS, X-Frame-Options | ✅ Live |
| **URL Unshortener & Redirect Tracer** | Expand and trace redirect chains | ✅ Live |
| **CORS Tester** | Detect misconfigured Access-Control headers | ✅ Live |
| **CVE Severity Calculator** | Compute CVSS scores | ✅ Live |
| **Device Info Inspector** | Browser fingerprinting analysis | ✅ Live |

### 🎯 Threat Intelligence

| Tool | Description | Status |
|------|-------------|--------|
| **IOC Extractor** | Extract IPs, URLs, hashes, emails | ✅ Live |
| **CVE Lookup** | Fetch details from CIRCL CVE | ✅ Live |
| **CVE Feed Viewer** | Browse latest CVEs from NVD | ✅ Live |
| **Threat Intel Check** | VirusTotal/AbuseIPDB integration | ✅ Live |
| **WHOIS / RDAP** | Domain ownership & registration | ✅ Live |
| **Email Header Analyzer** | Trace spoofing & spam origins | ✅ Live |
| **QR Code Security Analyzer** | Scan and analyze QR codes for risks | ✅ Live |

### 🧪 Penetration Testing

| Tool | Description | Status |
|------|-------------|--------|
| **Wordlist Generator** | Custom password/wordlists | ✅ Live |
| **Command Injection Tester** | 40+ OS injection payloads across 5 categories | ✅ Live |
| **JWT Fuzzer** | Algorithm confusion & claim manipulation | ✅ Live |
| **File Upload Validator** | MIME spoofing & magic byte detection | ✅ Live |

### 🤖 AI Security

| Tool | Description | Status |
|------|-------------|--------|
| **Prompt Template Builder** | Create reusable structured prompts | ✅ Live |
| **Prompt A/B Tester** | Compare model responses | ✅ Live |
| **Context Trimmer** | Smart token management for LLMs | ✅ Live |
| **Jailbreak Tester** | Test prompt-injection attacks | ✅ Live |
| **Toxicity Classifier** | Detect harmful language | ✅ Live |

### 📚 Learning

| Tool | Description | Status |
|------|-------------|--------|
| **Daily Security Tips** | Flashcards & rotating advice | ✅ Live |
| **PromptShortcuts** | Quick prompt templates | ✅ Live |
| **Text → Voice (TTS)** | Browser-based text-to-speech | ✅ Live |

---

## 🎨 Design Highlights

- **✨ Glassmorphic UI**: Modern backdrop blur effects
- **🌈 Gradient Backgrounds**: Unique color schemes per category
- **🎭 Smooth Animations**: Slide-in effects and hover states
- **📱 Fully Responsive**: Mobile-first design
- **♿ Accessible**: ARIA labels and semantic HTML
- **⚡ Fast**: Client-side processing where possible

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file for API integrations:

```bash
# Optional: VirusTotal API key for threat intel
VT_API_KEY=your_virustotal_api_key

# Optional: AbuseIPDB API key for IP reputation
ABUSEIPDB_KEY=your_abuseipdb_api_key

# Optional: LLM API keys for AI tools
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## 📁 Project Structure

```
secutools-io/
├── app/
│   ├── api/                    # API routes
│   │   ├── trace/             # URL redirect tracing
│   │   ├── cors-check/        # CORS testing
│   │   └── ...
│   ├── command-injection/     # Command injection tester
│   ├── jwt-fuzzer/            # JWT fuzzer
│   ├── file-upload-validator/ # File upload validator
│   ├── url-trace/             # URL tracer
│   ├── cors-check/            # CORS tester
│   ├── context-trimmer/       # Context trimmer
│   └── ...
├── components/
│   ├── Section.tsx            # Reusable section
│   └── Navigation.tsx         # Header navigation
└── public/                    # Static assets
```

---

## 🚢 Deployment

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
docker build -t secutools-io .

# Run container
docker run -p 3000:3000 secutools-io
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Tools

1. Create new page in `app/[tool-name]/page.tsx`
2. Add API route in `app/api/[tool-name]/route.ts` if needed
3. Update `app/data.ts` with tool metadata
4. Set `isPublish: true` to make it visible

---

## 🔒 Privacy & Security

- **Client-side Processing**: Most tools run entirely in the browser
- **No Data Storage**: No user data is stored or tracked
- **Open Source**: Full transparency with public codebase
- **API Keys**: Optional external API integrations only
- **Ethical Use**: All penetration testing tools include ethical use warnings

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/secutools-io.git

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

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OWASP](https://owasp.org/) for security guidelines
- [MITRE ATT&CK](https://attack.mitre.org/) for threat intelligence framework
- [CIRCL](https://www.circl.lu/) for CVE database
- [VirusTotal](https://www.virustotal.com/) for threat intelligence
- [AbuseIPDB](https://www.abuseipdb.com/) for IP reputation

---

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/secutools-io/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/secutools-io/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/secutools-io/discussions)
- **Email**: tkarthikeyan@gmail.com

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/secutools-io&type=Date)](https://star-history.com/#your-username/secutools-io&Date)

---

**Built with ❤️ for the cybersecurity community**

🛡️ **SecuTools.io** - Your comprehensive security toolkit

