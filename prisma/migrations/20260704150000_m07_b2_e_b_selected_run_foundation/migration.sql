ALTER TABLE "ResumeEvaluationResult"
ADD COLUMN "selectedRunId" TEXT;

CREATE INDEX "ResumeEvaluationResult_selectedRunId_idx" ON "ResumeEvaluationResult"("selectedRunId");

ALTER TABLE "ResumeEvaluationResult"
ADD CONSTRAINT "ResumeEvaluationResult_selectedRunId_fkey"
FOREIGN KEY ("selectedRunId") REFERENCES "ResumeEvaluationRun"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
