import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestionsFromPdf } from "@/lib/ai/generate-from-pdf";
import { readPrivateBlob, removeBlob } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const maxDuration = 300;

const inputSchema = z.object({ blobUrl: z.string().url(), originalFileName: z.string().min(1).max(255), focus: z.enum(["diagnostic", "surgical_complication", "physio_management"]), difficulty: z.enum(["undergrad", "postgrad", "licensing"]), questionCount: z.number().int().min(1).max(8), specialtyHint: z.string().max(40).optional() });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  let blobUrl: string | undefined;
  try {
    const input = inputSchema.parse(await request.json());
    blobUrl = input.blobUrl;
    const result = await generateQuestionsFromPdf({ ...input, pdf: await readPrivateBlob(input.blobUrl), filename: input.originalFileName });
    const questions = result.questions.filter((question) => question.specialty !== "other");
    return NextResponse.json({ questionCount: questions.length, questions, overallNotes: result.overallNotes });
  } catch (error) {
    if (blobUrl) await removeBlob(blobUrl).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed." }, { status: 500 });
  }
}
