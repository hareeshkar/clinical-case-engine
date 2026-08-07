CREATE TABLE "document_specialties" (
	"document_id" uuid NOT NULL,
	"specialty_id" varchar(40) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "document_specialties_document_id_specialty_id_pk" PRIMARY KEY("document_id","specialty_id")
);
--> statement-breakpoint
CREATE TABLE "question_secondary_specialties" (
	"question_id" uuid NOT NULL,
	"specialty_id" varchar(40) NOT NULL,
	CONSTRAINT "question_secondary_specialties_question_id_specialty_id_pk" PRIMARY KEY("question_id","specialty_id")
);
--> statement-breakpoint
ALTER TABLE "specialties" ADD COLUMN "parent_id" varchar(40);--> statement-breakpoint
ALTER TABLE "specialties" ADD COLUMN "owner_id" varchar(255);--> statement-breakpoint
ALTER TABLE "specialties" ADD COLUMN "aliases" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
INSERT INTO "document_specialties" ("document_id", "specialty_id", "is_primary")
SELECT DISTINCT "document_id", "specialty_id", false FROM "questions" WHERE "document_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "document_specialties" AS current
SET "is_primary" = true
WHERE "specialty_id" = (
  SELECT "specialty_id" FROM "document_specialties" AS candidate
  WHERE candidate."document_id" = current."document_id"
  ORDER BY candidate."specialty_id" LIMIT 1
);--> statement-breakpoint
ALTER TABLE "document_specialties" ADD CONSTRAINT "document_specialties_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_specialties" ADD CONSTRAINT "document_specialties_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_secondary_specialties" ADD CONSTRAINT "question_secondary_specialties_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_secondary_specialties" ADD CONSTRAINT "question_secondary_specialties_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialties" ADD CONSTRAINT "specialties_parent_id_specialties_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."specialties"("id") ON DELETE no action ON UPDATE no action;
