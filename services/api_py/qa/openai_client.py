from __future__ import annotations

from openai import OpenAI

from qa.env import must_env

_client = OpenAI(api_key=must_env("OPENAI_API_KEY"))

_EMBED_MODEL = must_env("OPENAI_EMBED_MODEL") if __import__("os").getenv("OPENAI_EMBED_MODEL") else "text-embedding-3-small"
_CHAT_MODEL = must_env("OPENAI_CHAT_MODEL") if __import__("os").getenv("OPENAI_CHAT_MODEL") else "gpt-5-mini"

_NO_ANSWER = "I don't know based on the provided documents."


def embed_text(text: str) -> list[float]:
    res = _client.embeddings.create(model=_EMBED_MODEL, input=text)
    return list(res.data[0].embedding)


def generate_answer(prompt: str) -> str:
    res = _client.chat.completions.create(
        model=_CHAT_MODEL,
        max_completion_tokens=400,
        messages=[
            {"role": "system", "content": "Follow the instructions exactly."},
            {"role": "user", "content": prompt},
        ],
    )

    out = (res.choices[0].message.content or "").strip() if res.choices else ""
    return out if out else _NO_ANSWER
