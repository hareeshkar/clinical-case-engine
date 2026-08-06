import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { quizSets } from "@/lib/db/schema";

const inputSchema = z.object({ title: z.string().min(1).max(255), questionIds: z.array(z.string()).min(1).max(50) });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const input = inputSchema.parse(await request.json());
    const [quiz] = await getDb().insert(quizSets).values({ ...input, ownerId: userId }).returning();
    return NextResponse.json(quiz, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save quiz." }, { status: 400 }); }
}
