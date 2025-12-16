"use client";

import { useMemo, useState } from "react";

type Source = { docId: string; title: string };
type AskResponse = { answer: string; sources: Source[] };

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

function isAskResponse(x: unknown): x is AskResponse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.answer !== "string") return false;
  if (!Array.isArray(o.sources)) return false;

  return o.sources.every((s) => {
    if (!s || typeof s !== "object") return false;
    const so = s as Record<string, unknown>;
    return typeof so.docId === "string" && typeof so.title === "string";
  });
}

export default function AskPage() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000",
    []
  );

  const [question, setQuestion] = useState("How long is international shipping?");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);

  async function onAsk() {
    setBusy(true);
    setStatus("");
    setAnswer("");
    setSources([]);

    try {
      const res = await fetch(`${apiBase}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, topK: 3 })
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Ask failed";
        throw new Error(msg);
      }

      if (!isAskResponse(data)) {
        throw new Error("Unexpected response shape from /ask");
      }

      setAnswer(data.answer);
      setSources(data.sources);
    } catch (e: unknown) {
      setStatus(`Error: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Ask</h1>
            <a className="text-sm text-blue-600 hover:underline" href="/docs">
              Back to Docs
            </a>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
            />
            <button
              onClick={onAsk}
              disabled={busy}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Asking..." : "Ask"}
            </button>
          </div>

          {status && <p className="mt-3 text-sm">{status}</p>}

          {answer && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Answer</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{answer}</p>

              <h3 className="mt-5 text-sm font-semibold">Sources</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {sources.map((s, i) => (
                  <li key={`${s.docId}-${i}`}>
                    {s.title} <span className="text-xs text-slate-500">({s.docId})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
