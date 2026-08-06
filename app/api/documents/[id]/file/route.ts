import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOwnedDocument } from "@/lib/db/queries";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;
  const document = await getOwnedDocument(id, userId);
  if (!document || document.status !== "ready") return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const source = await get(document.blobUrl, { access: "private" });
  if (!source) return NextResponse.json({ error: "PDF is no longer available." }, { status: 404 });
  return new Response(source.stream, { headers: { "Content-Type": source.blob.contentType ?? "application/pdf", "Content-Disposition": `inline; filename="${document.originalFileName.replaceAll('"', "")}"` } });
}
