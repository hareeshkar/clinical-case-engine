# Atria Clinical Case Study Engine

A portfolio-ready clinical education workspace for source-cited, single-best-answer question practice. It has a seeded seven-specialty library, interactive practice, filters, document history, and a PDF-to-MCQ pipeline grounded in the entire uploaded source document.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Clerk authentication
- Neon Postgres with Drizzle ORM
- Vercel Blob for short-lived PDF staging
- Google Gemini Files API with `gemini-3.5-flash-lite`
- Browser-side `@react-pdf/renderer` study-set export and TSV flashcards

## Local setup

1. Copy `.env.example` to `.env.local` and supply the Clerk, Neon, Vercel Blob, and Google AI Studio values.
2. Run `npm install`.
3. Run `npm run db:migrate` and `npm run db:seed`.
4. Run `npm run dev`.

`npm run build` works without secrets for CI. Application routes remain Clerk-protected in configured deployments.

## PDF pipeline

1. The browser validates a PDF at 50 MB or below and uploads it directly to Blob.
2. A document row is recorded for the signed-in user.
3. The Node generation route downloads the temporary Blob object, uploads it to Gemini Files API, waits for processing, then requests Zod-validated structured MCQs.
4. The canonical system prompt forbids external medical knowledge and requires a source citation per item.
5. Valid questions are stored in Neon. Both the temporary Gemini file and Blob object are removed after a successful run.

The app does not use embeddings, a vector database, chunking, retrieval, or a separate OCR service.

## Important limits and safety

- This is an educational portfolio app, not a clinical decision-support system.
- Do not upload real patient-identifiable information. Google free-tier API data handling is not appropriate for PHI.
- Gemini free-tier limits vary by project. Generation is deliberately limited to batches of 3, 5, or 8 and retries rate-limit responses with exponential backoff.
- Blob is short-lived staging rather than a permanent document archive. The 50 MB cap is hard; 15-20 MB documents are more comfortable on free storage limits.
- Current production deployment should use Vercel with the environment variables in `.env.example`; the generation route uses Node runtime and a 300-second max duration.
