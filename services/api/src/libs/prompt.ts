export function buildPrompt(question: string, chunks: string[]): string {
    const context = chunks.length ? chunks.join("\n\n---\n\n") : "(no context)";

    return [
        "Use ONLY the context below to answer the question.",
        "If the answer is not in the context, say: I don't know based on the provided documents.",
        "",
        "Context:",
        context,
        "",
        "Question:",
        question,
    ].join("\n");
}
