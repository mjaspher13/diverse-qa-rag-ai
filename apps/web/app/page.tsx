export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Doc Q&A Portal</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use these pages to ingest documents and ask questions against them.
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="/docs"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Go to Docs
            </a>
            <a
              href="/ask"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900"
            >
              Go to Ask
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
