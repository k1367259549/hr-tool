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
});
