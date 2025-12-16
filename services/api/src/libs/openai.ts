import OpenAI from "openai";
import { mustEnv } from "./env";

const openai = new OpenAI({ apiKey: mustEnv("OPENAI_API_KEY") });

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5-mini";

export async function embedText(text: string): Promise<number[]> {
    const res = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: text
    });

    return res.data[0].embedding;
}

export async function generateAnswer(prompt: string): Promise<string> {
    const res = await openai.chat.completions.create({
        model: CHAT_MODEL,
        max_completion_tokens: 400,
        messages: [
            { role: "system", content: "Follow the instructions exactly." },
            { role: "user", content: prompt }
        ]
    });

    const out = res.choices[0]?.message?.content?.trim();
    return out && out.length > 0 ? out : "I don't know based on the provided documents.";
}
