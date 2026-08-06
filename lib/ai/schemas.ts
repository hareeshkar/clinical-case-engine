import { z } from "zod";

export const generatedMcqSchema = z.object({
  stem: z.string().min(1),
  options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  correctIndex: z.number().int().min(0).max(3),
  rationale: z.string().min(1),
  focus: z.enum(["diagnostic", "surgical_complication", "physio_management"]),
  difficulty: z.enum(["undergrad", "postgrad", "licensing"]),
  specialty: z.enum(["thoracic", "breast", "thyroid", "pulmonary_htn", "heart_failure", "ihd", "abdominal", "other"]),
  complicationTiming: z.enum(["early", "late"]).nullable(),
  sourceCitation: z.string().min(1),
});

export const generatedMcqBatchSchema = z.object({
  questions: z.array(generatedMcqSchema).max(8),
  overallNotes: z.string(),
});
