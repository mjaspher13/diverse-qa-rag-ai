import { Pinecone } from "@pinecone-database/pinecone";
import { mustEnv } from "./env";

const pc = new Pinecone({ apiKey: mustEnv("PINECONE_API_KEY") });

const index = pc.index(
    mustEnv("PINECONE_INDEX"),
    mustEnv("PINECONE_HOST")
);

export type UpsertVector = {
    id: string;
    values: number[];
    metadata: { docId: string; title: string; chunkText: string; chunkIndex: number };
};

export async function upsertVectors(vectors: UpsertVector[]) {
    if (!vectors.length) return;
    await index.upsert(vectors);
}

export async function queryVectors(vector: number[], topK: number) {
    const res = await index.query({
        vector,
        topK,
        includeMetadata: true
    });

    return res.matches ?? [];
}
