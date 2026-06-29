-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('EXPERIENCE', 'TEMPLATE', 'POSITION', 'NOTE');

-- CreateEnum
CREATE TYPE "KnowledgeSource" AS ENUM ('USER', 'AI', 'REVIEW', 'PLAN');

-- CreateEnum
CREATE TYPE "PlanPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "RecruitLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "position" TEXT,
    "resumeCount" INTEGER NOT NULL DEFAULT 0,
    "screenCount" INTEGER NOT NULL DEFAULT 0,
    "phoneCount" INTEGER NOT NULL DEFAULT 0,
    "interviewCount" INTEGER NOT NULL DEFAULT 0,
    "offerCount" INTEGER NOT NULL DEFAULT 0,
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "problems" TEXT,
    "reflection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReview" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptFile" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "rawOutput" JSONB NOT NULL,
    "parsedOutput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "logId" TEXT,
    "reviewId" TEXT,
    "schedule" JSONB NOT NULL,
    "priorityTasks" JSONB NOT NULL,
    "goals" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "expectedOutcomes" JSONB NOT NULL,
    "priority" "PlanPriority" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptFile" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "rawOutput" JSONB NOT NULL,
    "parsedOutput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knowledge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "KnowledgeType" NOT NULL,
    "source" "KnowledgeSource" NOT NULL,
    "tags" TEXT[],
    "sourceReviewId" TEXT,
    "sourcePlanId" TEXT,
    "rawOutput" JSONB,
    "parsedOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitLog_date_key" ON "RecruitLog"("date");

-- CreateIndex
CREATE INDEX "RecruitLog_date_idx" ON "RecruitLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReview_logId_key" ON "DailyReview"("logId");

-- CreateIndex
CREATE INDEX "DailyReview_createdAt_idx" ON "DailyReview"("createdAt");

-- CreateIndex
CREATE INDEX "DailyPlan_date_idx" ON "DailyPlan"("date");

-- CreateIndex
CREATE INDEX "DailyPlan_logId_idx" ON "DailyPlan"("logId");

-- CreateIndex
CREATE INDEX "DailyPlan_reviewId_idx" ON "DailyPlan"("reviewId");

-- CreateIndex
CREATE INDEX "Knowledge_type_idx" ON "Knowledge"("type");

-- CreateIndex
CREATE INDEX "Knowledge_source_idx" ON "Knowledge"("source");

-- CreateIndex
CREATE INDEX "Knowledge_createdAt_idx" ON "Knowledge"("createdAt");

-- AddForeignKey
ALTER TABLE "DailyReview" ADD CONSTRAINT "DailyReview_logId_fkey" FOREIGN KEY ("logId") REFERENCES "RecruitLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_logId_fkey" FOREIGN KEY ("logId") REFERENCES "RecruitLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "DailyReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_sourceReviewId_fkey" FOREIGN KEY ("sourceReviewId") REFERENCES "DailyReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "DailyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
