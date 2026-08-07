import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpecialtyWorkspace } from "@/components/library/specialty-workspace";
import { listAvailableSpecialties, listDocuments, listQuestions } from "@/lib/db/queries";

export default async function SpecialtyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { userId } = await auth(); const [taxonomy, allDocuments, questions] = userId ? await Promise.all([listAvailableSpecialties(userId), listDocuments(userId), listQuestions({ specialty: id })]) : [[], [], []];
  const specialty = taxonomy.find((item) => item.id === id); const documents = allDocuments.filter((document) => document.specialties?.some((item) => item.id === id));
  if (!specialty) return <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8"><p className="display text-4xl">Collection not found.</p><Link href="/library" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#16756a]"><ArrowLeft size={15}/>Back to Library</Link></div>;
  return <div className="mx-auto max-w-7xl px-5 pb-24 pt-8 lg:px-8"><Link href="/library" className="no-print inline-flex items-center gap-2 text-sm font-semibold text-[#16756a]"><ArrowLeft size={15}/>Library</Link><header className="mt-6 border-b border-[#d9dfdc] pb-6"><p className="eyebrow">Specialty collection</p><h1 className="display mt-3 text-5xl sm:text-6xl">{specialty.name}</h1><p className="mt-3 text-[#60717a]">{documents.length} source PDFs · {questions.length} classified questions</p></header><SpecialtyWorkspace documents={documents} questions={questions}/></div>;
}
