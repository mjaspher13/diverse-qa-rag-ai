import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, parseJson } from "../libs/http";
import { upsertVectors } from "../libs/pinecone";
import { chunkText } from "../libs/chunk";
import { embedText } from "../libs/openai";
import type { IngestRequest, IngestResponse, IngestDoc } from "../libs/types";

function isValidDoc(d: unknown): d is IngestDoc {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    o.id.trim().length > 0 &&
    o.title.trim().length > 0 &&
    o.content.trim().length > 0
  );
}

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = parseJson<IngestRequest>(event.body);

    const docsRaw = body.documents;
    if (!Array.isArray(docsRaw) || docsRaw.length === 0) {
      return json(400, { error: "documents is required" });
    }

    let ingestedDocuments = 0;
    let ingestedChunks = 0;

    for (const doc of docsRaw) {
      if (!isValidDoc(doc)) continue;

      const docId = doc.id.trim();
      const title = doc.title.trim();
      const content = doc.content.trim();

      const chunks = chunkText(content);
      if (chunks.length === 0) continue;

      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const values = await embedText(chunk);

        vectors.push({
          id: `${docId}#chunk-${i + 1}`,
          values,
          metadata: {
            docId,
            title,
            chunkText: chunk,
            chunkIndex: i + 1
          }
        });
      }

      await upsertVectors(vectors);

      ingestedDocuments += 1;
      ingestedChunks += chunks.length;
    }

    const resp: IngestResponse = { ingestedDocuments, ingestedChunks };
    return json(200, resp);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bad Request";
    return json(400, { error: msg });
  }
};
