import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doc Q&A Portal",
  description: "Upload docs and ask questions using RAG (OpenAI + Pinecone)."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
