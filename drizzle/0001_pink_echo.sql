ALTER TABLE "documents" ADD COLUMN "original_file_name" varchar(255);
--> statement-breakpoint
UPDATE "documents" SET "original_file_name" = "title" WHERE "original_file_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "original_file_name" SET NOT NULL;
