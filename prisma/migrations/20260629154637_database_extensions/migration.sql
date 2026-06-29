-- AlterTable
ALTER TABLE "RecruitLog" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "roleType" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "AIRequestLog" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIRequestLog_feature_idx" ON "AIRequestLog"("feature");

-- CreateIndex
CREATE INDEX "AIRequestLog_createdAt_idx" ON "AIRequestLog"("createdAt");
