import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error("Usage: node convert_env_json.mjs <path-to-env.json>");
  process.exit(2);
}

const inputPath = process.argv[2];
if (!inputPath) usage();

const fullPath = path.resolve(process.cwd(), inputPath);
const raw = fs.readFileSync(fullPath, "utf8");
const parsed = JSON.parse(raw);

// Supported legacy shape:
// { "Parameters": { "OPENAI_API_KEY": "...", "PINECONE_API_KEY": "...", "PINECONE_HOST": "...", "PINECONE_INDEX": "...", ... } }
if (parsed && typeof parsed === "object" && parsed.Parameters && typeof parsed.Parameters === "object") {
  const p = parsed.Parameters;

  const OPENAI_API_KEY = p.OPENAI_API_KEY ?? "";
  const OPENAI_EMBED_MODEL = p.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
  const OPENAI_CHAT_MODEL = p.OPENAI_CHAT_MODEL ?? "gpt-5-mini";
  const PINECONE_API_KEY = p.PINECONE_API_KEY ?? "";
  const PINECONE_HOST = p.PINECONE_HOST ?? "";
  const PINECONE_INDEX = p.PINECONE_INDEX ?? "diverse-programmers";

  const out = {
    AskFunction: {
      OPENAI_API_KEY,
      OPENAI_EMBED_MODEL,
      OPENAI_CHAT_MODEL,
      PINECONE_API_KEY,
      PINECONE_HOST,
      PINECONE_INDEX
    },
    IngestFunction: {
      OPENAI_API_KEY,
      OPENAI_EMBED_MODEL,
      OPENAI_CHAT_MODEL,
      PINECONE_API_KEY,
      PINECONE_HOST,
      PINECONE_INDEX
    },
    AskFunctionPython: {
      OPENAI_API_KEY,
      OPENAI_EMBED_MODEL,
      OPENAI_CHAT_MODEL,
      PINECONE_API_KEY,
      PINECONE_HOST,
      PINECONE_INDEX
    },
    IngestFunctionPython: {
      OPENAI_API_KEY,
      OPENAI_EMBED_MODEL,
      OPENAI_CHAT_MODEL,
      PINECONE_API_KEY,
      PINECONE_HOST,
      PINECONE_INDEX
    }
  };

  fs.writeFileSync(fullPath, JSON.stringify(out, null, 2) + "\n", "utf8");

  // Important: do NOT print values.
  console.log(
    "Converted env.json from {Parameters:{...}} to SAM local --env-vars mapping (AskFunction/IngestFunction/AskFunctionPython/IngestFunctionPython)."
  );
  process.exit(0);
}

// Already-correct shape
if (parsed && typeof parsed === "object" && (parsed.AskFunction || parsed.IngestFunction)) {
  console.log("env.json already looks like SAM local --env-vars mapping. No changes made.");
  process.exit(0);
}

console.error("env.json is not a recognized format. Expected either {Parameters:{...}} or {AskFunction:{...}, IngestFunction:{...}}.");
process.exit(1);
