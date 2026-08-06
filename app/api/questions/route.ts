import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listQuestions } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const questions = await listQuestions({
    specialty: searchParams.get("specialty") || undefined,
    focus: searchParams.get("focus") as "diagnostic" | "surgical_complication" | "physio_management" | undefined,
    difficulty: searchParams.get("difficulty") as "undergrad" | "postgrad" | "licensing" | undefined,
    complicationTiming: searchParams.get("timing") as "early" | "late" | "none" | undefined,
    sourceIds: searchParams.get("source")?.split(",").filter(Boolean),
    sort: searchParams.get("sort") as "newest" | "oldest" | undefined,
  });
  return NextResponse.json(questions);
}
