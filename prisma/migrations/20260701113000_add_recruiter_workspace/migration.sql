CREATE TABLE "RecruiterWorkspaceNote" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "searchableText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterWorkspaceNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruiterWorkspaceScheduleItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "itemType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT,
    "relatedName" TEXT,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterWorkspaceScheduleItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecruiterWorkspaceNote_date_idx" ON "RecruiterWorkspaceNote"("date");
CREATE INDEX "RecruiterWorkspaceNote_createdAt_idx" ON "RecruiterWorkspaceNote"("createdAt");
CREATE INDEX "RecruiterWorkspaceScheduleItem_date_idx" ON "RecruiterWorkspaceScheduleItem"("date");
CREATE INDEX "RecruiterWorkspaceScheduleItem_itemType_idx" ON "RecruiterWorkspaceScheduleItem"("itemType");
CREATE INDEX "RecruiterWorkspaceScheduleItem_createdAt_idx" ON "RecruiterWorkspaceScheduleItem"("createdAt");
