import { describe, expect, it } from "vitest";
import { validateJobUnderstandingAiOutput } from "@/ai/schemas/jobUnderstanding.schema";

describe("jobUnderstanding schema", () => {
  it("accepts valid structured job understanding output", () => {
    const result = validateJobUnderstandingAiOutput({
      coreResponsibilities: ["Build sourcing pipeline"],
      hiringFocus: ["Clarify must-have experience"],
      interviewFocus: ["Validate stakeholder communication"],
      jobSummary: "Recruiting role focused on fast pipeline building.",
      missingInformation: ["Team size"],
      potentialRisks: ["JD lacks seniority signal"],
      preferredCompetencies: ["ATS experience"],
      requiredCompetencies: ["Recruiting execution"],
      suggestedFollowUpQuestions: ["What is the target hiring timeline?"]
    });

    expect(result.jobSummary).toContain("Recruiting role");
    expect(result.coreResponsibilities).toHaveLength(1);
  });

  it("rejects score and classification fields", () => {
    expect(() =>
      validateJobUnderstandingAiOutput({
        classification: "HIGH_MATCH",
        coreResponsibilities: [],
        hiringFocus: [],
        interviewFocus: [],
        jobSummary: "Role summary",
        missingInformation: [],
        potentialRisks: [],
        preferredCompetencies: [],
        requiredCompetencies: [],
        score: 90,
        suggestedFollowUpQuestions: []
      })
    ).toThrow("AI 岗位理解输出不符合 schema。");
  });
});
