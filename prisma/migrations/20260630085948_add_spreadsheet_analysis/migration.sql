-- CreateTable
CREATE TABLE "UploadedSpreadsheet" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "rowCount" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedSpreadsheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpreadsheetAnalysis" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "insights" TEXT NOT NULL,
    "problems" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "rawJson" JSONB,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpreadsheetAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadedSpreadsheet_createdAt_idx" ON "UploadedSpreadsheet"("createdAt");

-- CreateIndex
CREATE INDEX "UploadedSpreadsheet_status_idx" ON "UploadedSpreadsheet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SpreadsheetAnalysis_uploadId_key" ON "SpreadsheetAnalysis"("uploadId");

-- CreateIndex
CREATE INDEX "SpreadsheetAnalysis_createdAt_idx" ON "SpreadsheetAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "SpreadsheetAnalysis" ADD CONSTRAINT "SpreadsheetAnalysis_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "UploadedSpreadsheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
