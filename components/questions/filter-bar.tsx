"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { specialties } from "@/lib/domain/specialties";
import type { DocumentRecord } from "@/lib/domain/types";

const selectOptions = {
  specialty: specialties.map((item) => [item.id, item.name]),
  focus: [["diagnostic", "Diagnostic"], ["surgical_complication", "Surgical complication"], ["physio_management", "Physio management"]],
  difficulty: [["undergrad", "Undergraduate"], ["postgrad", "Postgraduate"], ["licensing", "Licensing"]],
  timing: [["early", "Early post-op"], ["late", "Late post-op"], ["none", "No timing tag"]],
  sort: [["newest", "Newest first"], ["oldest", "Oldest first"]],
} as const;

export function FilterBar({ documents }: { documents: DocumentRecord[] }) {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const sources = new Set((params.get("source") ?? "").split(",").filter(Boolean));
  function update(next: URLSearchParams) { router.replace(`${pathname}?${next.toString()}`); }
  function change(key: string, value: string) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); update(next); }
  function toggleSource(id: string) { const next = new URLSearchParams(params); const selected = new Set(sources); if (selected.has(id)) selected.delete(id); else selected.add(id); if (selected.size) next.set("source", [...selected].join(",")); else next.delete("source"); update(next); }
  const sourceLabel = sources.size ? `${sources.size} source${sources.size === 1 ? "" : "s"}` : "All sources";
  return <div className="no-print flex flex-wrap items-center gap-2 border-y border-[#d9dfdc] py-4"><span className="mr-1 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={15}/>Filter</span>{(["specialty", "focus", "difficulty", "timing", "sort"] as const).map((key) => <select key={key} value={params.get(key) ?? (key === "sort" ? "newest" : "")} onChange={(event) => change(key, event.target.value)} className="rounded-full border border-[#c9d3cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a9d8f]"><option value="">All {key === "timing" ? "timings" : `${key}s`}</option>{selectOptions[key].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>)}<details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#c9d3cf] bg-white px-3 py-2 text-sm font-semibold marker:content-none">{sourceLabel}<ChevronDown size={14}/></summary><div className="absolute right-0 z-10 mt-2 w-72 border border-[#c9d3cf] bg-white p-2 shadow-lg"><p className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#60717a]">Question source</p><label className="flex cursor-pointer items-center gap-3 rounded p-2 text-sm hover:bg-[#edf5f2]"><input type="checkbox" checked={sources.has("core")} onChange={() => toggleSource("core")} /><span className="grid size-5 place-items-center rounded bg-[#0b1f2a] text-xs font-bold text-white">A</span>Core library</label>{documents.map((document) => <label key={document.id} className="flex cursor-pointer items-center gap-3 rounded p-2 text-sm hover:bg-[#edf5f2]"><input type="checkbox" checked={sources.has(document.id)} onChange={() => toggleSource(document.id)} /><span className="grid size-5 place-items-center rounded bg-[#e8f5f2] text-[#16756a]">{sources.has(document.id) ? <Check size={13}/> : null}</span><span className="min-w-0"><span className="block truncate">{document.title}</span><span className="block text-xs text-[#60717a]">{document.questionCount ?? 0} questions</span></span></label>)}</div></details></div>;
}
