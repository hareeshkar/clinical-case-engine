import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createDocument, createPrivateSpecialty, listAvailableSpecialties, listDocuments, saveGeneratedQuestions } from "@/lib/db/queries";
import { generatedMcqBatchSchema, generatedMcqSchema } from "@/lib/ai/schemas";
import { MAX_PDF_BYTES } from "@/lib/storage/blob";

export const runtime = "nodejs";

const specialtyChoiceSchema = z.object({ action: z.enum(["existing", "new"]), specialtyId: z.string().max(40).optional(), name: z.string().trim().min(2).max(80).optional(), parentId: z.string().max(40).nullable().optional() });
const documentInput = z.object({ title: z.string().trim().min(2).max(120), originalFileName: z.string().min(1).max(255), size: z.number().positive().max(MAX_PDF_BYTES), blobUrl: z.string().url(), questions: z.array(generatedMcqSchema).min(1).max(25), proposedSpecialties: generatedMcqBatchSchema.shape.proposedSpecialties, specialtyChoices: z.record(z.string(), specialtyChoiceSchema).default({}) });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try { return NextResponse.json(await listDocuments(userId)); }
  catch { return NextResponse.json({ error: "Configure DATABASE_URL to store documents." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const { questions, proposedSpecialties, specialtyChoices, ...input } = documentInput.parse(await request.json());
    const available = await listAvailableSpecialties(userId);
    const resolved = new Map(available.map((specialty) => [specialty.id, specialty.id]));
    for (const proposal of proposedSpecialties) {
      const choice = specialtyChoices[proposal.key];
      if (!choice) throw new Error(`Choose how to file the proposed ${proposal.name} specialty.`);
      if (choice.action === "existing") {
        if (!choice.specialtyId || !resolved.has(choice.specialtyId)) throw new Error("Choose a valid existing specialty.");
        resolved.set(proposal.key, choice.specialtyId);
      } else {
        const parentId = choice.parentId ?? proposal.parentKey;
        if (parentId && !resolved.has(parentId)) throw new Error("Choose a valid parent specialty.");
        const specialty = await createPrivateSpecialty({ ownerId: userId, name: choice.name ?? proposal.name, parentId: parentId ?? null, aliases: [proposal.name] });
        resolved.set(proposal.key, specialty.id);
        resolved.set(specialty.id, specialty.id);
      }
    }
    const resolvedQuestions = questions.map((question, index) => {
      const primary = resolved.get(question.specialty);
      if (!primary) throw new Error("A generated question has an unresolved primary specialty.");
      const secondary = question.secondarySpecialties.map((id) => resolved.get(id)).filter((id): id is string => Boolean(id) && id !== primary);
      return { ...question, id: `draft-${index}`, documentId: null, specialty: primary, secondarySpecialtyIds: secondary };
    });
    const specialtyIds = [...new Set(resolvedQuestions.flatMap((question) => [question.specialty, ...(question.secondarySpecialtyIds ?? [])]))];
    const document = await createDocument({ ...input, ownerId: userId, specialtyIds });
    await saveGeneratedQuestions(document.id, resolvedQuestions);
    return NextResponse.json(document, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create document." }, { status: 400 }); }
}
