import { buildPrompt } from "../prompt";

describe("buildPrompt", () => {
  test("includes question and context chunks separated by ---", () => {
    const prompt = buildPrompt("Q1?", ["A", "B"]);

    expect(prompt).toContain("Use ONLY the context below to answer the question.");
    expect(prompt).toContain("If the answer is not in the context, say: I don't know based on the provided documents.");
    expect(prompt).toContain("Context:");
    expect(prompt).toContain("A\n\n---\n\nB");
    expect(prompt).toContain("Question:\nQ1?");
  });

  test("uses (no context) when chunks is empty", () => {
    const prompt = buildPrompt("Q2?", []);
    expect(prompt).toContain("Context:\n(no context)");
    expect(prompt).toContain("Question:\nQ2?");
  });
});
