-- CreateEnum
CREATE TYPE "ResumeIntakeSource" AS ENUM ('RESUME_LIBRARY', 'CANDIDATE_UNDERSTANDING');

-- AlterTable
ALTER TABLE "CandidateResume"
ADD COLUMN "intakeSource" "ResumeIntakeSource" NOT NULL DEFAULT 'CANDIDATE_UNDERSTANDING',
ADD COLUMN "contentHash" TEXT,
ALTER COLUMN "jobProfileId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "CandidateResume" DROP CONSTRAINT "CandidateResume_jobProfileId_fkey";

-- AddForeignKey
ALTER TABLE "CandidateResume" ADD CONSTRAINT "CandidateResume_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CandidateResume_contentHash_idx" ON "CandidateResume"("contentHash");

-- CreateIndex
CREATE INDEX "CandidateResume_parsingStatus_idx" ON "CandidateResume"("parsingStatus");

-- CreateIndex
CREATE INDEX "CandidateResume_fileType_idx" ON "CandidateResume"("fileType");

-- CreateIndex
CREATE INDEX "CandidateResume_intakeSource_idx" ON "CandidateResume"("intakeSource");
