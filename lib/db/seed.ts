import { config } from "dotenv";
import { benchmarkCases, coreQuestions, specialties as specialtySeed } from "@/lib/domain/specialties";
import { getDb } from "@/lib/db/client";
import { caseStudies, questions, specialties } from "@/lib/db/schema";

config({ path: ".env.local" });

async function seed() {
  const db = getDb();
  await db.insert(specialties).values(specialtySeed).onConflictDoNothing();
  await db.insert(caseStudies).values(benchmarkCases.map((item) => ({ id: item.id, title: item.title, specialtyId: item.specialty, summary: item.summary, learningPoints: item.learningPoints, rehabPlan: item.rehabPlan }))).onConflictDoNothing();
  await db.insert(questions).values(coreQuestions.map((item) => ({ id: item.id, stem: item.stem, options: item.options, correctIndex: item.correctIndex, rationale: item.rationale, focus: item.focus, difficulty: item.difficulty, complicationTiming: item.complicationTiming, specialtyId: item.specialty, documentId: null, sourceCitation: item.sourceCitation }))).onConflictDoNothing();
}

seed().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
