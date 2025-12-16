export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    if (chunkSize <= overlap) throw new Error("chunkSize must be greater than overlap");

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const part = text.slice(start, end).trim();
        if (part) chunks.push(part);

        if (end === text.length) break;
        start = end - overlap;
    }

    return chunks;
}
