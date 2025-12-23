import InDevelopment from "@/components/InDevelopment";

export default function PromptLeakPage() {
    return (
        <InDevelopment
            toolName="Prompt Leakage Detector"
            estimatedDate="Q1 2026"
            features={[
                "Detect system prompt exposure in model responses",
                "Test for prompt injection vulnerabilities",
                "Identify overfitting and memorization issues",
                "Automated testing with various attack vectors",
                "Security scoring and risk assessment",
                "Mitigation strategies and best practices",
            ]}
        />
    );
}
