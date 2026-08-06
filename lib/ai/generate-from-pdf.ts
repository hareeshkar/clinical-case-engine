import { getGeminiFilesClient } from "@/lib/ai/client";
import { buildMcqUserPrompt, SYSTEM_PROMPT_MCQ } from "@/lib/ai/prompts";
import { generatedMcqBatchSchema } from "@/lib/ai/schemas";
import type { Difficulty, Focus, Question } from "@/lib/domain/types";

const MODEL = "gemini-3.5-flash-lite";
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const responseSchema = {
  type: "OBJECT",
  properties: {
    questions: { type: "ARRAY", items: {
      type: "OBJECT",
      properties: {
        stem: { type: "STRING" }, options: { type: "ARRAY", minItems: 4, maxItems: 4, items: { type: "STRING" } }, correctIndex: { type: "INTEGER" }, rationale: { type: "STRING" }, focus: { type: "STRING" }, difficulty: { type: "STRING" }, specialty: { type: "STRING" }, complicationTiming: { type: ["STRING", "NULL"] }, sourceCitation: { type: "STRING" },
      },
      required: ["stem", "options", "correctIndex", "rationale", "focus", "difficulty", "specialty", "complicationTiming", "sourceCitation"],
    } },
    overallNotes: { type: "STRING" },
  },
  required: ["questions", "overallNotes"],
} as const;

async function retryOnRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try { return await operation(); } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("429") && !message.toLowerCase().includes("rate")) throw error;
      await wait(1_000 * 2 ** attempt);
    }
  }
  throw lastError;
}

export async function generateQuestionsFromPdf(input: { pdf: Uint8Array; filename: string; focus: Focus; difficulty: Difficulty; questionCount: number; specialtyHint?: string }) {
  const ai = getGeminiFilesClient();
  const file = await retryOnRateLimit(() => ai.files.upload({
    file: new Blob([new Uint8Array(input.pdf)], { type: "application/pdf" }),
    config: { mimeType: "application/pdf", displayName: input.filename },
  }));

  let activeFile = file;
  for (let attempt = 0; attempt < 20 && activeFile.state === "PROCESSING"; attempt += 1) {
    await wait(1_500);
    activeFile = await ai.files.get({ name: file.name! });
  }
  if (activeFile.state === "FAILED") throw new Error("Gemini could not process this PDF.");
  if (activeFile.state !== "ACTIVE") throw new Error("Timed out while Gemini processed this PDF.");

  try {
    const response = await retryOnRateLimit(() => ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: buildMcqUserPrompt(input) }, { fileData: { fileUri: activeFile.uri!, mimeType: "application/pdf" } }] }],
      config: { systemInstruction: SYSTEM_PROMPT_MCQ, responseMimeType: "application/json", responseJsonSchema: responseSchema },
    }));
    const parsed = generatedMcqBatchSchema.parse(JSON.parse(response.text ?? "{}"));
    return { questions: parsed.questions.map((question, index) => ({ ...question, id: `generated-${index}`, documentId: null } satisfies Question)), overallNotes: parsed.overallNotes, geminiFileName: activeFile.name! };
  } finally {
    // The database holds only generated learning content; remove the ephemeral source from Gemini.
    if (activeFile.name) await ai.files.delete({ name: activeFile.name }).catch(() => undefined);
  }
}
