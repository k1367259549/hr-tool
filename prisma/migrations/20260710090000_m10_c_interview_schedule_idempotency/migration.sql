-- AlterTable
ALTER TABLE "InterviewScheduleSync" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InterviewScheduleSync_idempotencyKey_key" ON "InterviewScheduleSync"("idempotencyKey");
