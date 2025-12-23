import InDevelopment from "@/components/InDevelopment";

export default function XXEPage() {
    return (
        <InDevelopment
            toolName="XXE Payload Generator"
            estimatedDate="Q1 2026"
            features={[
                "Generate XML External Entity (XXE) injection payloads",
                "Support for file disclosure, SSRF, and DoS attacks",
                "Multiple payload variants and encoding options",
                "Test different XML parsers and configurations",
                "Educational examples with explanations",
                "Remediation guidance for developers",
            ]}
        />
    );
}
