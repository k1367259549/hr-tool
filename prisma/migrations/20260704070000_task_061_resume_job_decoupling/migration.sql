-- Preserve existing enum values as text while allowing future intake sources.
ALTER TABLE "CandidateResume"
ADD COLUMN "language" TEXT,
ADD COLUMN "parserVersion" TEXT,
ALTER COLUMN "intakeSource" DROP DEFAULT,
ALTER COLUMN "intakeSource" TYPE TEXT USING "intakeSource"::text,
ALTER COLUMN "intakeSource" DROP NOT NULL;

DROP TYPE "ResumeIntakeSource";
