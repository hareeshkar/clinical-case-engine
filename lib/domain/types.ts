export const FOCUSES = ["diagnostic", "surgical_complication", "physio_management"] as const;
export const DIFFICULTIES = ["undergrad", "postgrad", "licensing"] as const;
export const TIMINGS = ["early", "late"] as const;

export type Focus = (typeof FOCUSES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type ComplicationTiming = (typeof TIMINGS)[number] | null;

export type Specialty = {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
};

export type Question = {
  id: string;
  stem: string;
  options: [string, string, string, string];
  correctIndex: number;
  rationale: string;
  focus: Focus;
  difficulty: Difficulty;
  specialty: string;
  specialtyId?: string;
  complicationTiming: ComplicationTiming;
  sourceCitation: string;
  documentId: string | null;
  documentTitle?: string | null;
};

export type CaseStudy = {
  id: string;
  title: string;
  specialty: string;
  summary: string;
  learningPoints: string[];
  rehabPlan: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  originalFileName: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "failed";
  pageEstimate: number | null;
  createdAt: string;
  errorMessage?: string | null;
  questionCount?: number;
};
