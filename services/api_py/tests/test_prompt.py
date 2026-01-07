from qa.prompt import build_prompt


def test_includes_question_and_context_chunks_separated_by_rule():
    prompt = build_prompt("Q1?", ["A", "B"])

    assert "Use ONLY the context below to answer the question." in prompt
    assert (
        "If the answer is not in the context, say: I don't know based on the provided documents." in prompt
    )
    assert "Context:" in prompt
    assert "A\n\n---\n\nB" in prompt
    assert "Question:\nQ1?" in prompt


def test_uses_no_context_when_chunks_empty():
    prompt = build_prompt("Q2?", [])
    assert "Context:\n(no context)" in prompt
    assert "Question:\nQ2?" in prompt
