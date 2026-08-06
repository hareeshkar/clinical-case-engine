import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createDocument, listDocuments } from "@/lib/db/queries";
import { MAX_PDF_BYTES } from "@/lib/storage/blob";

export const runtime = "nodejs";

const documentInput = z.object({ title: z.string().min(1).max(255), size: z.number().positive().max(MAX_PDF_BYTES), blobUrl: z.string().url(), pageEstimate: z.number().int().positive().optional() });

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
    const input = documentInput.parse(await request.json());
    const document = await createDocument({ ...input, ownerId: userId });
    return NextResponse.json(document, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create document." }, { status: 400 }); }
}
