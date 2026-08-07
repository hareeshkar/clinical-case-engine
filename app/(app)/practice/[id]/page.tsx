import { QuizPlayer } from "@/components/practice/quiz-player";
import { getQuestionsByIds, listQuestions } from "@/lib/db/queries";

export default async function PracticePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ids?: string }> }) {
  const { id } = await params; const { ids } = await searchParams; const questions = ids ? await getQuestionsByIds(ids.split(",").filter(Boolean)) : id === "core" ? await listQuestions({ sourceIds: ["core"] }) : [];
  return <div className="mx-auto max-w-6xl px-5 pb-24 lg:px-8"><QuizPlayer questions={questions}/></div>;
}
