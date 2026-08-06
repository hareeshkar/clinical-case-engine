import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { McqCard } from "@/components/questions/mcq-card";
import { PdfViewer } from "@/components/documents/pdf-viewer";
import { getOwnedDocument, listQuestions } from "@/lib/db/queries";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth(); const { id } = await params; const document = userId ? await getOwnedDocument(id, userId) : null;
  if (!document || document.status !== "ready") return <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8"><p className="display text-4xl">Study source not found.</p><Link href="/documents" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#16756a]"><ArrowLeft size={15}/>Back to Documents</Link></div>;
  const questions = await listQuestions({ sourceIds: [id] });
  return <div className="mx-auto max-w-7xl px-5 pb-24 pt-8 lg:px-8"><Link href="/documents" className="no-print inline-flex items-center gap-2 text-sm font-semibold text-[#16756a]"><ArrowLeft size={15}/>Documents</Link><header className="mt-6 border-b border-[#d9dfdc] pb-6"><p className="eyebrow">Saved study source</p><h1 className="display mt-3 text-5xl leading-[.95] sm:text-6xl">{document.title}</h1><p className="mt-3 flex items-center gap-2 text-sm text-[#60717a]"><FileText size={15}/>Original PDF: {document.originalFileName} · {questions.length} questions</p></header><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,.8fr)]"><section><p className="eyebrow">Questions from this PDF</p><div className="mt-5">{questions.map((question) => <McqCard key={question.id} question={question}/>)}</div></section><aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"><p className="eyebrow">Source document</p><div className="mt-5 h-[70vh] lg:h-[calc(100%-2.5rem)]"><PdfViewer url={`/api/documents/${document.id}/file`} title={document.title}/></div></aside></div></div>;
}
