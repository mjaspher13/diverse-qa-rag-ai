export type IngestDoc = {
    id: string;
    title: string;
    content: string;
};

export type IngestRequest = {
    documents: IngestDoc[];
};

export type IngestResponse = {
    ingestedDocuments: number;
    ingestedChunks: number;
};

export type Source = {
    docId: string;
    title: string;
};

export type AskRequest = {
    question: string;
    topK?: number;
};

export type AskResponse = {
    answer: string;
    sources: Source[];
};


export type MatchMetadata = {
    docId?: string;
    title?: string;
    chunkText?: string;
    chunkIndex?: number;
};

export type QueryMatch = {
    id: string;
    score?: number;
    metadata?: MatchMetadata;
};
