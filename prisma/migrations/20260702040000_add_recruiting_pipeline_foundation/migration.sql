-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('NEW', 'RESUME_SCREEN', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ApplicationEventType" AS ENUM ('CREATED', 'STAGE_CHANGED', 'NOTE_ADDED');

-- CreateTable
CREATE TABLE "CandidateApplication" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "currentStage" "ApplicationStage" NOT NULL DEFAULT 'NEW',
    "owner" TEXT,
    "sourceChannel" TEXT,
    "notes" TEXT,
    "latestActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventType" "ApplicationEventType" NOT NULL,
    "actor" TEXT,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateApplication_candidateId_idx" ON "CandidateApplication"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateApplication_jobProfileId_idx" ON "CandidateApplication"("jobProfileId");

-- CreateIndex
CREATE INDEX "CandidateApplication_currentStage_idx" ON "CandidateApplication"("currentStage");

-- CreateIndex
CREATE INDEX "CandidateApplication_owner_idx" ON "CandidateApplication"("owner");

-- CreateIndex
CREATE INDEX "CandidateApplication_latestActivityAt_idx" ON "CandidateApplication"("latestActivityAt");

-- CreateIndex
CREATE INDEX "CandidateApplication_closedAt_idx" ON "CandidateApplication"("closedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateApplication_active_candidate_job_unique" ON "CandidateApplication"("candidateId", "jobProfileId") WHERE "closedAt" IS NULL;

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_eventType_idx" ON "ApplicationEvent"("eventType");

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
