-- CreateTable
CREATE TABLE "FeishuBitableRecordMapping" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "appToken" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "syncStatus" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeishuBitableRecordMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeishuBitableRecordMapping_candidateId_appToken_tableId_key" ON "FeishuBitableRecordMapping"("candidateId", "appToken", "tableId");

-- CreateIndex
CREATE INDEX "FeishuBitableRecordMapping_candidateId_idx" ON "FeishuBitableRecordMapping"("candidateId");

-- CreateIndex
CREATE INDEX "FeishuBitableRecordMapping_recordId_idx" ON "FeishuBitableRecordMapping"("recordId");

-- AddForeignKey
ALTER TABLE "FeishuBitableRecordMapping" ADD CONSTRAINT "FeishuBitableRecordMapping_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

