import { chunkText } from "../chunk";

describe("chunkText", () => {
  test("throws if chunkSize <= overlap", () => {
    expect(() => chunkText("hello", 100, 100)).toThrow(
      "chunkSize must be greater than overlap"
    );
    expect(() => chunkText("hello", 100, 120)).toThrow(
      "chunkSize must be greater than overlap"
    );
  });

  test("chunks text with overlap and reconstructs original when de-overlapped", () => {
    const text = "a".repeat(2500);
    const chunkSize = 1000;
    const overlap = 200;

    const chunks = chunkText(text, chunkSize, overlap);

    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(1000);
    expect(chunks[1].length).toBe(1000);
    expect(chunks[2].length).toBe(900);

    const rebuilt =
      chunks[0] +
      chunks
        .slice(1)
        .map((c) => c.slice(overlap))
        .join("");

    expect(rebuilt).toBe(text);
  });
});
