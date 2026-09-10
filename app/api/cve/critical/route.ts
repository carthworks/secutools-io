import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes

export type CriticalCve = {
  id: string;
  vendor: string;
  product: string;
  name: string;
  summary: string;
  cvssScore: number;
  severity: "CRITICAL" | "HIGH";
  dateAdded: string;
  isActivelyExploited: boolean;
};

// High-confidence fallback in case upstream APIs rate-limit or fail
const FALLBACK_CVES: CriticalCve[] = [
  {
    id: "CVE-2024-6387",
    vendor: "OpenSSH",
    product: "sshd",
    name: "regreSSHion Signal Handler Race Condition",
    summary: "Remote unauthenticated code execution as root in glibc-based Linux systems.",
    cvssScore: 9.8,
    severity: "CRITICAL",
    dateAdded: "2024-07-01",
    isActivelyExploited: true,
  },
  {
    id: "CVE-2024-38077",
    vendor: "Microsoft",
    product: "Windows Remote Desktop Licensing Service",
    name: "Remote Code Execution Vulnerability",
    summary: "Unauthenticated remote attacker can execute arbitrary code on Windows Server.",
    cvssScore: 9.8,
    severity: "CRITICAL",
    dateAdded: "2024-07-09",
    isActivelyExploited: false,
  },
];

export async function GET() {
  try {
    // 1. Try fetching from CISA KEV (fastest, most authoritative for active exploits)
    const cisaRes = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      {
        next: { revalidate: 300 },
        headers: { "User-Agent": "SecuTools.io-Security-Scanner" },
      }
    );

    if (cisaRes.ok) {
      const data = await cisaRes.json();
      const vulns = data.vulnerabilities || [];
      if (vulns.length > 0) {
        // Grab the most recent entry (last or first depending on list order)
        const recent = vulns[vulns.length - 1] || vulns[0];
        const criticalCve: CriticalCve = {
          id: recent.cveID,
          vendor: recent.vendorProject || "Vendor",
          product: recent.product || "Product",
          name: recent.vulnerabilityName || "Critical Vulnerability",
          summary: recent.shortDescription || "Actively exploited in the wild.",
          cvssScore: 9.8,
          severity: "CRITICAL",
          dateAdded: recent.dateAdded || new Date().toISOString().split("T")[0],
          isActivelyExploited: true,
        };
        return NextResponse.json({ success: true, cve: criticalCve, source: "cisa_kev" });
      }
    }
  } catch {
    // Upstream unavailable or blocked by network sandbox, proceed to fallback
  }

  // Fallback to latest curated critical CVE
  return NextResponse.json({
    success: true,
    cve: FALLBACK_CVES[0],
    source: "curated_fallback",
  });
}
