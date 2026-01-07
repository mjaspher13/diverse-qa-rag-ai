from __future__ import annotations

from pinecone import Pinecone

from qa.env import must_env

_pc = Pinecone(api_key=must_env("PINECONE_API_KEY"))

_PINECONE_INDEX = must_env("PINECONE_INDEX")
_PINECONE_HOST = must_env("PINECONE_HOST")

_index = _pc.Index(host=_PINECONE_HOST)


def upsert_vectors(vectors: list[dict]) -> None:
    if not vectors:
        return
    _index.upsert(vectors=vectors)


def query_vectors(vector: list[float], top_k: int) -> list[dict]:
    res = _index.query(vector=vector, top_k=top_k, include_metadata=True)
    matches = getattr(res, "matches", None)
    if matches is None:
        return []

    out: list[dict] = []
    for m in matches:
        out.append(
            {
                "id": getattr(m, "id", ""),
                "score": getattr(m, "score", None),
                "metadata": getattr(m, "metadata", None) or {},
            }
        )

    return out
