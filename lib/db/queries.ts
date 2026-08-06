import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { documents, questions } from "@/lib/db/schema";
import { coreQuestions } from "@/lib/domain/specialties";
import type { Difficulty, DocumentRecord, Focus, Question } from "@/lib/domain/types";

type QuestionFilters = { specialty?: string; focus?: Focus; difficulty?: Difficulty; documentId?: string };

function mapQuestion(row: typeof questions.$inferSelect, title?: string | null): Question {
  return {
    id: row.id,
    stem: row.stem,
    options: row.options,
    correctIndex: row.correctIndex,
    rationale: row.rationale,
    focus: row.focus as Focus,
    difficulty: row.difficulty as Difficulty,
    specialty: row.specialtyId,
    specialtyId: row.specialtyId,
    complicationTiming: row.complicationTiming as Question["complicationTiming"],
    sourceCitation: row.sourceCitation,
    documentId: row.documentId,
    documentTitle: title,
  };
}

export async function listQuestions(filters: QuestionFilters = {}) {
  if (!process.env.DATABASE_URL) return filterCoreQuestions(filters);
  const db = getDb();
  const conditions = [
    filters.specialty ? eq(questions.specialtyId, filters.specialty) : undefined,
    filters.focus ? eq(questions.focus, filters.focus) : undefined,
    filters.difficulty ? eq(questions.difficulty, filters.difficulty) : undefined,
    filters.documentId === "core" ? sql`${questions.documentId} is null` : filters.documentId ? eq(questions.documentId, filters.documentId) : undefined,
  ].filter(Boolean) as ReturnType<typeof eq>[];
  const rows = await db.select({ question: questions, documentTitle: documents.title }).from(questions).leftJoin(documents, eq(questions.documentId, documents.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(questions.createdAt));
  return rows.map(({ question, documentTitle }) => mapQuestion(question, documentTitle));
}

function filterCoreQuestions(filters: QuestionFilters) {
  return coreQuestions.filter((question) =>
    (!filters.specialty || question.specialty === filters.specialty) &&
    (!filters.focus || question.focus === filters.focus) &&
    (!filters.difficulty || question.difficulty === filters.difficulty) &&
    (!filters.documentId || filters.documentId === "core"),
  );
}

export async function getQuestionsByIds(ids: string[]) {
  if (!process.env.DATABASE_URL) return coreQuestions.filter((question) => ids.includes(question.id));
  const db = getDb();
  const rows = await db.select().from(questions).where(inArray(questions.id, ids));
  return rows.map((row) => mapQuestion(row));
}

export async function listDocuments(ownerId: string): Promise<DocumentRecord[]> {
  if (!process.env.DATABASE_URL) return [];
  const db = getDb();
  const rows = await db.select({ document: documents, questionCount: sql<number>`count(${questions.id})::int` }).from(documents).leftJoin(questions, eq(questions.documentId, documents.id)).where(eq(documents.ownerId, ownerId)).groupBy(documents.id).orderBy(desc(documents.createdAt));
  return rows.map(({ document, questionCount }) => ({ ...document, createdAt: document.createdAt.toISOString(), questionCount }));
}

export async function createDocument(input: { ownerId: string; title: string; size: number; blobUrl: string; pageEstimate?: number }) {
  const db = getDb();
  const [document] = await db.insert(documents).values({ ...input, status: "uploading" }).returning();
  return document;
}

export async function getOwnedDocument(id: string, ownerId: string) {
  const db = getDb();
  const [document] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.ownerId, ownerId)));
  return document ?? null;
}

export async function updateDocument(id: string, values: Partial<typeof documents.$inferInsert>) {
  const db = getDb();
  await db.update(documents).set(values).where(eq(documents.id, id));
}

export async function saveGeneratedQuestions(documentId: string, output: Question[]) {
  const db = getDb();
  const compatible = output.filter((question) => question.specialty !== "other");
  if (compatible.length) await db.insert(questions).values(compatible.map((question) => ({ stem: question.stem, options: question.options, correctIndex: question.correctIndex, rationale: question.rationale, focus: question.focus, difficulty: question.difficulty, complicationTiming: question.complicationTiming, specialtyId: question.specialty, documentId, sourceCitation: question.sourceCitation })));
}
