"use client";

import { useState } from "react";
import { McqCard } from "@/components/questions/mcq-card";
import type { Question, Specialty } from "@/lib/domain/types";

export function DocumentQuestionGroups({ questions, specialties }: { questions: Question[]; specialties: Specialty[] }) {
  const [selected, setSelected] = useState("all");
  const questionGroups = [...new Set(questions.map((question) => question.specialty))];
  const nameFor = (id: string) => specialties.find((specialty) => specialty.id === id)?.name ?? id.replaceAll("_", " ");
  const visibleGroups = selected === "all" ? questionGroups : [selected];
  return <><div className="no-print mt-4 flex gap-2 overflow-x-auto pb-2"><button onClick={() => setSelected("all")} className={selected === "all" ? "primary-action shrink-0 rounded-full px-3 py-2 text-sm font-semibold" : "shrink-0 rounded-full border border-[#c9d3cf] bg-white px-3 py-2 text-sm font-semibold"}>All questions</button>{questionGroups.map((id) => <button key={id} onClick={() => setSelected(id)} className={selected === id ? "primary-action shrink-0 rounded-full px-3 py-2 text-sm font-semibold" : "shrink-0 rounded-full border border-[#c9d3cf] bg-white px-3 py-2 text-sm font-semibold"}>{nameFor(id)}</button>)}</div><div className="mt-3">{visibleGroups.map((id) => <section key={id} className="border-t-2 border-[#0b1f2a] pt-5 first:border-t-0 first:pt-0"><p className="eyebrow">{nameFor(id)}</p>{questions.filter((question) => question.specialty === id).map((question) => <McqCard key={question.id} question={{ ...question, specialty: nameFor(question.specialty) }}/>)}</section>)}</div></>;
}
