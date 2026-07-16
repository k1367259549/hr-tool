import { describe, expect, it } from "vitest";
import { validateAndNormalizeDetailedCriterionAssessments } from "@/lib/resume-screening/detailed-criterion-contract";
import type { EvaluationCriterion } from "@/types/evaluationTemplate";
import type { DetailedScreeningResultV2 } from "@/types/resume-screening";

const criteria: EvaluationCriterion[] = [
  { description: "Backend APIs", importance: "REQUIRED", key: "backend-api", label: "Backend API" },
  { description: "Motion control", importance: "PREFERRED", key: "motion-control", label: "Motion Control" }
];

describe("detailed criterion contract", () => {
  it("matches exact keys and normalizes only to template order and labels", () => {
    const input = result([assessment("motion-control", "Wrong label"), assessment("backend-api", "Other")]);
    const validated = validateAndNormalizeDetailedCriterionAssessments(criteria, input);

    expect(validated).toMatchObject({ success: true });
    if (validated.success) {
      expect(validated.result.criterionAssessments.map((item) => item.criterionKey)).toEqual([
        "backend-api", "motion-control"
      ]);
      expect(validated.result.criterionAssessments.map((item) => item.criterionLabel)).toEqual([
        "Backend API", "Motion Control"
      ]);
      expect(validated.result.overallScore).toBe(81);
      expect(validated.result.recommendation).toBe("MANUAL_REVIEW");
    }
  });

  it.each([
    ["missing", result([assessment("backend-api", "Backend API")]), "DETAILED_CRITERION_KEY_MISSING"],
    ["unknown", result([assessment("backend-api", "Backend API"), assessment("unknown-key", "Unknown")]), "DETAILED_CRITERION_KEY_UNKNOWN"],
    ["duplicate", result([assessment("backend-api", "Backend API"), assessment("backend-api", "Backend API")]), "DETAILED_CRITERION_KEY_DUPLICATE"],
    ["underscore", result([assessment("backend_api", "Backend API"), assessment("motion-control", "Motion Control")]), "DETAILED_CRITERION_KEY_UNKNOWN"],
    ["case", result([assessment("Backend-Api", "Backend API"), assessment("motion-control", "Motion Control")]), "DETAILED_CRITERION_KEY_UNKNOWN"]
  ])("rejects %s key mismatch without fuzzy matching", (_name, input, code) => {
    expect(validateAndNormalizeDetailedCriterionAssessments(criteria, input)).toMatchObject({
      code,
      success: false
    });
  });

  it("rejects duplicate input criteria and does not mutate either input", () => {
    const duplicated = [...criteria, { ...criteria[0]! }];
    const input = result([assessment("backend-api", "Backend API"), assessment("motion-control", "Motion Control")]);
    const before = JSON.stringify({ duplicated, input });

    expect(validateAndNormalizeDetailedCriterionAssessments(duplicated, input)).toMatchObject({
      code: "EVALUATION_CRITERIA_INVALID",
      success: false
    });
    expect(JSON.stringify({ duplicated, input })).toBe(before);
  });

  it("is deterministic and leaves the source result unchanged", () => {
    const input = result([assessment("motion-control", "Untrusted label"), assessment("backend-api", "Untrusted label")]);
    const before = JSON.stringify(input);
    const first = validateAndNormalizeDetailedCriterionAssessments(criteria, input);
    const second = validateAndNormalizeDetailedCriterionAssessments(criteria, input);

    expect(first).toEqual(second);
    expect(JSON.stringify(input)).toBe(before);
    if (first.success) {
      expect(first.result.criterionAssessments[0]?.evidence).toEqual(input.criterionAssessments[1]?.evidence);
      expect(first.result.criterionAssessments[0]?.score).toBe(input.criterionAssessments[1]?.score);
    }
  });
});

function assessment(criterionKey: string, criterionLabel: string) {
  return { conclusion: "Relevant evidence requires recruiter review.", criterionKey, criterionLabel, evidence: [{ id: "ev_1", relatedRequirement: null, source: "RESUME" as const, text: "Built related services." }], interviewQuestions: [], missingInformation: [], risks: [], score: 81 };
}

function result(criterionAssessments: ReturnType<typeof assessment>[]): DetailedScreeningResultV2 {
  return { contractVersion: "detailed-screening.v2", criterionAssessments, dimensions: [{ conclusion: "Overall job match signal.", evidence: [{ id: "ev_1", relatedRequirement: null, source: "RESUME", text: "Built related services." }], key: "job_match", matchLevel: "high", missingInformation: [], name: "Job match", risks: [], score: 81 }], evidence: [{ id: "ev_1", relatedRequirement: null, source: "RESUME", text: "Built related services." }], interviewQuestions: [], missingInformation: [], nextStep: "Recruiter should confirm evidence.", notes: null, overallScore: 81, recommendation: "MANUAL_REVIEW", risks: [], schemaVersion: "m11-a.detailed.v2", screeningMode: "DETAILED", strengths: [], summary: "Relevant evidence is present and requires recruiter confirmation.", weaknesses: [] };
}
