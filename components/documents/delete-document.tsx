"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteDocument({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  async function remove() {
    if (!window.confirm(`Delete “${title}” and its generated questions? This also removes the saved PDF.`)) return;
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  }
  return <button onClick={remove} className="no-print rounded-full border border-[#e3c2ba] p-2 text-[#b3503e] transition hover:bg-[#fff1ed]" aria-label={`Delete ${title}`}><Trash2 size={16}/></button>;
}
