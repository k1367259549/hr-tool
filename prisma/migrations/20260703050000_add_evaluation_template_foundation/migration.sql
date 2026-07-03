-- CreateEnum
CREATE TYPE "EvaluationTemplateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationTemplateVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "EvaluationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EvaluationTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "latestVersionNumber" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "EvaluationTemplateVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "criteria" JSONB NOT NULL,
    "instructions" TEXT,
    "changeNote" TEXT,
    "createdBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobProfileEvaluationAssignment" (
    "id" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "JobProfileEvaluationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationTemplate_name_idx" ON "EvaluationTemplate"("name");

-- CreateIndex
CREATE INDEX "EvaluationTemplate_status_idx" ON "EvaluationTemplate"("status");

-- CreateIndex
CREATE INDEX "EvaluationTemplate_createdAt_idx" ON "EvaluationTemplate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationTemplateVersion_templateId_versionNumber_key" ON "EvaluationTemplateVersion"("templateId", "versionNumber");

-- CreateIndex
CREATE INDEX "EvaluationTemplateVersion_templateId_status_idx" ON "EvaluationTemplateVersion"("templateId", "status");

-- CreateIndex
CREATE INDEX "EvaluationTemplateVersion_publishedAt_idx" ON "EvaluationTemplateVersion"("publishedAt");

-- CreateIndex
CREATE INDEX "EvaluationTemplateVersion_createdAt_idx" ON "EvaluationTemplateVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationTemplateVersion_one_draft_per_template"
ON "EvaluationTemplateVersion" ("templateId")
WHERE "status" = 'DRAFT';

-- CreateIndex
CREATE INDEX "JobProfileEvaluationAssignment_jobProfileId_idx" ON "JobProfileEvaluationAssignment"("jobProfileId");

-- CreateIndex
CREATE INDEX "JobProfileEvaluationAssignment_templateVersionId_idx" ON "JobProfileEvaluationAssignment"("templateVersionId");

-- CreateIndex
CREATE INDEX "JobProfileEvaluationAssignment_endedAt_idx" ON "JobProfileEvaluationAssignment"("endedAt");

-- CreateIndex
CREATE INDEX "JobProfileEvaluationAssignment_assignedAt_idx" ON "JobProfileEvaluationAssignment"("assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobProfileEvaluationAssignment_one_active_per_job_profile"
ON "JobProfileEvaluationAssignment" ("jobProfileId")
WHERE "endedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "EvaluationTemplateVersion" ADD CONSTRAINT "EvaluationTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfileEvaluationAssignment" ADD CONSTRAINT "JobProfileEvaluationAssignment_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfileEvaluationAssignment" ADD CONSTRAINT "JobProfileEvaluationAssignment_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "EvaluationTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
