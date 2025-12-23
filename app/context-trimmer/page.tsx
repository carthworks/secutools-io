import InDevelopment from "@/components/InDevelopment";

export default function ContextTrimmerPage() {
    return (
        <InDevelopment
            toolName="Context Trimmer"
            estimatedDate="Q1 2026"
            features={[
                "Automatically shorten context to fit token limits",
                "Smart truncation preserving important information",
                "Support for multiple LLM token limits (GPT-4, Claude, etc.)",
                "Semantic chunking and summarization",
                "Token counting for various models",
                "Export optimized prompts",
            ]}
        />
    );
}
