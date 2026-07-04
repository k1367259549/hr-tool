CREATE TYPE "ResumeEvaluationRunType" AS ENUM ('MOCK', 'RULE_BASED', 'AI');

CREATE TYPE "ResumeEvaluationRunStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "ResumeEvaluationRun" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "resumeId" TEXT NOT NULL,
  "resumeRevisionId" TEXT NOT NULL,
  "parsedSnapshotId" TEXT NOT NULL,
  "jobProfileId" TEXT NOT NULL,
  "templateVersionId" TEXT NOT NULL,
  "jobProfileVersion" TEXT NOT NULL,
  "runType" "ResumeEvaluationRunType" NOT NULL,
  "status" "ResumeEvaluationRunStatus" NOT NULL,
  "score" INTEGER,
  "rating" TEXT,
  "summary" TEXT,
  "strengthsJson" JSONB,
  "weaknessesJson" JSONB,
  "riskFlagsJson" JSONB,
  "evidenceJson" JSONB,
  "phoneScreenQuestionsJson" JSONB,
  "interviewQuestionsJson" JSONB,
  "modelProvider" TEXT,
  "modelName" TEXT,
  "promptVersion" TEXT,
  "inputHash" TEXT,
  "outputHash" TEXT,
  "rawOutputJson" JSONB,
  "parsedOutputJson" JSONB,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "ResumeEvaluationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResumeEvaluationRun_evaluationId_idx" ON "ResumeEvaluationRun"("evaluationId");
CREATE INDEX "ResumeEvaluationRun_resumeId_idx" ON "ResumeEvaluationRun"("resumeId");
CREATE INDEX "ResumeEvaluationRun_resumeRevisionId_idx" ON "ResumeEvaluationRun"("resumeRevisionId");
CREATE INDEX "ResumeEvaluationRun_parsedSnapshotId_idx" ON "ResumeEvaluationRun"("parsedSnapshotId");
CREATE INDEX "ResumeEvaluationRun_jobProfileId_idx" ON "ResumeEvaluationRun"("jobProfileId");
CREATE INDEX "ResumeEvaluationRun_templateVersionId_idx" ON "ResumeEvaluationRun"("templateVersionId");
CREATE INDEX "ResumeEvaluationRun_status_idx" ON "ResumeEvaluationRun"("status");
CREATE INDEX "ResumeEvaluationRun_runType_idx" ON "ResumeEvaluationRun"("runType");
CREATE INDEX "ResumeEvaluationRun_createdAt_idx" ON "ResumeEvaluationRun"("createdAt");
CREATE INDEX "ResumeEvaluationRun_evaluationId_status_createdAt_idx" ON "ResumeEvaluationRun"("evaluationId", "status", "createdAt");

ALTER TABLE "ResumeEvaluationRun"
ADD CONSTRAINT "ResumeEvaluationRun_evaluationId_fkey"
FOREIGN KEY ("evaluationId") REFERENCES "ResumeEvaluationResult"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResumeEvaluationRun"
ADD CONSTRAINT "ResumeEvaluationRun_resumeId_fkey"
FOREIGN KEY ("resumeId") REFERENCES "CandidateResume"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResumeEvaluationRun"
ADD CONSTRAINT "ResumeEvaluationRun_resumeRevisionId_fkey"
FOREIGN KEY ("resumeRevisionId") REFERENCES "ResumeRevision"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResumeEvaluationRun"
ADD CONSTRAINT "ResumeEvaluationRun_parsedSnapshotId_fkey"
FOREIGN KEY ("parsedSnapshotId") REFERENCES "ParsedSnapshot"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResumeEvaluationRun"
ADD CONSTRAINT "ResumeEvaluationRun_jobProfileId_fkey"
FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ResumeEvaluationRun"
ADD CONSTRAINT "ResumeEvaluationRun_templateVersionId_fkey"
FOREIGN KEY ("templateVersionId") REFERENCES "EvaluationTemplateVersion"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
