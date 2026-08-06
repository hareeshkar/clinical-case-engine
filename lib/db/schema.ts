import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const specialties = pgTable("specialties", {
  id: varchar("id", { length: 40 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description").notNull(),
  color: varchar("color", { length: 16 }).notNull(),
});

export const caseStudies = pgTable("case_studies", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  specialtyId: varchar("specialty_id", { length: 40 }).notNull().references(() => specialties.id),
  summary: text("summary").notNull(),
  learningPoints: jsonb("learning_points").$type<string[]>().notNull(),
  rehabPlan: text("rehab_plan").notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  blobUrl: text("blob_url").notNull(),
  size: integer("size").notNull(),
  geminiFileName: text("gemini_file_name"),
  status: varchar("status", { length: 20 }).$type<"uploading" | "processing" | "ready" | "failed">().notNull().default("uploading"),
  pageEstimate: integer("page_estimate"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  stem: text("stem").notNull(),
  options: jsonb("options").$type<[string, string, string, string]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
  rationale: text("rationale").notNull(),
  focus: varchar("focus", { length: 40 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  complicationTiming: varchar("complication_timing", { length: 10 }),
  specialtyId: varchar("specialty_id", { length: 40 }).notNull().references(() => specialties.id),
  documentId: uuid("document_id").references(() => documents.id),
  sourceCitation: text("source_citation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("question_filter_idx").on(table.specialtyId, table.focus, table.difficulty)]);

export const quizSets = pgTable("quiz_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  questionIds: jsonb("question_ids").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
