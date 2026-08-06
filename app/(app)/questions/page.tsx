import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Play } from "lucide-react";
import { ExportActions } from "@/components/questions/export-actions";
import { FilterBar } from "@/components/questions/filter-bar";
import { McqCard } from "@/components/questions/mcq-card";
import { listDocuments, listQuestions } from "@/lib/db/queries";
import type { Difficulty, Focus } from "@/lib/domain/types";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams; const pick = (key: string) => typeof search[key] === "string" ? search[key] as string : undefined;
  const { userId } = await auth();
  const questions = await listQuestions({ specialty: pick("specialty"), focus: pick("focus") as Focus | undefined, difficulty: pick("difficulty") as Difficulty | undefined, complicationTiming: pick("timing") as "early" | "late" | "none" | undefined, sourceIds: pick("source")?.split(",").filter(Boolean), sort: pick("sort") as "newest" | "oldest" | undefined });
  const documents = userId ? await listDocuments(userId) : [];
  const ids = questions.map((question) => question.id).join(",");
  return <div className="mx-auto max-w-5xl px-5 pb-24 pt-12 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Question bank</p><h1 className="display mt-3 text-5xl sm:text-6xl">Read. Reason. Repeat.</h1></div><ExportActions questions={questions}/></div><FilterBar documents={documents}/><div className="mt-6 flex items-center justify-between"><p className="text-sm text-[#60717a]">{questions.length} source-cited question{questions.length === 1 ? "" : "s"}</p>{questions.length > 0 && <Link href={`/practice/set?ids=${ids}`} className="no-print flex items-center gap-2 rounded-full bg-[#0b1f2a] px-4 py-2 text-sm font-semibold text-white"><Play size={14}/>Practice these</Link>}</div><section className="mt-8">{questions.length ? questions.map((question) => <McqCard key={question.id} question={question}/>) : <p className="border border-dashed border-[#b9c8c3] p-10 text-center text-[#60717a]">No questions match this filter yet.</p>}</section></div>;
}
