import { describe, expect, it } from "vitest";
import { mapCriterionAssessmentsToAiReferences } from "@/lib/resume-screening/criterion-ai-reference";
import type { DetailedCriterionAssessment } from "@/types/resume-screening";
import type { EvaluationCriterion } from "@/types/evaluationTemplate";

const criteria: EvaluationCriterion[] = [
  {
    description: "Backend API delivery.",
    importance: "REQUIRED",
    key: "backend-api",
    label: "Backend API"
  },
  {
    description: "Workflow service experience.",
    importance: "PREFERRED",
    key: "workflow-experience",
    label: "Workflow Experience"
  }
];

describe("criterion AI reference mapper", () => {
  it("maps exact keys in template order and preserves assessment content", () => {
    const input = [assessment("workflow-experience", "Untrusted label", 72), assessment("backend-api", "Another label", 88)];
    const mapped = mapCriterionAssessmentsToAiReferences(criteria, input);

    expect(mapped).toMatchObject({ success: true });
    if (mapped.success) {
      expect(mapped.references.map((reference) => reference.criterionKey)).toEqual([
        "backend-api",
        "workflow-experience"
      ]);
      expect(mapped.references.map((reference) => reference.criterionLabel)).toEqual([
        "Backend API",
        "Workflow Experience"
      ]);
      expect(mapped.references[0]).toMatchObject({
        conclusion: "backend-api conclusion",
        score: 88,
        status: "AVAILABLE"
      });
    }
  });

  it.each([
    ["missing", [assessment("backend-api", "Backend API", 88)], "ASSESSMENT_CRITERION_KEY_MISSING"],
    ["unknown", [assessment("backend-api", "Backend API", 88), assessment("other-key", "Other", 70)], "ASSESSMENT_CRITERION_KEY_UNKNOWN"],
    ["duplicate", [assessment("backend-api", "Backend API", 88), assessment("backend-api", "Backend API", 70)], "ASSESSMENT_CRITERION_KEY_DUPLICATE"],
    ["underscore", [assessment("backend_api", "Backend API", 88), assessment("workflow-experience", "Workflow Experience", 70)], "ASSESSMENT_CRITERION_KEY_UNKNOWN"],
    ["case", [assessment("Backend-Api", "Backend API", 88), assessment("workflow-experience", "Workflow Experience", 70)], "ASSESSMENT_CRITERION_KEY_UNKNOWN"]
  ])("rejects %s keys without fuzzy matching", (_name, assessments, code) => {
    expect(mapCriterionAssessmentsToAiReferences(criteria, assessments)).toMatchObject({
      code,
      success: false
    });
  });

  it("rejects duplicate template keys", () => {
    expect(
      mapCriterionAssessmentsToAiReferences(
        [...criteria, { ...criteria[0]! }],
        [assessment("backend-api", "Backend API", 88), assessment("workflow-experience", "Workflow Experience", 70)]
      )
    ).toMatchObject({
      code: "TEMPLATE_CRITERION_KEY_DUPLICATE",
      success: false
    });
  });

  it("does not mutate inputs or derive values from dimensions, labels, or positions", () => {
    const input = [assessment("workflow-experience", "Same Label", 72), assessment("backend-api", "Same Label", 88)];
    const before = JSON.stringify({ criteria, input });

    const first = mapCriterionAssessmentsToAiReferences(criteria, input);
    const second = mapCriterionAssessmentsToAiReferences(criteria, input);

    expect(first).toEqual(second);
    expect(JSON.stringify({ criteria, input })).toBe(before);
  });
});

function assessment(
  criterionKey: string,
  criterionLabel: string,
  score: number
): DetailedCriterionAssessment {
  return {
    conclusion: `${criterionKey} conclusion`,
    criterionKey,
    criterionLabel,
    evidence: [
      {
        id: `ev_${criterionKey.replaceAll("-", "_")}`,
        relatedRequirement: null,
        source: "RESUME",
        text: `${criterionKey} resume evidence`
      }
    ],
    interviewQuestions: [`How did you apply ${criterionKey}?`],
    missingInformation: [`${criterionKey} missing information`],
    risks: [`${criterionKey} risk`],
    score
  };
}
