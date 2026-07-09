-- CreateEnum
CREATE TYPE "InterviewScheduleSyncStatus" AS ENUM ('PENDING', 'CALENDAR_CREATED', 'BITABLE_SYNCED', 'BITABLE_SYNC_FAILED', 'FAILED');

-- CreateTable
CREATE TABLE "InterviewScheduleSync" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "calendarEventId" TEXT,
    "feishuAppToken" TEXT NOT NULL,
    "feishuTableId" TEXT NOT NULL,
    "feishuRecordId" TEXT NOT NULL,
    "interviewerEmail" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "InterviewScheduleSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewScheduleSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewScheduleSync_candidateId_idx" ON "InterviewScheduleSync"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewScheduleSync_calendarEventId_idx" ON "InterviewScheduleSync"("calendarEventId");

-- CreateIndex
CREATE INDEX "InterviewScheduleSync_status_idx" ON "InterviewScheduleSync"("status");

-- CreateIndex
CREATE INDEX "InterviewScheduleSync_updatedAt_idx" ON "InterviewScheduleSync"("updatedAt");

-- AddForeignKey
ALTER TABLE "InterviewScheduleSync" ADD CONSTRAINT "InterviewScheduleSync_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
