"use client";

import { useState } from "react";
import { Check, ChevronDown, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/domain/types";

const labels = ["A", "B", "C", "D"];

export function McqCard({ question, compact = false }: { question: Question; compact?: boolean }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const reviewed = choice !== null;
  return <article className="border-b border-[#d9dfdc] py-7 first:pt-0"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold"><span className="rounded-full bg-[#e8f5f2] px-2.5 py-1 text-[#16756a]">{question.specialty.replaceAll("_", " ")}</span><span className="rounded-full bg-[#edece7] px-2.5 py-1 text-[#60717a]">{question.focus.replaceAll("_", " ")}</span><span className="text-[#8a9999]">{question.difficulty}</span></div><h2 className={cn("display mt-4 font-semibold leading-tight", compact ? "text-2xl" : "text-3xl")}>{question.stem}</h2><div className="mt-5 grid gap-2">{question.options.map((option, index) => <button key={option} onClick={() => { setChoice(index); setShowRationale(true); }} className={cn("flex items-start gap-3 border p-3 text-left text-sm transition", reviewed && index === question.correctIndex ? "border-[#2a9d8f] bg-[#e8f5f2]" : reviewed && index === choice ? "border-[#d57a66] bg-[#fff1ed]" : "border-[#d9dfdc] bg-white hover:border-[#7daaa2]")}><span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">{reviewed && index === question.correctIndex ? <Check size={14}/> : labels[index]}</span><span className="pt-0.5">{option}</span></button>)}</div><button onClick={() => setShowRationale(!showRationale)} className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#16756a]">{showRationale ? "Hide teaching note" : "Reveal teaching note"}<ChevronDown size={15} className={cn("transition", showRationale && "rotate-180")}/></button>{showRationale && <div className="fade-up mt-3 border-l-2 border-[#2a9d8f] bg-[#edf5f2] p-4 text-sm leading-6 text-[#31544f]"><p>{question.rationale}</p><p className="mt-3 flex gap-2 text-xs italic text-[#60717a]"><Quote size={14} className="shrink-0"/>{question.sourceCitation}</p></div>}</article>;
}
