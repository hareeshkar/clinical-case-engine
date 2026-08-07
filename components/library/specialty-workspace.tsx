"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { PdfViewer } from "@/components/documents/pdf-viewer";
import { McqCard } from "@/components/questions/mcq-card";
import type { DocumentRecord, Question } from "@/lib/domain/types";

export function SpecialtyWorkspace({ documents, questions }: { documents: DocumentRecord[]; questions: Question[] }) {
  const [selectedId, setSelectedId] = useState(documents[0]?.id);
  const selected = documents.find((document) => document.id === selectedId);
  const groups = useRef(new Map<string, HTMLElement>());
  function selectSource(id: string) { setSelectedId(id); requestAnimationFrame(() => groups.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" })); }
  if (!selected) return <p className="border border-dashed border-[#b9c8c3] p-10 text-center text-[#60717a]">No saved PDFs have been classified into this collection yet.</p>;
  return <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,.8fr)]"><section><p className="eyebrow">Questions by source PDF</p><div className="mt-5">{documents.map((document) => { const sourceQuestions = questions.filter((question) => question.documentId === document.id); return <section key={document.id} ref={(element) => { if (element) groups.current.set(document.id, element); }} className="scroll-mt-24 border-t-2 border-[#0b1f2a] pt-5 first:border-t-0 first:pt-0"><p className="flex items-center gap-2 text-sm font-semibold"><FileText size={15} className="text-[#16756a]"/>{document.title}</p><p className="mt-1 text-xs text-[#60717a]">{sourceQuestions.length} questions · Original: {document.originalFileName}</p>{sourceQuestions.map((question) => <McqCard key={question.id} question={question}/>)}</section>; })}</div></section><aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"><p className="eyebrow">Source document</p><div className="no-print mt-3 flex gap-2 overflow-x-auto pb-2">{documents.map((document) => <button key={document.id} onClick={() => selectSource(document.id)} className={selectedId === document.id ? "primary-action shrink-0 rounded-full px-3 py-2 text-sm font-semibold" : "shrink-0 rounded-full border border-[#c9d3cf] bg-white px-3 py-2 text-sm font-semibold"}>{document.title}</button>)}</div><div className="mt-3 h-[70vh] lg:h-[calc(100%-5.5rem)]"><PdfViewer url={`/api/documents/${selected.id}/file`} title={selected.title}/></div></aside></div>;
}
