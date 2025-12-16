import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, parseJson } from "../libs/http";
import { queryVectors } from "../libs/pinecone";
import { buildPrompt } from "../libs/prompt";
import { embedText, generateAnswer } from "../libs/openai";
import type { AskRequest, AskResponse, QueryMatch } from "../libs/types";

const NO_ANSWER = "I don't know based on the provided documents.";

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = parseJson<AskRequest>(event.body);

    const question = (body.question ?? "").trim();
    if (!question) return json(400, { error: "Question is required" });

    const topK = Math.max(1, Math.min(body.topK ?? 3, 10));

    const qVec = await embedText(question);
    const matches: QueryMatch[] = await queryVectors(qVec, topK);

    const chunks = matches
      .map((m) => (isNonEmptyString(m.metadata?.chunkText) ? m.metadata.chunkText.trim() : ""))
      .filter(Boolean);

    // No context => do not call the LLM
    if (chunks.length === 0) {
      const resp: AskResponse = { answer: NO_ANSWER, sources: [] };
      return json(200, resp);
    }

    const prompt = buildPrompt(question, chunks);
    const answer = await generateAnswer(prompt);

    const seen = new Set<string>();
    const sources = matches
      .map((m) => ({
        docId: String(m.metadata?.docId ?? "").trim(),
        title: String(m.metadata?.title ?? "").trim()
      }))
      .filter((s) => s.docId && s.title)
      .filter((s) => (seen.has(s.docId) ? false : (seen.add(s.docId), true)));

    const resp: AskResponse = { answer, sources };
    return json(200, resp);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bad Request";
    return json(400, { error: msg });
  }
};
