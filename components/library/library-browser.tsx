"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronRight, FolderTree, X } from "lucide-react";
import type { DocumentRecord, Specialty } from "@/lib/domain/types";

export function LibraryBrowser({ taxonomy, documents }: { taxonomy: Specialty[]; documents: DocumentRecord[] }) {
  const router = useRouter();
  const [parent, setParent] = useState<Specialty | null>(null);
  const roots = taxonomy.filter((specialty) => !specialty.parentId);
  const childrenOf = (id: string) => taxonomy.filter((specialty) => specialty.parentId === id);
  const descendantIds = (id: string): string[] => [id, ...childrenOf(id).flatMap((child) => descendantIds(child.id))];
  const documentCount = (id: string) => documents.filter((document) => document.specialties?.some((specialty) => descendantIds(id).includes(specialty.id))).length;
  const questionCount = (id: string) => documents.filter((document) => document.specialties?.some((specialty) => descendantIds(id).includes(specialty.id))).reduce((total, document) => total + (document.questionCount ?? 0), 0);
  function enter(specialty: Specialty) { if (childrenOf(specialty.id).length) setParent(specialty); else router.push(`/library/${specialty.id}`); }
  return <><section className="mt-12 grid gap-px bg-[#d9dfdc] sm:grid-cols-2 lg:grid-cols-3">{roots.map((specialty) => <button key={specialty.id} onClick={() => enter(specialty)} className="group min-h-52 bg-[#f7f5ef] p-6 text-left transition hover:bg-white"><span className="block size-3 rounded-full" style={{ backgroundColor: specialty.color }}/><h2 className="display mt-10 text-3xl group-hover:underline">{specialty.name}</h2><p className="mt-2 text-sm leading-6 text-[#60717a]">{childrenOf(specialty.id).length ? `${childrenOf(specialty.id).length} collections` : `${documentCount(specialty.id)} PDFs · ${questionCount(specialty.id)} questions`}</p><span className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#16756a]">Open collection <ArrowRight size={15}/></span></button>)}</section>{parent && <div className="fixed inset-0 z-30 flex items-end bg-[#0b1f2a]/45 p-0 sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true" aria-label={`${parent.name} collections`}><section className="w-full bg-[#f7f5ef] p-6 shadow-2xl sm:max-w-xl sm:rounded-sm"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Specialty collections</p><h2 className="display mt-2 text-4xl">{parent.name}</h2><p className="mt-2 text-sm text-[#60717a]">Choose a focused collection to open its sources and questions.</p></div><button onClick={() => setParent(null)} className="grid size-11 place-items-center rounded-full hover:bg-[#e8f5f2]" aria-label="Close specialty picker"><X size={19}/></button></div><div className="mt-6 divide-y divide-[#d9dfdc] border-y border-[#d9dfdc]">{childrenOf(parent.id).map((child) => <button key={child.id} onClick={() => enter(child)} className="flex w-full items-center justify-between gap-4 py-4 text-left hover:text-[#16756a]"><span><span className="block font-semibold">{child.name}</span><span className="mt-1 block text-sm text-[#60717a]">{documentCount(child.id)} PDFs · {questionCount(child.id)} questions</span></span><ChevronRight size={19}/></button>)}</div><p className="mt-5 flex items-center gap-2 text-xs text-[#60717a]"><FolderTree size={15}/>Collections are built from confirmed specialty classifications.</p></section></div>}</>;
}
