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
    expect(schema).not.toContain("model EvaluationRun");
    expect(schema).not.toContain("model EvaluationPromptRun");
    expect(schema).not.toContain("score             Int?");
    expect(schema).not.toContain("rating            String?");
    expect(schema).not.toContain("modelProvider");
    expect(schema).not.toContain("promptVersion     String?");

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
