from __future__ import annotations

import os
from functools import lru_cache

from qa.env import must_env

_NO_ANSWER = "I don't know based on the provided documents."


@lru_cache(maxsize=1)
def _get_client():
    # Importing OpenAI can be relatively heavy; avoid doing it during Lambda init.
    from openai import OpenAI

    return OpenAI(api_key=must_env("OPENAI_API_KEY"))


@lru_cache(maxsize=1)
def _get_embed_model() -> str:
    # Model selection is optional.
    return os.getenv("OPENAI_EMBED_MODEL") or "text-embedding-3-small"


@lru_cache(maxsize=1)
def _get_chat_model() -> str:
    # Model selection is optional.
    return os.getenv("OPENAI_CHAT_MODEL") or "gpt-5-mini"


def embed_text(text: str) -> list[float]:
    client = _get_client()
    res = client.embeddings.create(model=_get_embed_model(), input=text)
    return list(res.data[0].embedding)


def generate_answer(prompt: str) -> str:
    client = _get_client()
    res = client.chat.completions.create(
        model=_get_chat_model(),
        max_completion_tokens=400,
        messages=[
            {"role": "system", "content": "Follow the instructions exactly."},
            {"role": "user", "content": prompt},
        ],
    )

    out = (res.choices[0].message.content or "").strip() if res.choices else ""
    return out if out else _NO_ANSWER
