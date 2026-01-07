import pytest

from qa.chunk import chunk_text


def test_throws_if_chunk_size_lte_overlap():
    with pytest.raises(ValueError, match="chunkSize must be greater than overlap"):
        chunk_text("hello", 100, 100)
    with pytest.raises(ValueError, match="chunkSize must be greater than overlap"):
        chunk_text("hello", 100, 120)


def test_chunks_with_overlap_and_reconstructs_original_when_deoverlapped():
    text = "a" * 2500
    chunk_size = 1000
    overlap = 200

    chunks = chunk_text(text, chunk_size, overlap)

    assert len(chunks) == 3
    assert len(chunks[0]) == 1000
    assert len(chunks[1]) == 1000
    assert len(chunks[2]) == 900

    rebuilt = chunks[0] + "".join(c[overlap:] for c in chunks[1:])
    assert rebuilt == text
