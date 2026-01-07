from __future__ import annotations


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    if chunk_size <= overlap:
        raise ValueError("chunkSize must be greater than overlap")

    chunks: list[str] = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        part = text[start:end].strip()
        if part:
            chunks.append(part)

        if end == len(text):
            break
        start = end - overlap

    return chunks
