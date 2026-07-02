CREATE TYPE "CandidateStatus" AS ENUM ('ACTIVE', 'TALENT_POOL', 'ARCHIVED');

CREATE TYPE "CandidateAuditAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED');

CREATE TABLE "Candidate" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "currentCompany" TEXT,
  "currentTitle" TEXT,
  "targetRoles" TEXT[],
  "sourceChannel" TEXT,
  "owner" TEXT,
  "tags" TEXT[],
  "notes" TEXT,
  "status" "CandidateStatus" NOT NULL DEFAULT 'ACTIVE',
  "latestActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateAudit" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "action" "CandidateAuditAction" NOT NULL,
  "actor" TEXT NOT NULL,
  "beforeValue" JSONB,
  "afterValue" JSONB,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CandidateAudit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CandidateResume" ADD COLUMN "candidateId" TEXT;

CREATE INDEX "Candidate_fullName_idx" ON "Candidate"("fullName");
CREATE INDEX "Candidate_status_idx" ON "Candidate"("status");
CREATE INDEX "Candidate_sourceChannel_idx" ON "Candidate"("sourceChannel");
CREATE INDEX "Candidate_owner_idx" ON "Candidate"("owner");
CREATE INDEX "Candidate_latestActivityAt_idx" ON "Candidate"("latestActivityAt");
CREATE INDEX "Candidate_createdAt_idx" ON "Candidate"("createdAt");

CREATE INDEX "CandidateAudit_candidateId_idx" ON "CandidateAudit"("candidateId");
CREATE INDEX "CandidateAudit_action_idx" ON "CandidateAudit"("action");
CREATE INDEX "CandidateAudit_createdAt_idx" ON "CandidateAudit"("createdAt");

CREATE INDEX "CandidateResume_candidateId_idx" ON "CandidateResume"("candidateId");

ALTER TABLE "CandidateResume" ADD CONSTRAINT "CandidateResume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateAudit" ADD CONSTRAINT "CandidateAudit_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
