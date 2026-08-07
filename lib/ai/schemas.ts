import { z } from "zod";

export const generatedMcqSchema = z.object({
  stem: z.string().min(1),
  options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  correctIndex: z.number().int().min(0).max(3),
  rationale: z.string().min(1),
  focus: z.enum(["diagnostic", "surgical_complication", "physio_management"]),
  difficulty: z.enum(["undergrad", "postgrad", "licensing"]),
  specialty: z.string().min(1).max(80),
  secondarySpecialties: z.array(z.string().min(1).max(80)).max(3).default([]),
  complicationTiming: z.enum(["early", "late"]).nullable(),
  sourceCitation: z.string().min(1),
});

export const generatedMcqBatchSchema = z.object({
  questions: z.array(generatedMcqSchema).max(25),
  proposedSpecialties: z.array(z.object({ key: z.string().regex(/^proposed:[a-z0-9-]+$/), name: z.string().min(2).max(80), parentKey: z.string().max(80).nullable(), rationale: z.string().min(1).max(300) })).max(5).default([]),
  overallNotes: z.string(),
});
