-- CreateTable
CREATE TABLE "JobProfile" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jd" TEXT NOT NULL,
    "leaderRequirements" TEXT,
    "teamBackground" TEXT,
    "hiringGoal" TEXT,
    "notes" TEXT,
    "jobSummary" TEXT NOT NULL,
    "coreResponsibilities" TEXT[],
    "requiredCompetencies" TEXT[],
    "preferredCompetencies" TEXT[],
    "potentialRisks" TEXT[],
    "hiringFocus" TEXT[],
    "interviewFocus" TEXT[],
    "missingInformation" TEXT[],
    "suggestedFollowUpQuestions" TEXT[],
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptFile" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "generationTimeMs" INTEGER,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobProfile_workflowId_idx" ON "JobProfile"("workflowId");

-- CreateIndex
CREATE INDEX "JobProfile_createdAt_idx" ON "JobProfile"("createdAt");
