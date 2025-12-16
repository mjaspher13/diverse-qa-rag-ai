"use client";

import { useMemo, useState } from "react";

type IngestDoc = { id: string; title: string; content: string };
type IngestBody = { documents: IngestDoc[] };

function isIngestBody(x: unknown): x is IngestBody {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (!Array.isArray(o.documents)) return false;

  return o.documents.every((d) => {
    if (!d || typeof d !== "object") return false;
    const dd = d as Record<string, unknown>;
    return (
      typeof dd.id === "string" &&
      typeof dd.title === "string" &&
      typeof dd.content === "string"
    );
  });
}

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

export default function DocsPage() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000",
    []
  );

  const [raw, setRaw] = useState(
    JSON.stringify(
      {
        documents: [
          {
            id: "refund",
            title: "Refund Policy",
            content: "No refunds on digital goods. Physical items can be returned within 30 days."
          },
          {
            id: "shipping",
            title: "Shipping Policy",
            content: "We ship in 1-2 business days. International shipping takes 7-14 days."
          }
        ]
      },
      null,
      2
    )
  );

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function onIngest() {
    setBusy(true);
    setStatus("");

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isIngestBody(parsed)) {
        throw new Error('Invalid JSON. Expected: { "documents": [{ "id","title","content" }] }');
      }

      const res = await fetch(`${apiBase}/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Ingest failed";
        throw new Error(msg);
      }

      const out = data as { ingestedDocuments?: number; ingestedChunks?: number };
      setStatus(
        `Success. Documents: ${out.ingestedDocuments ?? "?"}, Chunks: ${out.ingestedChunks ?? "?"}`
      );
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
            <h1 className="text-2xl font-semibold">Docs Ingest</h1>
            <a className="text-sm text-blue-600 hover:underline" href="/ask">
              Go to Ask
            </a>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Paste JSON like{" "}
            <code className="rounded bg-slate-100 px-1">
              {"{ documents: [{ id, title, content }] }"}
            </code>
            .
          </p>

          <textarea
            className="mt-4 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-slate-300"
            rows={18}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onIngest}
              disabled={busy}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Ingesting..." : "Ingest"}
            </button>

            {status && <span className="text-sm">{status}</span>}
          </div>
        </div>
      </div>
    </main>
  );
}
