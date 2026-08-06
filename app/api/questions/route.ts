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
    documentId: searchParams.get("documentId") || undefined,
  });
  return NextResponse.json(questions);
}
