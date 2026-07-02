import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Prisma schema safeguards", () => {
  it("uses SetNull when CandidateResume Candidate relation is deleted", () => {
    const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

    expect(schema).toContain(
      "candidate  Candidate?        @relation(fields: [candidateId], references: [id], onDelete: SetNull)"
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
});
