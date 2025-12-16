const CORS_HEADERS = {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "OPTIONS,POST,GET",
    "access-control-allow-headers": "content-type"
};

export function json(statusCode: number, body: unknown) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body)
    };
}

export function parseJson<T>(raw: string | null | undefined): T {
    if (!raw) throw new Error("Missing request body");
    return JSON.parse(raw) as T;
}
