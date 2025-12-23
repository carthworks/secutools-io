import InDevelopment from "@/components/InDevelopment";

export default function AIPapersPage() {
    return (
        <InDevelopment
            toolName="AI Paper Digest"
            estimatedDate="Q2 2026"
            features={[
                "Weekly summaries of top LLM research papers",
                "Curated content from arXiv, OpenReview, and conferences",
                "Plain-language explanations of complex concepts",
                "Key findings and practical implications",
                "Search and filter by topic or author",
                "Bookmark and share interesting papers",
            ]}
        />
    );
}
