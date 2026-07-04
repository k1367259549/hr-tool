ALTER TABLE "ResumeEvaluationResult"
ADD COLUMN "resumeRevisionId" TEXT,
ADD COLUMN "parsedSnapshotId" TEXT;

CREATE INDEX "ResumeEvaluationResult_resumeRevisionId_idx" ON "ResumeEvaluationResult"("resumeRevisionId");
CREATE INDEX "ResumeEvaluationResult_parsedSnapshotId_idx" ON "ResumeEvaluationResult"("parsedSnapshotId");

ALTER TABLE "ResumeEvaluationResult"
ADD CONSTRAINT "ResumeEvaluationResult_resumeRevisionId_fkey"
FOREIGN KEY ("resumeRevisionId") REFERENCES "ResumeRevision"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResumeEvaluationResult"
ADD CONSTRAINT "ResumeEvaluationResult_parsedSnapshotId_fkey"
FOREIGN KEY ("parsedSnapshotId") REFERENCES "ParsedSnapshot"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
