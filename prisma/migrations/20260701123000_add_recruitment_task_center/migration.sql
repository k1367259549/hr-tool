CREATE TABLE "RecruitmentTask" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "priorityReason" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT[],
    "relatedWorkflow" TEXT,
    "relatedCandidate" TEXT,
    "relatedJob" TEXT,
    "dueTime" TIMESTAMP(3),
    "recommendedNextAction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "quickStartHref" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'AI_RECRUITER',
    "reviewedByRecruiter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruitmentTaskAudit" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "beforeStatus" TEXT,
    "afterStatus" TEXT,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentTaskAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecruitmentTask_sourceKey_key" ON "RecruitmentTask"("sourceKey");
CREATE INDEX "RecruitmentTask_status_idx" ON "RecruitmentTask"("status");
CREATE INDEX "RecruitmentTask_priority_idx" ON "RecruitmentTask"("priority");
CREATE INDEX "RecruitmentTask_category_idx" ON "RecruitmentTask"("category");
CREATE INDEX "RecruitmentTask_sourceType_idx" ON "RecruitmentTask"("sourceType");
CREATE INDEX "RecruitmentTask_dueTime_idx" ON "RecruitmentTask"("dueTime");
CREATE INDEX "RecruitmentTask_createdAt_idx" ON "RecruitmentTask"("createdAt");
CREATE INDEX "RecruitmentTaskAudit_taskId_idx" ON "RecruitmentTaskAudit"("taskId");
CREATE INDEX "RecruitmentTaskAudit_action_idx" ON "RecruitmentTaskAudit"("action");
CREATE INDEX "RecruitmentTaskAudit_createdAt_idx" ON "RecruitmentTaskAudit"("createdAt");

ALTER TABLE "RecruitmentTaskAudit" ADD CONSTRAINT "RecruitmentTaskAudit_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RecruitmentTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
