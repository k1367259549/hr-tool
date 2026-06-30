import { describe, expect, it } from "vitest";
import {
  LogValidationError,
  normalizeRecruitLogCreateInput
} from "@/utils/logValidation";

describe("log validation", () => {
  it("valid log input passes", () => {
    const normalizedInput = normalizeRecruitLogCreateInput({
      date: "2026-01-01",
      entryCount: 1,
      interviewCount: 3,
      offerCount: 2,
      phoneCount: 8,
      position: "Frontend Engineer",
      problems: "",
      reflection: "",
      resumeCount: 20,
      screenCount: 10,
      summary: "Normal recruiting day."
    });

    expect(normalizedInput.date).toBeInstanceOf(Date);
    expect(normalizedInput.resumeCount).toBe(20);
    expect(normalizedInput.position).toBe("Frontend Engineer");
  });

  it("negative numeric log input fails", () => {
    expect(() =>
      normalizeRecruitLogCreateInput({
        date: "2026-01-01",
        resumeCount: -1
      })
    ).toThrow(LogValidationError);
  });
});
