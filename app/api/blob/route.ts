import { NextResponse } from "next/server";
import { createBlobUploadResponse } from "@/lib/storage/blob";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try { return NextResponse.json(await createBlobUploadResponse(request)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload authorisation failed." }, { status: 400 }); }
}
