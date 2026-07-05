import { describe, expect, it } from "vitest";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
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
    risks: [],
    schemaVersion: "m07-b3-a.v1",
    strengths: [],
    weaknesses: [],
    ...overrides
  };
}

describe("bindEvaluationRunOutput", () => {
  it("binds a standard ResumeEvaluationResult", () => {
    const result = bindEvaluationRunOutput(createValidEvaluationOutput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output).toEqual(createValidEvaluationOutput());
      expect(ResumeEvaluationSchema.safeParse(result.output).success).toBe(true);
    }
  });

  it("binds non-standard normalizable input", () => {
    const result = bindEvaluationRunOutput({
      confidence: " medium ",
      dimensionScores: [
        {
          evidenceIds: [" ev_backend_api "],
          key: "Backend API",
          label: " Backend API ",
          rationale: " Shows production API work. ",
          score: 76.4
        }
      ],
      evidence: [
        {
          id: " ev_backend_api ",
          relevance: " high ",
          source: " resume ",
          text: " Built APIs. "
        }
      ],
      interviewQuestions: [
        {
          category: " technical ",
          evidenceIds: ["ev_backend_api"],
          purpose: " Validate ownership. ",
          question: " What trade-offs did you make? "
        }
      ],
      overallScore: 79.6,
      overallSummary: " Candidate has relevant backend evidence. ",
      recommendation: "potential fit"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output).toMatchObject({
        confidence: "MEDIUM",
        overallScore: 80,
        overallSummary: "Candidate has relevant backend evidence.",
        recommendation: "POTENTIAL_FIT"
      });
      expect(result.output.dimensionScores[0]).toMatchObject({
        evidenceIds: ["ev_backend_api"],
        key: "backend-api",
        score: 76
      });
      expect(ResumeEvaluationSchema.safeParse(result.output).success).toBe(true);
    }
  });

  it("fails binding when recommendation is unsafe", () => {
    const result = bindEvaluationRunOutput(
      createValidEvaluationOutput({
        recommendation: "AUTO_HIRE" as never
      })
    );

    expect(result).toEqual({
      success: false,
      error: "Unsupported recommendation value."
    });
  });

  it("uses normalizer score clamping behavior before final schema validation", () => {
    const result = bindEvaluationRunOutput(
      createValidEvaluationOutput({
        dimensionScores: [
          {
            evidenceIds: ["ev_backend_api"],
            key: "backend-api",
            label: "Backend API",
            rationale: "The resume describes building production APIs.",
            score: -20
          }
        ],
        overallScore: 120
      })
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output.overallScore).toBe(100);
      expect(result.output.dimensionScores[0]?.score).toBe(0);
      expect(ResumeEvaluationSchema.safeParse(result.output).success).toBe(true);
    }
  });
});
