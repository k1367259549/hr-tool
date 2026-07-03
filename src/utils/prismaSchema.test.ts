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
        "20260702050000_add_resume_library_foundation",
        "migration.sql"
      ),
      "utf8"
    );

    expect(schema).toContain("enum ResumeIntakeSource");
    expect(schema).toContain("jobProfileId    String?");
    expect(schema).toContain(
      "jobProfile        JobProfile?              @relation(fields: [jobProfileId], references: [id], onDelete: SetNull)"
    );
    expect(schema).toContain("intakeSource    ResumeIntakeSource @default(CANDIDATE_UNDERSTANDING)");
    expect(schema).toContain("contentHash     String?");
    expect(schema).toContain("@@index([contentHash])");
    expect(schema).toContain("@@index([parsingStatus])");
    expect(schema).toContain("@@index([fileType])");
    expect(schema).toContain("@@index([intakeSource])");
    expect(schema).not.toContain("@@unique([contentHash])");
    expect(migration).toContain("CREATE TYPE \"ResumeIntakeSource\"");
    expect(migration).toContain('ALTER COLUMN "jobProfileId" DROP NOT NULL');
    expect(migration).toContain("ON DELETE SET NULL");
    expect(migration).toContain("CandidateResume_contentHash_idx");
  });

  it("keeps CandidateInsight as the legacy Candidate Understanding compatibility object", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

    expect(schema).toContain("model CandidateInsight");
    expect(schema).toContain("resumeId                      String    @unique");
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
