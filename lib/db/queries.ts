import { and, asc, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { documentSpecialties, documents, questions, questionSecondarySpecialties, specialties } from "@/lib/db/schema";
import { coreQuestions, specialties as seededSpecialties } from "@/lib/domain/specialties";
import type { Difficulty, DocumentRecord, Focus, Question, Specialty } from "@/lib/domain/types";

type QuestionFilters = {
  specialty?: string;
  focus?: Focus;
  difficulty?: Difficulty;
  complicationTiming?: "early" | "late" | "none";
  sourceIds?: string[];
  sort?: "newest" | "oldest";
};

function mapQuestion(row: typeof questions.$inferSelect, title?: string | null, secondarySpecialtyIds: string[] = []): Question {
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
    secondarySpecialtyIds,
    complicationTiming: row.complicationTiming as Question["complicationTiming"],
    sourceCitation: row.sourceCitation,
    documentId: row.documentId,
    documentTitle: title,
  };
}

function mapSpecialty(row: typeof specialties.$inferSelect): Specialty {
  return { id: row.id, slug: row.slug, name: row.name, description: row.description, color: row.color, parentId: row.parentId, ownerId: row.ownerId, aliases: row.aliases };
}

export async function listAvailableSpecialties(ownerId: string): Promise<Specialty[]> {
  if (!process.env.DATABASE_URL) return seededSpecialties;
  const db = getDb();
  const rows = await db.select().from(specialties).where(or(isNull(specialties.ownerId), eq(specialties.ownerId, ownerId)));
  return rows.map(mapSpecialty);
}

export async function createPrivateSpecialty(input: { ownerId: string; name: string; parentId?: string | null; aliases?: string[] }) {
  const db = getDb();
  const normalized = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = await db.select().from(specialties).where(and(eq(specialties.ownerId, input.ownerId), sql`lower(${specialties.name}) = lower(${input.name.trim()})`));
  if (existing[0]) return mapSpecialty(existing[0]);
  const id = `sp_${crypto.randomUUID().replaceAll("-", "").slice(0, 36)}`;
  const [specialty] = await db.insert(specialties).values({ id, name: input.name.trim(), slug: `${input.ownerId}-${normalized}-${id.slice(-6)}`, description: "Private user-created specialty", color: "#6d8c9b", parentId: input.parentId ?? null, ownerId: input.ownerId, aliases: input.aliases ?? [] }).returning();
  return mapSpecialty(specialty);
}

