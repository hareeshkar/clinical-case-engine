import { del, get } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";

export const MAX_PDF_BYTES = 50 * 1024 * 1024;

export async function createBlobUploadResponse(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const { userId } = await auth();
      const payload = JSON.parse(clientPayload ?? "{}") as { name?: string; size?: number };
      if (!userId) throw new Error("Unauthorised");
      if (!payload.name?.toLowerCase().endsWith(".pdf") || !payload.size || payload.size > MAX_PDF_BYTES) throw new Error("Upload a PDF smaller than 50 MB.");
      return { addRandomSuffix: true, maximumSizeInBytes: MAX_PDF_BYTES, allowedContentTypes: ["application/pdf"], tokenPayload: JSON.stringify({ userId }) };
    },
  });
}

export async function removeBlob(url: string) {
  await del(url);
}

export async function readPrivateBlob(url: string) {
  const result = await get(url, { access: "private" });
  if (!result) throw new Error("The temporary PDF could not be retrieved.");
  return new Uint8Array(await new Response(result.stream).arrayBuffer());
}
