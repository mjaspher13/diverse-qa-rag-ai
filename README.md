# Q&A Portal

Small Doc Q&A app:

- **Ingest** short plain-text documents
- **Ask** questions that are answered using only the ingested content

Under the hood it uses **OpenAI embeddings + Pinecone** for retrieval, and **OpenAI chat** for the final answer (RAG).

## Repo structure

- `services/api` – Node.js (TypeScript) Lambda handlers for `/ingest` and `/ask`
- `infra` – AWS SAM template (local run + deploy)
- `apps/web` – Next.js UI
  - `/docs` to ingest documents
  - `/ask` to ask questions and view sources

## Requirements

- Node.js 20+
- Docker (required for `sam local`)
- AWS SAM CLI
- OpenAI API key
- Pinecone API key + index (1536 dims for `text-embedding-3-small`)

## What this project does (RAG flow)

This project implements a Retrieval-Augmented Generation (RAG) flow without using LangChain or LlamaIndex. The steps are:

1. **chunk** document content
2. **embed** each chunk
3. **store** embeddings in Pinecone (upsert)
4. **embed** the user question
5. **query** Pinecone for top matches
6. **build** a prompt from the matched chunks + question
7. **call** the LLM
8. return **answer + sources**

## Environment variables

### API

There are two API implementations in this repo:

- **Node.js (TypeScript)**: `infra/template.yaml`
- **Python (Flask)**: `infra/template-python.yaml`

For **local** runs with `sam local`, we pass Lambda environment variables via `--env-vars infra/env.json`.

For **AWS deploy**, secrets are provided as **SAM/CloudFormation Parameters** (e.g. via `sam deploy --guided`).

### Web

Create `apps/web/.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` (required)

Examples:

- Local: `http://127.0.0.1:3000`
- Deployed: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev`

Note: this SAM template uses **StageName = `dev`**, so the base URL must include `/dev` when pointing at a deployed API.

## Local setup

### 1) Configure API secrets for SAM local

Copy `infra/env.json.example` to `infra/env.json` and fill in real values.

Important: `sam local --env-vars` expects a mapping of **Function logical IDs** to environment variables. This repo’s example file already includes both Node and Python function IDs.

### 2) Start the API (SAM)

```bash
cd infra

# Run the Node.js API
sam build -t template.yaml --build-dir .aws-sam-node
# Use the built template so the esbuild output (ask.js/ingest.js) is available
sam local start-api -t .aws-sam-node/template.yaml --port 3000 --env-vars env.json

# OR run the Python API
# Note: the Python template targets the Lambda runtime `python3.11`.
# If you don't have Python 3.11 installed locally (common on Windows), build in Docker:
sam build -t template-python.yaml --use-container --build-dir .aws-sam-py
# If you *do* have Python 3.11 on your PATH, you can also build without Docker:
# sam build -t template-python.yaml --build-dir .aws-sam-py
sam local start-api -t .aws-sam-py/template.yaml --port 3002 --env-vars env.json

# Tip (especially on Windows + Docker): Python containers can have slower cold-starts.
# If your first request times out, either increase your client timeout or warm containers:
# sam local start-api ... --warm-containers EAGER
```

Tip: if you want to run both at the same time, use different ports (e.g. Node on 3000, Python on 3002).

### 3) Configure and start the web app

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
```

Then run:

```bash
cd apps/web
npm install
npm run dev -- -p 3001
```

Open:

- http://localhost:3001/docs
- http://localhost:3001/ask

## Sample docs

You can paste these into `/docs` and click Ingest:

```json
{
  "documents": [
    {
      "id": "shipping-policy",
      "title": "Shipping Policy",
      "content": "We process orders within 1–2 business days. Domestic shipping usually takes 2–5 business days. International shipping typically takes 7–14 days. Tracking is provided when available. Shipping times can be longer during holidays or customs inspection."
    },
    {
      "id": "returns-policy",
      "title": "Returns Policy",
      "content": "Physical items can be returned within 30 days of delivery if they are unused and in original packaging. To start a return, contact support with your order number. Return shipping costs are paid by the customer unless the item arrived damaged or incorrect."
    },
    {
      "id": "refunds-policy",
      "title": "Refund Policy",
      "content": "Digital goods are not refundable once delivered. For approved physical item returns, refunds are issued to the original payment method within 5–10 business days after we receive and inspect the item. Shipping fees are not refundable."
    },
    {
      "id": "privacy-policy",
      "title": "Privacy Policy",
      "content": "We collect basic account and order information to provide service, process payments, and send order updates. We do not sell personal data. We may share information with payment providers and shipping carriers only to complete transactions. You can request deletion of your account data by contacting support."
    },
    {
      "id": "support-faq",
      "title": "Support FAQ",
      "content": "Support hours are Monday to Friday, 9:00 AM to 5:00 PM (local time). We usually respond within 24–48 hours. For faster help, include your order number, the email used at checkout, and a clear description of the issue."
    }
  ]
}
```

## API usage (curl)

### Ingest (local)

```bash
curl -X POST "http://127.0.0.1:3000/ingest" \
  -H "content-type: application/json" \
  -d "{\"documents\":[{\"id\":\"shipping\",\"title\":\"Shipping Policy\",\"content\":\"International shipping takes 7-14 days.\"}]}"
```

### Ask (local)

```bash
curl -X POST "http://127.0.0.1:3000/ask" \
  -H "content-type: application/json" \
  -d "{\"question\":\"How long is international shipping?\",\"topK\":3}"
```

## Chunking strategy

`chunkText(text, chunkSize=1000, overlap=200)` uses a sliding window with overlap. This helps retrieval because a sentence near the boundary can appear in multiple chunks.

## Tests

Unit tests are included for chunking and prompt building.

Run:

```bash
cd services/api
npm test
```

## Notes

- Answers are generated using only retrieved chunks.
- If the answer is not found, the API returns: `I don't know based on the provided documents.`
- No auth was added (per requirements). API endpoints are public.

## Deploy (AWS)

From `infra/`:

```bash
sam build
sam deploy --guided --region us-east-1
```

After deploy, SAM prints `ApiBaseUrl` (includes `/dev` stage). Set the web base URL:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev
```

Restart Next.js:

```bash
cd apps/web
npm run dev -- -p 3001
```

## Assumptions and trade-offs

- Pinecone index already exists and matches embedding dimensions (1536 for text-embedding-3-small).
- Ingest runs synchronously inside `POST /ingest` to keep the app small and simple.
- Basic CORS is enabled to allow the Next.js UI to call the API.

## Nice-to-have not implemented (what I would do next)

If I had more time, I would add:

- **Async ingest** (S3 + SQS + worker Lambda) to avoid long request times for big documents.
- **Better chunking** by sentence/paragraph boundaries instead of fixed characters.
- **UI polish**: better validation, loading states, and clearer error messages.
- **Extra tests**: an end-to-end test that ingests docs, then asks a question and verifies answer/sources.