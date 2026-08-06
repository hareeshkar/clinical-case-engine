import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestionsFromPdf } from "@/lib/ai/generate-from-pdf";
import { getOwnedDocument, saveGeneratedQuestions, updateDocument } from "@/lib/db/queries";
import { removeBlob } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const maxDuration = 300;

const generateInput = z.object({ focus: z.enum(["diagnostic", "surgical_complication", "physio_management"]), difficulty: z.enum(["undergrad", "postgrad", "licensing"]), questionCount: z.number().int().min(1).max(8), specialtyHint: z.string().max(40).optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;
  try {
    const input = generateInput.parse(await request.json());
    const document = await getOwnedDocument(id, userId);
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    await updateDocument(id, { status: "processing", errorMessage: null });
    const response = await fetch(document.blobUrl);
    if (!response.ok) throw new Error("The temporary PDF could not be retrieved.");
    const result = await generateQuestionsFromPdf({ ...input, pdf: new Uint8Array(await response.arrayBuffer()), filename: document.title });
    await saveGeneratedQuestions(id, result.questions);
    await updateDocument(id, { status: "ready", geminiFileName: null, pageEstimate: document.pageEstimate ?? null });
    await removeBlob(document.blobUrl);
    return NextResponse.json({ questionCount: result.questions.length, overallNotes: result.overallNotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    await updateDocument(id, { status: "failed", errorMessage: message }).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
