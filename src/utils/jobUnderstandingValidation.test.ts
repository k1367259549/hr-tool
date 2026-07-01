import { describe, expect, it } from "vitest";
import {
  parseJobProfileSavePayload,
  parseJobUnderstandingGeneratePayload
} from "@/utils/jobUnderstandingValidation";

describe("jobUnderstandingValidation", () => {
  it("parses valid generation input", () => {
    const result = parseJobUnderstandingGeneratePayload({
      jd: "Responsible for full-cycle recruiting.",
      jobTitle: "Recruiter",
      leaderRequirements: "Strong stakeholder communication."
    });

    expect(result.jobTitle).toBe("Recruiter");
    expect(result.leaderRequirements).toBe("Strong stakeholder communication.");
  });

  it("rejects missing required fields", () => {
    expect(() => parseJobUnderstandingGeneratePayload({ jobTitle: "Recruiter" })).toThrow(
      "jd 为必填项。"
    );
  });

  it("requires reviewed output when saving", () => {
    expect(() =>
      parseJobProfileSavePayload({
        jd: "Responsible for full-cycle recruiting.",
        jobTitle: "Recruiter",
        workflowId: "workflow-1"
      })
    ).toThrow("aiModel 为必填项。");
  });
});
