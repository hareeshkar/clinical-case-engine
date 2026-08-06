import { NextResponse } from "next/server";
import { createBlobUploadResponse, removeBlob } from "@/lib/storage/blob";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try { return NextResponse.json(await createBlobUploadResponse(request)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload authorisation failed." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Blob URL is required." }, { status: 400 });
  await removeBlob(url).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
