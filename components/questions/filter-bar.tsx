"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { specialties } from "@/lib/domain/specialties";

const options = { specialty: specialties.map((item) => [item.id, item.name]), focus: [["diagnostic", "Diagnostic"], ["surgical_complication", "Surgical complication"], ["physio_management", "Physio management"]], difficulty: [["undergrad", "Undergraduate"], ["postgrad", "Postgraduate"], ["licensing", "Licensing"]], documentId: [["core", "Core library"]] } as const;

export function FilterBar() {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  function change(key: string, value: string) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); router.replace(`${pathname}?${next.toString()}`); }
  return <div className="no-print flex flex-wrap items-center gap-2 border-y border-[#d9dfdc] py-4"><span className="mr-1 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={15}/>Filter</span>{Object.entries(options).map(([key, items]) => <select key={key} value={params.get(key) ?? ""} onChange={(event) => change(key, event.target.value)} className="rounded-full border border-[#c9d3cf] bg-white px-3 py-2 text-sm capitalize outline-none focus:border-[#2a9d8f]"><option value="">All {key === "documentId" ? "sources" : `${key}s`}</option>{items.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>)}</div>;
}
