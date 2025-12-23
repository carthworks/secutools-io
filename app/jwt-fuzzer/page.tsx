import InDevelopment from "@/components/InDevelopment";

export default function JWTFuzzerPage() {
    return (
        <InDevelopment
            toolName="JWT Fuzzer"
            estimatedDate="Q1 2026"
            features={[
                "Modify JWT claims and signatures for testing",
                "Test algorithm confusion attacks (none, HS256, RS256)",
                "Inject malicious payloads in claims",
                "Test token expiration and validation",
                "Generate proof-of-concept exploits",
                "Educational mode with vulnerability explanations",
            ]}
        />
    );
}