export async function listQuestions(filters: QuestionFilters = {}) {
  if (!process.env.DATABASE_URL) return filterCoreQuestions(filters);
  const db = getDb();
  const sourceIds = filters.sourceIds?.filter(Boolean) ?? [];
  const selectedDocumentIds = sourceIds.filter((id) => id !== "core");
  const sourceCondition = sourceIds.length
    ? or(...[
      sourceIds.includes("core") ? isNull(questions.documentId) : undefined,
      selectedDocumentIds.length ? inArray(questions.documentId, selectedDocumentIds) : undefined,
    ].filter((condition): condition is SQL => Boolean(condition)))
    : undefined;
  const conditions = [
    or(isNull(questions.documentId), eq(documents.status, "ready")),
    filters.focus ? eq(questions.focus, filters.focus) : undefined,
    filters.difficulty ? eq(questions.difficulty, filters.difficulty) : undefined,
    filters.complicationTiming === "none" ? isNull(questions.complicationTiming) : filters.complicationTiming ? eq(questions.complicationTiming, filters.complicationTiming) : undefined,
    sourceCondition,
  ].filter((condition): condition is SQL => Boolean(condition));
  const rows = await db.select({ question: questions, documentTitle: documents.title }).from(questions).leftJoin(documents, eq(questions.documentId, documents.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(filters.sort === "oldest" ? asc(questions.createdAt) : desc(questions.createdAt));
  const secondaryRows = rows.length ? await db.select().from(questionSecondarySpecialties).where(inArray(questionSecondarySpecialties.questionId, rows.map(({ question }) => question.id))) : [];
  const secondaryByQuestion = new Map<string, string[]>();
  for (const row of secondaryRows) secondaryByQuestion.set(row.questionId, [...(secondaryByQuestion.get(row.questionId) ?? []), row.specialtyId]);
  return rows.map(({ question, documentTitle }) => mapQuestion(question, documentTitle, secondaryByQuestion.get(question.id) ?? [])).filter((question) => !filters.specialty || question.specialty === filters.specialty || question.secondarySpecialtyIds?.includes(filters.specialty));
}

function filterCoreQuestions(filters: QuestionFilters) {
  return coreQuestions.filter((question) =>
    (!filters.specialty || question.specialty === filters.specialty) &&
    (!filters.focus || question.focus === filters.focus) &&
    (!filters.difficulty || question.difficulty === filters.difficulty) &&
    (!filters.complicationTiming || (filters.complicationTiming === "none" ? question.complicationTiming === null : question.complicationTiming === filters.complicationTiming)) &&
    (!filters.sourceIds?.length || filters.sourceIds.includes("core")),
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
  const rows = await db.select({ document: documents, questionCount: sql<number>`count(${questions.id})::int` }).from(documents).leftJoin(questions, eq(questions.documentId, documents.id)).where(and(eq(documents.ownerId, ownerId), eq(documents.status, "ready"))).groupBy(documents.id).orderBy(desc(documents.createdAt));
  const specialtyRows = rows.length ? await db.select({ documentId: documentSpecialties.documentId, specialty: specialties }).from(documentSpecialties).innerJoin(specialties, eq(documentSpecialties.specialtyId, specialties.id)).where(inArray(documentSpecialties.documentId, rows.map(({ document }) => document.id))) : [];
  return rows.map(({ document, questionCount }) => ({ ...document, createdAt: document.createdAt.toISOString(), questionCount, specialties: specialtyRows.filter((item) => item.documentId === document.id).map((item) => mapSpecialty(item.specialty)) }));
}

export async function createDocument(input: { ownerId: string; title: string; originalFileName: string; size: number; blobUrl: string; specialtyIds: string[]; pageEstimate?: number }) {
  const db = getDb();
  const { specialtyIds, ...values } = input;
  const [document] = await db.insert(documents).values({ ...values, status: "ready" }).returning();
  await db.insert(documentSpecialties).values([...new Set(specialtyIds)].map((specialtyId, index) => ({ documentId: document.id, specialtyId, isPrimary: index === 0 })));
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

export async function deleteOwnedDocument(id: string, ownerId?: string) {
  const db = getDb();
  const conditions = ownerId ? and(eq(documents.id, id), eq(documents.ownerId, ownerId)) : eq(documents.id, id);
  const [document] = await db.select().from(documents).where(conditions);
  if (!document) return null;
  const questionRows = await db.select({ id: questions.id }).from(questions).where(eq(questions.documentId, id));
  if (questionRows.length) await db.delete(questionSecondarySpecialties).where(inArray(questionSecondarySpecialties.questionId, questionRows.map((question) => question.id)));
  await db.delete(documentSpecialties).where(eq(documentSpecialties.documentId, id));
  await db.delete(questions).where(eq(questions.documentId, id));
  await db.delete(documents).where(eq(documents.id, id));
  return document;
}


export async function saveGeneratedQuestions(documentId: string, output: Question[]) {
  const db = getDb();
  if (!output.length) return;
  const inserted = await db.insert(questions).values(output.map((question) => ({ stem: question.stem, options: question.options, correctIndex: question.correctIndex, rationale: question.rationale, focus: question.focus, difficulty: question.difficulty, complicationTiming: question.complicationTiming, specialtyId: question.specialty, documentId, sourceCitation: question.sourceCitation }))).returning({ id: questions.id });
  const secondary = output.flatMap((question, index) => (question.secondarySpecialtyIds ?? []).filter((id) => id !== question.specialty).map((specialtyId) => ({ questionId: inserted[index].id, specialtyId })));
  if (secondary.length) await db.insert(questionSecondarySpecialties).values(secondary).onConflictDoNothing();
}
