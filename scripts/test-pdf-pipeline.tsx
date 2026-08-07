import { config } from "dotenv";
import React from "react";
import { del, get, put } from "@vercel/blob";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { generateQuestionsFromPdf } from "@/lib/ai/generate-from-pdf";
import { specialties } from "@/lib/domain/specialties";

config({ path: ".env.local" });

async function main() {
  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4"><Text>Cardiometabolic teaching note</Text><Text>Heart failure monitoring: rapid weight gain with ankle swelling suggests fluid congestion. Progress rehabilitation gradually while monitoring symptoms.</Text><Text>Diabetes care: structured blood glucose monitoring and recognition of hypoglycaemia are described as essential during activity planning.</Text></Page>
    </Document>,
  );
  let url: string | undefined;
  try {
    const blob = await put(`e2e/cardiometabolic-teaching-${Date.now()}.pdf`, pdf, { access: "private", contentType: "application/pdf" });
    url = blob.url;
    const stored = await get(url, { access: "private" });
    if (!stored) throw new Error("Blob upload could not be read back.");
    const result = await generateQuestionsFromPdf({ pdf: new Uint8Array(await new Response(stored.stream).arrayBuffer()), filename: "cardiometabolic-teaching.pdf", focus: "diagnostic", difficulty: "undergrad", questionCount: 25, taxonomy: specialties });
    if (!result.questions.length) throw new Error(`Gemini returned no grounded questions: ${result.overallNotes}`);
    if (result.questions.some((question) => !question.sourceCitation)) throw new Error("A generated question was missing a source citation.");
    const allowedSpecialties = new Set([...specialties.map((specialty) => specialty.id), ...result.proposedSpecialties.map((specialty) => specialty.key)]);
    if (result.questions.some((question) => !allowedSpecialties.has(question.specialty) || question.secondarySpecialtyIds?.some((id) => !allowedSpecialties.has(id)))) throw new Error("A generated question used a specialty outside the canonical taxonomy or proposal list.");
    console.log(`Pipeline passed: ${result.questions.length} grounded questions generated and cited.`);
  } finally {
    if (url) await del(url).catch(() => undefined);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
