import { describe, expect, it } from "vitest";
import { ResumeEvaluationSchema } from "@/lib/evaluation/schema";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

function createValidEvaluationOutput(
  overrides?: Partial<ResumeEvaluationResult>
): ResumeEvaluationResult {
  return {
    confidence: "HIGH",
    dimensionScores: [
      {
        evidenceIds: ["ev_backend_api"],
        key: "backend-api",
        label: "Backend API",
        rationale: "The resume describes building production APIs.",
        score: 88
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Built and maintained Node.js backend APIs for recruiting systems."
      }
    ],
    interviewQuestions: [
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_backend_api"],
        purpose: "Validate depth of backend API ownership.",
        question: "Which API design trade-offs did you own in that project?"
      }
    ],
    notes: null,
    overallScore: 82,
    overallSummary:
      "The candidate shows relevant backend API experience with direct evidence.",
    recommendation: "POTENTIAL_FIT",
    risks: [
      {
        description: "Cloud operations ownership is not explicit in the resume.",
        evidenceIds: ["ev_backend_api"],
        severity: "LOW",
        type: "OTHER"
      }
    ],
    schemaVersion: "m07-b3-a.v1",
    strengths: [
      {
        description: "Direct production API delivery experience is present.",
        evidenceIds: ["ev_backend_api"],
        title: "Backend API experience"
      }
    ],
    weaknesses: [
      {
        description: "The resume does not clearly describe system scale.",
        evidenceIds: ["ev_backend_api"],
        severity: "LOW",
        title: "Scale evidence"
      }
    ],
    ...overrides
  };
}

describe("ResumeEvaluationSchema", () => {
  it("accepts a valid unified evaluation output object", () => {
    const result = ResumeEvaluationSchema.safeParse(createValidEvaluationOutput());

    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const payload = createValidEvaluationOutput() as Record<string, unknown>;

    delete payload.overallSummary;

    const result = ResumeEvaluationSchema.safeParse(payload);

    expect(result.success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    const result = ResumeEvaluationSchema.safeParse(
      createValidEvaluationOutput({
        recommendation: "AUTO_HIRE" as never
      })
    );

    expect(result.success).toBe(false);
  });

  it("rejects score values outside the allowed range", () => {
    const overallResult = ResumeEvaluationSchema.safeParse(
      createValidEvaluationOutput({
        overallScore: 101
      })
    );
    const dimensionResult = ResumeEvaluationSchema.safeParse(
      createValidEvaluationOutput({
        dimensionScores: [
          {
            evidenceIds: ["ev_backend_api"],
            key: "backend-api",
            label: "Backend API",
            rationale: "The resume describes building production APIs.",
            score: -1
          }
        ]
      })
    );

    expect(overallResult.success).toBe(false);
    expect(dimensionResult.success).toBe(false);
  });
});
