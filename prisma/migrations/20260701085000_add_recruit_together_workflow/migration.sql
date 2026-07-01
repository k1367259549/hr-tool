-- CreateTable
CREATE TABLE "RecruitTogetherWorkflow" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "jobProfileId" TEXT NOT NULL,
    "candidateInsightId" TEXT NOT NULL,
    "phonePreparation" JSONB NOT NULL,
    "phoneNotes" JSONB NOT NULL,
    "interviewPreparation" JSONB NOT NULL,
    "interviewNotes" JSONB NOT NULL,
    "recruiterSummary" JSONB NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "promptVersions" JSONB NOT NULL,
    "generationTimes" JSONB NOT NULL,
    "humanReview" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitTogetherWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruitTogetherWorkflow_workflowId_idx" ON "RecruitTogetherWorkflow"("workflowId");

-- CreateIndex
CREATE INDEX "RecruitTogetherWorkflow_jobProfileId_idx" ON "RecruitTogetherWorkflow"("jobProfileId");

-- CreateIndex
CREATE INDEX "RecruitTogetherWorkflow_candidateInsightId_idx" ON "RecruitTogetherWorkflow"("candidateInsightId");

-- CreateIndex
CREATE INDEX "RecruitTogetherWorkflow_createdAt_idx" ON "RecruitTogetherWorkflow"("createdAt");

-- AddForeignKey
ALTER TABLE "RecruitTogetherWorkflow" ADD CONSTRAINT "RecruitTogetherWorkflow_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitTogetherWorkflow" ADD CONSTRAINT "RecruitTogetherWorkflow_candidateInsightId_fkey" FOREIGN KEY ("candidateInsightId") REFERENCES "CandidateInsight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
