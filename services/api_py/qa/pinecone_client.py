from __future__ import annotations

from functools import lru_cache

from qa.env import must_env


@lru_cache(maxsize=1)
def _get_index():
    # Importing Pinecone can be relatively heavy; avoid doing it during Lambda init.
    from pinecone import Pinecone

    pc = Pinecone(api_key=must_env("PINECONE_API_KEY"))
    must_env("PINECONE_INDEX")
    host = must_env("PINECONE_HOST")
    return pc.Index(host=host)


def upsert_vectors(vectors: list[dict]) -> None:
    if not vectors:
        return
    _get_index().upsert(vectors=vectors)


def query_vectors(vector: list[float], top_k: int) -> list[dict]:
    res = _get_index().query(vector=vector, top_k=top_k, include_metadata=True)
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
