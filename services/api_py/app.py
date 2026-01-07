from __future__ import annotations

from flask import Flask, jsonify, request

from qa.chunk import chunk_text
from qa.openai_client import embed_text, generate_answer
from qa.pinecone_client import query_vectors, upsert_vectors
from qa.prompt import build_prompt

NO_ANSWER = "I don't know based on the provided documents."


def create_app() -> Flask:
    app = Flask(__name__)

    @app.after_request
    def add_cors_headers(resp):
        resp.headers["content-type"] = "application/json"
        resp.headers["access-control-allow-origin"] = "*"
        resp.headers["access-control-allow-methods"] = "OPTIONS,POST,GET"
        resp.headers["access-control-allow-headers"] = "content-type"
        return resp

    @app.route("/ingest", methods=["POST", "OPTIONS"])
    def ingest():
        if request.method == "OPTIONS":
            return ("", 204)

        body = request.get_json(silent=True)
        if body is None:
            return jsonify({"error": "Missing request body"}), 400

        docs_raw = body.get("documents")
        if not isinstance(docs_raw, list) or len(docs_raw) == 0:
            return jsonify({"error": "documents is required"}), 400

        ingested_documents = 0
        ingested_chunks = 0

        for doc in docs_raw:
            if not isinstance(doc, dict):
                continue

            doc_id = str(doc.get("id", "")).strip()
            title = str(doc.get("title", "")).strip()
            content = str(doc.get("content", "")).strip()

            if not doc_id or not title or not content:
                continue

            chunks = chunk_text(content)
            if len(chunks) == 0:
                continue

            vectors = []
            for i, chunk in enumerate(chunks):
                values = embed_text(chunk)
                vectors.append(
                    {
                        "id": f"{doc_id}#chunk-{i + 1}",
                        "values": values,
                        "metadata": {
                            "docId": doc_id,
                            "title": title,
                            "chunkText": chunk,
                            "chunkIndex": i + 1,
                        },
                    }
                )

            upsert_vectors(vectors)
            ingested_documents += 1
            ingested_chunks += len(chunks)

        return jsonify({"ingestedDocuments": ingested_documents, "ingestedChunks": ingested_chunks}), 200

    @app.route("/ask", methods=["POST", "OPTIONS"])
    def ask():
        if request.method == "OPTIONS":
            return ("", 204)

        body = request.get_json(silent=True)
        if body is None:
            return jsonify({"error": "Missing request body"}), 400

        question = str(body.get("question", "")).strip()
        if not question:
            return jsonify({"error": "Question is required"}), 400

        try:
            top_k_raw = body.get("topK", 3)
            top_k = int(top_k_raw)
        except Exception:
            top_k = 3
        top_k = max(1, min(top_k, 10))

        q_vec = embed_text(question)
        matches = query_vectors(q_vec, top_k)

        chunks = []
        for m in matches:
            md = (m or {}).get("metadata") or {}
            chunk_text_val = md.get("chunkText")
            if isinstance(chunk_text_val, str) and chunk_text_val.strip():
                chunks.append(chunk_text_val.strip())

        if len(chunks) == 0:
            return jsonify({"answer": NO_ANSWER, "sources": []}), 200

        prompt = build_prompt(question, chunks)
        answer = generate_answer(prompt)

        seen = set()
        sources = []
        for m in matches:
            md = (m or {}).get("metadata") or {}
            doc_id = str(md.get("docId", "")).strip()
            title = str(md.get("title", "")).strip()
            if not doc_id or not title:
                continue
            if doc_id in seen:
                continue
            seen.add(doc_id)
            sources.append({"docId": doc_id, "title": title})

        return jsonify({"answer": answer, "sources": sources}), 200

    return app


app = create_app()
