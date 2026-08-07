import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestionsFromPdf } from "@/lib/ai/generate-from-pdf";
import { listAvailableSpecialties } from "@/lib/db/queries";
import { readPrivateBlob, removeBlob } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const maxDuration = 300;

const inputSchema = z.object({ blobUrl: z.string().url(), originalFileName: z.string().min(1).max(255), focus: z.enum(["diagnostic", "surgical_complication", "physio_management"]), difficulty: z.enum(["undergrad", "postgrad", "licensing"]), questionCount: z.number().int().min(1).max(25), specialtyHint: z.string().max(40).optional() });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  let blobUrl: string | undefined;
  try {
    const input = inputSchema.parse(await request.json());
    blobUrl = input.blobUrl;
    const taxonomy = await listAvailableSpecialties(userId);
    const result = await generateQuestionsFromPdf({ ...input, taxonomy, pdf: await readPrivateBlob(input.blobUrl), filename: input.originalFileName });
    const allowed = new Set([...taxonomy.map((specialty) => specialty.id), ...result.proposedSpecialties.map((specialty) => specialty.key)]);
    const questions = result.questions.filter((question) => allowed.has(question.specialty)).map((question) => ({ ...question, secondarySpecialtyIds: (question.secondarySpecialtyIds ?? []).filter((id) => allowed.has(id) && id !== question.specialty) }));
    if (!questions.length) {
      await removeBlob(input.blobUrl).catch(() => undefined);
      return NextResponse.json({ error: "No grounded questions with a valid specialty classification were generated. The temporary source was discarded." }, { status: 422 });
    }
    return NextResponse.json({ questionCount: questions.length, questions, taxonomy, proposedSpecialties: result.proposedSpecialties, overallNotes: result.overallNotes });
  } catch (error) {
    if (blobUrl) await removeBlob(blobUrl).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed." }, { status: 500 });
  }
}
