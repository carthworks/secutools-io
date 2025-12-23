import InDevelopment from "@/components/InDevelopment";

export default function JWTCrackerPage() {
    return (
        <InDevelopment
            toolName="JWT Cracker"
            estimatedDate="Q1 2026"
            features={[
                "Test JWT tokens against common weak signing keys",
                "Dictionary-based brute force attacks on HS256/HS384/HS512",
                "Support for custom wordlists",
                "Real-time cracking progress with performance metrics",
                "Export results and vulnerability reports",
                "Integration with common JWT vulnerabilities database",
            ]}
        />
    );
}
