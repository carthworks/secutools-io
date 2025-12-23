import InDevelopment from "@/components/InDevelopment";

export default function CORSCheckPage() {
    return (
        <InDevelopment
            toolName="CORS Tester"
            estimatedDate="Q1 2026"
            features={[
                "Test CORS configuration for any domain",
                "Detect misconfigured Access-Control headers",
                "Check for wildcard origins and credential exposure",
                "Test preflight OPTIONS requests",
                "Identify potential CORS vulnerabilities",
                "Generate security recommendations",
            ]}
        />
    );
}
