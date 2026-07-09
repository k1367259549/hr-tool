import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Prisma schema safeguards", () => {
  it("uses SetNull when CandidateResume Candidate relation is deleted", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

    expect(schema).toContain(
      "candidate         Candidate?               @relation(fields: [candidateId], references: [id], onDelete: SetNull)"
    );
  });

  it("keeps manual resume linking audit actions", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

    expect(schema).toContain("RESUME_LINKED");
    expect(schema).toContain("RESUME_UNLINKED");
  });

  it("keeps CandidateApplication stage ownership outside Candidate", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

    expect(schema).toContain("model CandidateApplication");
    expect(schema).toContain("applications CandidateApplication[]");
    expect(schema).not.toContain("currentPipelineStage");
    expect(schema).not.toContain("currentApplicationStatus");
  });

  it("keeps partial unique index for one active CandidateApplication per candidate and job", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260702040000_add_recruiting_pipeline_foundation",
        "migration.sql"
      ),
      "utf8"
    );

    expect(migration).toContain("CandidateApplication_active_candidate_job_unique");
    expect(migration).toContain('WHERE "closedAt" IS NULL');
  });

  it("keeps CandidateResume usable as an independent Resume Library record", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260704070000_task_061_resume_job_decoupling",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("jobProfileId    String?");
    expect(schema).toContain(
      "jobProfile        JobProfile?              @relation(fields: [jobProfileId], references: [id], onDelete: SetNull)"
    );
    expect(schema).toContain("intakeSource    String?");
    expect(schema).toContain("contentHash     String?");
    expect(schema).toContain("language        String?");
    expect(schema).toContain("parserVersion   String?");
    expect(schema).toContain("@@index([contentHash])");
    expect(schema).toContain("@@index([parsingStatus])");
    expect(schema).toContain("@@index([fileType])");
    expect(schema).toContain("@@index([intakeSource])");
    expect(schema).not.toContain("@@unique([contentHash])");
    expect(schema).not.toContain("enum ResumeIntakeSource");
    expect(migration).toContain('ADD COLUMN "language" TEXT');
    expect(migration).toContain('ADD COLUMN "parserVersion" TEXT');
    expect(migration).toContain('ALTER COLUMN "intakeSource" TYPE TEXT');
    expect(migration).toContain('ALTER COLUMN "intakeSource" DROP NOT NULL');
  });

  it("keeps CandidateInsight as the legacy Candidate Understanding compatibility object", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

    expect(schema).toContain("model CandidateInsight");
    expect(schema).toContain("resumeId                      String    @unique");
  });

  it("adds minimal ResumeRevision and ParsedSnapshot foundation without backfill", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260704090000_task_063_resume_revision_foundation",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("enum ResumeParsingStatus");
    expect(schema).toContain("model ResumeRevision");
    expect(schema).toContain("model ParsedSnapshot");
    expect(schema).toContain("revisions         ResumeRevision[]");
    expect(schema).toContain("@@unique([resumeId, revisionNumber])");
    expect(schema).toContain("revisionId     String   @unique");
    expect(schema).toMatch(
      /resume\s+CandidateResume\s+@relation\(fields: \[resumeId\], references: \[id\], onDelete: Cascade\)/
    );
    expect(schema).toMatch(
      /revision\s+ResumeRevision\s+@relation\(fields: \[revisionId\], references: \[id\], onDelete: Cascade\)/
    );
    expect(migration).toContain('CREATE TABLE "ResumeRevision"');
    expect(migration).toContain('CREATE TABLE "ParsedSnapshot"');
    expect(migration).toContain('CREATE UNIQUE INDEX "ResumeRevision_resumeId_revisionNumber_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX "ParsedSnapshot_revisionId_key"');
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toContain("ALTER COLUMN");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("adds ResumeEvaluationResult revision and snapshot refs without changing context uniqueness", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const evaluationResultModel = extractPrismaBlock(schema, "model ResumeEvaluationResult");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260704110000_m07_b1_evaluation_revision_snapshot_refs",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("resumeRevisionId  String?");
    expect(schema).toContain("parsedSnapshotId  String?");
    expect(schema).toMatch(
      /resumeRevision\s+ResumeRevision\?\s+@relation\("EvaluationResumeRevision", fields: \[resumeRevisionId\], references: \[id\], onDelete: SetNull\)/
    );
    expect(schema).toMatch(
      /parsedSnapshot\s+ParsedSnapshot\?\s+@relation\("EvaluationParsedSnapshot", fields: \[parsedSnapshotId\], references: \[id\], onDelete: SetNull\)/
    );
    expect(schema).toContain('resumeEvaluations ResumeEvaluationResult[] @relation("EvaluationResumeRevision")');
    expect(schema).toContain('resumeEvaluations ResumeEvaluationResult[] @relation("EvaluationParsedSnapshot")');
    expect(schema).toContain("@@index([resumeRevisionId])");
    expect(schema).toContain("@@index([parsedSnapshotId])");
    expect(schema).toContain(
      '@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion], name: "resumeEvaluationContext", map: "ResumeEvaluationResult_context_key")'
    );
    expect(evaluationResultModel).not.toContain("latestRunId");
    expect(evaluationResultModel).not.toContain("score");
    expect(evaluationResultModel).not.toContain("rating");
    expect(evaluationResultModel).not.toContain("modelProvider");
    expect(evaluationResultModel).not.toContain("promptVersion");

    expect(migration).toContain('ADD COLUMN "resumeRevisionId" TEXT');
    expect(migration).toContain('ADD COLUMN "parsedSnapshotId" TEXT');
    expect(migration).toContain('CREATE INDEX "ResumeEvaluationResult_resumeRevisionId_idx"');
    expect(migration).toContain('CREATE INDEX "ResumeEvaluationResult_parsedSnapshotId_idx"');
    expect(migration).toContain('REFERENCES "ResumeRevision"("id")');
    expect(migration).toContain('REFERENCES "ParsedSnapshot"("id")');
    expect(migration).toContain("ON DELETE SET NULL");
    expect(migration).not.toContain("ResumeEvaluationResult_context_key");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toContain("SET NOT NULL");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("adds EvaluationRun foundation without changing the evaluation master context key", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const evaluationResultModel = extractPrismaBlock(schema, "model ResumeEvaluationResult");
    const evaluationRunModel = extractPrismaBlock(schema, "model ResumeEvaluationRun");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260704130000_m07_b2_b_evaluation_run_foundation",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("enum ResumeEvaluationRunType");
    expect(schema).toContain("enum ResumeEvaluationRunStatus");
    expect(schema).toContain("MOCK");
    expect(schema).toContain("RULE_BASED");
    expect(schema).toContain("AI");
    expect(schema).toContain("PENDING");
    expect(schema).toContain("SUCCEEDED");
    expect(schema).toContain("FAILED");
    expect(schema).toContain("model ResumeEvaluationRun");
    expect(schema).toContain("runs            ResumeEvaluationRun[]");
    expect(schema).toContain("evaluationRuns                ResumeEvaluationRun[]");
    expect(evaluationRunModel).toContain("evaluationId");
    expect(evaluationRunModel).toContain("resumeRevisionId");
    expect(evaluationRunModel).toContain("parsedSnapshotId");
    expect(evaluationRunModel).toContain("rawOutputJson");
    expect(evaluationRunModel).toContain(
      'evaluation            ResumeEvaluationResult    @relation("EvaluationRuns", fields: [evaluationId], references: [id], onDelete: Restrict)'
    );
    expect(evaluationRunModel).toContain(
      "resumeRevision        ResumeRevision            @relation(fields: [resumeRevisionId], references: [id], onDelete: Restrict)"
    );
    expect(evaluationRunModel).toContain(
      "parsedSnapshot        ParsedSnapshot            @relation(fields: [parsedSnapshotId], references: [id], onDelete: Restrict)"
    );
    expect(evaluationRunModel).toContain("@@index([evaluationId])");
    expect(evaluationRunModel).toContain("@@index([resumeId])");
    expect(evaluationRunModel).toContain("@@index([resumeRevisionId])");
    expect(evaluationRunModel).toContain("@@index([parsedSnapshotId])");
    expect(evaluationRunModel).toContain("@@index([jobProfileId])");
    expect(evaluationRunModel).toContain("@@index([templateVersionId])");
    expect(evaluationRunModel).toContain("@@index([status])");
    expect(evaluationRunModel).toContain("@@index([runType])");
    expect(evaluationRunModel).toContain("@@index([createdAt])");
    expect(evaluationRunModel).toContain("@@index([evaluationId, status, createdAt])");
    expect(evaluationRunModel).not.toContain("@@unique");
    expect(evaluationResultModel).not.toContain("latestRunId");
    expect(evaluationResultModel).not.toContain("modelProvider");
    expect(evaluationResultModel).not.toContain("modelName");
    expect(evaluationResultModel).not.toContain("promptVersion");
    expect(evaluationResultModel).toContain(
      '@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion], name: "resumeEvaluationContext", map: "ResumeEvaluationResult_context_key")'
    );

    expect(migration).toContain('CREATE TYPE "ResumeEvaluationRunType"');
    expect(migration).toContain('CREATE TYPE "ResumeEvaluationRunStatus"');
    expect(migration).toContain('CREATE TABLE "ResumeEvaluationRun"');
    expect(migration).toContain('CREATE INDEX "ResumeEvaluationRun_evaluationId_idx"');
    expect(migration).toContain('CREATE INDEX "ResumeEvaluationRun_evaluationId_status_createdAt_idx"');
    expect(migration).toContain('REFERENCES "ResumeEvaluationResult"("id")');
    expect(migration).toContain('REFERENCES "ResumeRevision"("id")');
    expect(migration).toContain('REFERENCES "ParsedSnapshot"("id")');
    expect(migration).toContain("ON DELETE RESTRICT");
    expect(migration).not.toContain("ResumeEvaluationResult_context_key");
    expect(migration).not.toContain("selectedRunId");
    expect(migration).not.toContain("latestRunId");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toContain("SET NOT NULL");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("adds selectedRunId review-basis pointer with SetNull without changing run history", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const evaluationResultModel = extractPrismaBlock(schema, "model ResumeEvaluationResult");
    const evaluationRunModel = extractPrismaBlock(schema, "model ResumeEvaluationRun");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260704150000_m07_b2_e_b_selected_run_foundation",
        "migration.sql"
      ),
      "utf8"
    );

    expect(evaluationResultModel).toContain("selectedRunId     String?");
    expect(evaluationResultModel).toContain(
      'selectedRun     ResumeEvaluationRun?      @relation("SelectedEvaluationRun", fields: [selectedRunId], references: [id], onDelete: SetNull)'
    );
    expect(evaluationResultModel).toContain('runs            ResumeEvaluationRun[]     @relation("EvaluationRuns")');
    expect(evaluationResultModel).toContain("@@index([selectedRunId])");
    expect(evaluationResultModel).not.toContain("latestRunId");
    expect(evaluationResultModel).toContain(
      '@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion], name: "resumeEvaluationContext", map: "ResumeEvaluationResult_context_key")'
    );
    expect(evaluationRunModel).toContain(
      'selectedByEvaluations ResumeEvaluationResult[]  @relation("SelectedEvaluationRun")'
    );
    expect(evaluationRunModel).toContain(
      'evaluation            ResumeEvaluationResult    @relation("EvaluationRuns", fields: [evaluationId], references: [id], onDelete: Restrict)'
    );

    expect(migration).toContain('ADD COLUMN "selectedRunId" TEXT');
    expect(migration).toContain('CREATE INDEX "ResumeEvaluationResult_selectedRunId_idx"');
    expect(migration).toContain('REFERENCES "ResumeEvaluationRun"("id")');
    expect(migration).toContain("ON DELETE SET NULL");
    expect(migration).not.toContain("ResumeEvaluationResult_context_key");
    expect(migration).not.toContain("latestRunId");
    expect(migration).not.toContain("reviewerDecision");
    expect(migration).not.toContain("reviewerNotes");
    expect(migration).not.toContain("reviewedBy");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toContain("SET NOT NULL");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("adds reviewer decision binding with reviewedAt reuse and SetNull reviewedRunId", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const evaluationResultModel = extractPrismaBlock(schema, "model ResumeEvaluationResult");
    const evaluationRunModel = extractPrismaBlock(schema, "model ResumeEvaluationRun");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260704170000_m07_b2_f_b_reviewer_decision_binding",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("enum ResumeReviewerDecision");
    expect(schema).toContain("PASS");
    expect(schema).toContain("REJECT");
    expect(schema).toContain("HOLD");
    expect(schema).toContain("NEEDS_MORE_INFO");
    expect(evaluationResultModel).toContain("reviewedRunId     String?");
    expect(evaluationResultModel).toContain("reviewerDecision  ResumeReviewerDecision?");
    expect(evaluationResultModel).toContain("reviewerNotes     String?");
    expect(evaluationResultModel).toContain("reviewedAt        DateTime?");
    expect(evaluationResultModel).toContain("reviewedBy        String?");
    expect(evaluationResultModel).toContain(
      'reviewedRun     ResumeEvaluationRun?      @relation("ReviewedEvaluationRun", fields: [reviewedRunId], references: [id], onDelete: SetNull)'
    );
    expect(evaluationResultModel).toContain("@@index([reviewedRunId])");
    expect(evaluationResultModel).toContain(
      '@@unique([resumeId, jobProfileId, templateVersionId, jobProfileVersion], name: "resumeEvaluationContext", map: "ResumeEvaluationResult_context_key")'
    );
    expect(evaluationResultModel).not.toContain("latestRunId");
    expect(evaluationRunModel).toContain(
      'reviewedByEvaluations ResumeEvaluationResult[]  @relation("ReviewedEvaluationRun")'
    );
    expect(schema).not.toContain("model ReviewEvent");

    expect(migration).toContain('CREATE TYPE "ResumeReviewerDecision"');
    expect(migration).toContain('ADD COLUMN "reviewedRunId" TEXT');
    expect(migration).toContain('ADD COLUMN "reviewerDecision" "ResumeReviewerDecision"');
    expect(migration).toContain('ADD COLUMN "reviewerNotes" TEXT');
    expect(migration).toContain('ADD COLUMN "reviewedBy" TEXT');
    expect(migration).not.toContain('ADD COLUMN "reviewedAt"');
    expect(migration).toContain('CREATE INDEX "ResumeEvaluationResult_reviewedRunId_idx"');
    expect(migration).toContain('REFERENCES "ResumeEvaluationRun"("id")');
    expect(migration).toContain("ON DELETE SET NULL");
    expect(migration).not.toContain("ResumeEvaluationResult_context_key");
    expect(migration).not.toContain("latestRunId");
    expect(migration).not.toContain("ReviewEvent");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toContain("SET NOT NULL");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("adds Feishu Bitable record mapping without changing candidate lifecycle", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const mappingModel = extractPrismaBlock(schema, "model FeishuBitableRecordMapping");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260709110000_m10_a_feishu_bitable_record_mapping",
        "migration.sql"
      ),
      "utf8"
    );

    expect(mappingModel).toContain("candidateId  String");
    expect(mappingModel).toContain("appToken     String");
    expect(mappingModel).toContain("tableId      String");
    expect(mappingModel).toContain("recordId     String");
    expect(mappingModel).toContain("syncStatus   String?");
    expect(mappingModel).toContain("lastSyncedAt DateTime?");
    expect(mappingModel).toContain("lastError    String?");
    expect(mappingModel).toContain(
      "@@unique([candidateId, appToken, tableId], name: \"feishuBitableCandidateTableMapping\")"
    );
    expect(mappingModel).toContain("@@index([recordId])");
    expect(schema).toContain("feishuBitableRecordMappings FeishuBitableRecordMapping[]");
    expect(migration).toContain('CREATE TABLE "FeishuBitableRecordMapping"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "FeishuBitableRecordMapping_candidateId_appToken_tableId_key"'
    );
    expect(migration).toContain(
      'CREATE INDEX "FeishuBitableRecordMapping_recordId_idx"'
    );
    expect(migration).toContain('REFERENCES "Candidate"("id")');
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("adds InterviewScheduleSync for Feishu partial failure recovery without destructive changes", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const syncModel = extractPrismaBlock(schema, "model InterviewScheduleSync");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260709123000_m10_b_interview_schedule_sync",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("enum InterviewScheduleSyncStatus");
    expect(schema).toContain("BITABLE_SYNC_FAILED");
    expect(schema).toContain("BITABLE_SYNCED");
    expect(syncModel).toContain("candidateId       String");
    expect(syncModel).toContain("calendarEventId   String?");
    expect(syncModel).toContain("feishuAppToken    String");
    expect(syncModel).toContain("feishuTableId     String");
    expect(syncModel).toContain("feishuRecordId    String");
    expect(syncModel).toContain("retryCount        Int");
    expect(syncModel).toContain("@@index([calendarEventId])");
    expect(syncModel).toContain("@@index([status])");
    expect(schema).toContain("interviewScheduleSyncs InterviewScheduleSync[]");
    expect(migration).toContain('CREATE TYPE "InterviewScheduleSyncStatus"');
    expect(migration).toContain('CREATE TABLE "InterviewScheduleSync"');
    expect(migration).toContain('CREATE INDEX "InterviewScheduleSync_status_idx"');
    expect(migration).toContain('REFERENCES "Candidate"("id")');
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DROP COLUMN");
    expect(migration).not.toMatch(/^\s*UPDATE\s/im);
  });

  it("keeps Evaluation Template versioning and assignment constraints in the migration", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260703050000_add_evaluation_template_foundation",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("enum EvaluationTemplateStatus");
    expect(schema).toContain("enum EvaluationTemplateVersionStatus");
    expect(schema).toContain("model EvaluationTemplate");
    expect(schema).toContain("model EvaluationTemplateVersion");
    expect(schema).toContain("model JobProfileEvaluationAssignment");
    expect(schema).toContain("evaluationTemplateAssignments JobProfileEvaluationAssignment[]");
    expect(schema).toContain("@@unique([templateId, versionNumber])");
    expect(migration).toContain("EvaluationTemplateVersion_one_draft_per_template");
    expect(migration).toContain('WHERE "status" = \'DRAFT\'');
    expect(migration).toContain("JobProfileEvaluationAssignment_one_active_per_job_profile");
    expect(migration).toContain('WHERE "endedAt" IS NULL');
    expect(migration).toContain("ON DELETE RESTRICT");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("CandidateInsight");
    expect(migration).not.toContain("CandidateResume");
    expect(migration).not.toContain("CandidateApplication");
  });
});

function extractPrismaBlock(schema: string, blockStart: string): string {
  const start = schema.indexOf(blockStart);

  if (start === -1) {
    return "";
  }

  const nextBlock = schema.indexOf("\nmodel ", start + blockStart.length);
  const nextEnum = schema.indexOf("\nenum ", start + blockStart.length);
  const candidates = [nextBlock, nextEnum].filter((index) => index > start);
  const end = candidates.length > 0 ? Math.min(...candidates) : schema.length;

  return schema.slice(start, end);
}
