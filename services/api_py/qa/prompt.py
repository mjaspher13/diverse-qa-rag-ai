from __future__ import annotations


def build_prompt(question: str, chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(chunks) if chunks else "(no context)"

    parts = [
        "Use ONLY the context below to answer the question.",
        "If the answer is not in the context, say: I don't know based on the provided documents.",
        "",
        "Context:",
        context,
        "",
        "Question:",
        question,
    ]

    return "\n".join(parts)
