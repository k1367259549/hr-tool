-- CreateTable
CREATE TABLE "DailyRecruitingWorkspace" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activitySnapshot" JSONB NOT NULL,
    "dailySummary" JSONB NOT NULL,
    "recruitingInsights" JSONB NOT NULL,
    "tomorrowPriorities" JSONB NOT NULL,
    "improvementSuggestions" JSONB NOT NULL,
    "manualNotes" TEXT,
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptVersions" JSONB NOT NULL,
    "generationTimes" JSONB NOT NULL,
    "humanReview" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRecruitingWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyRecruitingWorkspace_workflowId_idx" ON "DailyRecruitingWorkspace"("workflowId");

-- CreateIndex
CREATE INDEX "DailyRecruitingWorkspace_date_idx" ON "DailyRecruitingWorkspace"("date");

-- CreateIndex
CREATE INDEX "DailyRecruitingWorkspace_createdAt_idx" ON "DailyRecruitingWorkspace"("createdAt");
