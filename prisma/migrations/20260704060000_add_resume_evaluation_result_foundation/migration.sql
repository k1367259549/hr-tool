-- CreateEnum
CREATE TYPE "ResumeEvaluationStatus" AS ENUM ('DRAFT', 'REVIEWED');

-- CreateEnum
CREATE TYPE "ResumeEvaluationEventType" AS ENUM ('CREATED', 'UPDATED', 'REVIEWED', 'REOPENED');

-- CreateTable
CREATE TABLE "ResumeEvaluationResult" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "jobProfileVersion" TEXT NOT NULL,
    "status" "ResumeEvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "criterionResults" JSONB NOT NULL,
    "overallNote" TEXT,
    "evaluatedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeEvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeEvaluationEvent" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "eventType" "ResumeEvaluationEventType" NOT NULL,
    "actor" TEXT,
    "changedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeEvaluationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumeEvaluationResult_context_key" ON "ResumeEvaluationResult"("resumeId", "jobProfileId", "templateVersionId", "jobProfileVersion");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_resumeId_idx" ON "ResumeEvaluationResult"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_jobProfileId_idx" ON "ResumeEvaluationResult"("jobProfileId");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_templateVersionId_idx" ON "ResumeEvaluationResult"("templateVersionId");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_status_idx" ON "ResumeEvaluationResult"("status");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_evaluatedBy_idx" ON "ResumeEvaluationResult"("evaluatedBy");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_updatedAt_idx" ON "ResumeEvaluationResult"("updatedAt");

-- CreateIndex
CREATE INDEX "ResumeEvaluationResult_createdAt_idx" ON "ResumeEvaluationResult"("createdAt");

-- CreateIndex
CREATE INDEX "ResumeEvaluationEvent_evaluationId_createdAt_idx" ON "ResumeEvaluationEvent"("evaluationId", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeEvaluationEvent_eventType_idx" ON "ResumeEvaluationEvent"("eventType");

-- AddForeignKey
ALTER TABLE "ResumeEvaluationResult" ADD CONSTRAINT "ResumeEvaluationResult_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CandidateResume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeEvaluationResult" ADD CONSTRAINT "ResumeEvaluationResult_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeEvaluationResult" ADD CONSTRAINT "ResumeEvaluationResult_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "EvaluationTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeEvaluationEvent" ADD CONSTRAINT "ResumeEvaluationEvent_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ResumeEvaluationResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
