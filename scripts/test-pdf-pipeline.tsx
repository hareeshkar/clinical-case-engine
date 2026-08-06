import { config } from "dotenv";
import React from "react";
import { del, get, put } from "@vercel/blob";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { generateQuestionsFromPdf } from "@/lib/ai/generate-from-pdf";

config({ path: ".env.local" });

async function main() {
  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4"><Text>Thyroidectomy teaching note</Text><Text>Early postoperative monitoring: new perioral tingling and hand paraesthesia may indicate hypocalcaemia. Escalate for clinical review.</Text><Text>Monitor airway status after neck surgery. Encourage comfortable, gradual mobilisation only after urgent concerns have been reviewed.</Text></Page>
    </Document>,
  );
  let url: string | undefined;
  try {
    const blob = await put(`e2e/thyroid-teaching-${Date.now()}.pdf`, pdf, { access: "private", contentType: "application/pdf" });
    url = blob.url;
    const stored = await get(url, { access: "private" });
    if (!stored) throw new Error("Blob upload could not be read back.");
    const result = await generateQuestionsFromPdf({ pdf: new Uint8Array(await new Response(stored.stream).arrayBuffer()), filename: "thyroid-teaching.pdf", focus: "diagnostic", difficulty: "undergrad", questionCount: 3, specialtyHint: "thyroid" });
    if (!result.questions.length) throw new Error(`Gemini returned no grounded questions: ${result.overallNotes}`);
    if (result.questions.some((question) => !question.sourceCitation)) throw new Error("A generated question was missing a source citation.");
    console.log(`Pipeline passed: ${result.questions.length} grounded questions generated and cited.`);
  } finally {
    if (url) await del(url).catch(() => undefined);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
