CREATE TYPE "ResumeReviewerDecision" AS ENUM ('PASS', 'REJECT', 'HOLD', 'NEEDS_MORE_INFO');

ALTER TABLE "ResumeEvaluationResult"
ADD COLUMN "reviewedRunId" TEXT,
ADD COLUMN "reviewerDecision" "ResumeReviewerDecision",
ADD COLUMN "reviewerNotes" TEXT,
ADD COLUMN "reviewedBy" TEXT;

CREATE INDEX "ResumeEvaluationResult_reviewedRunId_idx" ON "ResumeEvaluationResult"("reviewedRunId");

ALTER TABLE "ResumeEvaluationResult"
ADD CONSTRAINT "ResumeEvaluationResult_reviewedRunId_fkey"
FOREIGN KEY ("reviewedRunId") REFERENCES "ResumeEvaluationRun"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
