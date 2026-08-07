import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteOwnedDocument } from "@/lib/db/queries";
import { removeBlob } from "@/lib/storage/blob";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;
  const document = await deleteOwnedDocument(id, userId);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  await removeBlob(document.blobUrl).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
