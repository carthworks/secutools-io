import InDevelopment from "@/components/InDevelopment";

export default function ClickjackPage() {
    return (
        <InDevelopment
            toolName="Clickjacking Tester"
            estimatedDate="Q1 2026"
            features={[
                "Test websites for clickjacking vulnerabilities",
                "Check X-Frame-Options and CSP frame-ancestors headers",
                "Visual demonstration of iframe embedding",
                "Frame-busting script detection",
                "Generate proof-of-concept demonstrations",
                "Remediation guidance and best practices",
            ]}
        />
    );
}
