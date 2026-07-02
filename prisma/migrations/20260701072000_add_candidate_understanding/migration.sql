-- CreateTable
CREATE TABLE "CandidateResume" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "originalFile" BYTEA NOT NULL,
    "parsedText" TEXT,
    "parsingStatus" TEXT NOT NULL,
    "parsingError" TEXT,
    "structureChunks" JSONB NOT NULL,
    "semanticChunks" JSONB NOT NULL,
    "resumeVersion" TEXT NOT NULL,
    "candidateSource" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateInsight" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "candidateSource" TEXT,
    "notes" TEXT,
    "summary" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "strengths" TEXT[],
    "potentialRisks" TEXT[],
    "missingInformation" TEXT[],
    "suggestedPhoneScreenQuestions" TEXT[],
    "suggestedInterviewQuestions" TEXT[],
    "suggestedNextActions" TEXT[],
    "evidence" JSONB NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptFile" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "generationTimeMs" INTEGER,
    "jobProfileVersion" TEXT NOT NULL,
    "resumeVersion" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateResume_workflowId_idx" ON "CandidateResume"("workflowId");

-- CreateIndex
CREATE INDEX "CandidateResume_jobProfileId_idx" ON "CandidateResume"("jobProfileId");

-- CreateIndex
CREATE INDEX "CandidateResume_createdAt_idx" ON "CandidateResume"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInsight_resumeId_key" ON "CandidateInsight"("resumeId");

-- CreateIndex
CREATE INDEX "CandidateInsight_workflowId_idx" ON "CandidateInsight"("workflowId");

-- CreateIndex
CREATE INDEX "CandidateInsight_jobProfileId_idx" ON "CandidateInsight"("jobProfileId");

-- CreateIndex
CREATE INDEX "CandidateInsight_createdAt_idx" ON "CandidateInsight"("createdAt");

-- AddForeignKey
ALTER TABLE "CandidateResume" ADD CONSTRAINT "CandidateResume_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInsight" ADD CONSTRAINT "CandidateInsight_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInsight" ADD CONSTRAINT "CandidateInsight_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CandidateResume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
