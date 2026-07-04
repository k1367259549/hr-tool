import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateResumeContentHash } from "@/utils/resumeContentHash";

describe("generateResumeContentHash", () => {
  it("generates a SHA-256 hash from resume text", () => {
    const text = "Experienced recruiter";

    expect(generateResumeContentHash(text)).toBe(
      createHash("sha256").update(text, "utf8").digest("hex")
    );
  });

  it("normalizes Windows and Unix line endings before hashing", () => {
    expect(generateResumeContentHash("line one\r\nline two\rline three")).toBe(
      generateResumeContentHash("line one\nline two\nline three")
    );
  });

  it("trims surrounding whitespace before hashing", () => {
    expect(generateResumeContentHash("  resume content\n")).toBe(
      generateResumeContentHash("resume content")
    );
  });

  it("returns null for empty or unavailable text", () => {
    expect(generateResumeContentHash("")).toBeNull();
    expect(generateResumeContentHash("  \r\n\t ")).toBeNull();
    expect(generateResumeContentHash(null)).toBeNull();
    expect(generateResumeContentHash(undefined)).toBeNull();
  });
});
