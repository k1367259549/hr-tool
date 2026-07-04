CREATE TYPE "ResumeParsingStatus" AS ENUM ('PARSED', 'FAILED');

CREATE TABLE "ResumeRevision" (
  "id" TEXT NOT NULL,
  "resumeId" TEXT NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "contentHash" TEXT,
  "source" TEXT,
  "sourceFileName" TEXT,
  "parserVersion" TEXT,
  "parseStatus" "ResumeParsingStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ResumeRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParsedSnapshot" (
  "id" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "parsedText" TEXT,
  "structuredData" JSONB,
  "chunkCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ParsedSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResumeRevision_resumeId_revisionNumber_key" ON "ResumeRevision"("resumeId", "revisionNumber");
CREATE INDEX "ResumeRevision_resumeId_idx" ON "ResumeRevision"("resumeId");
CREATE INDEX "ResumeRevision_contentHash_idx" ON "ResumeRevision"("contentHash");
CREATE INDEX "ResumeRevision_createdAt_idx" ON "ResumeRevision"("createdAt");

CREATE UNIQUE INDEX "ParsedSnapshot_revisionId_key" ON "ParsedSnapshot"("revisionId");
CREATE INDEX "ParsedSnapshot_createdAt_idx" ON "ParsedSnapshot"("createdAt");

ALTER TABLE "ResumeRevision"
ADD CONSTRAINT "ResumeRevision_resumeId_fkey"
FOREIGN KEY ("resumeId") REFERENCES "CandidateResume"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParsedSnapshot"
ADD CONSTRAINT "ParsedSnapshot_revisionId_fkey"
FOREIGN KEY ("revisionId") REFERENCES "ResumeRevision"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
