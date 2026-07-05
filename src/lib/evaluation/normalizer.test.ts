import { describe, expect, it } from "vitest";
import { normalizeResumeEvaluationResult } from "@/lib/evaluation/normalizer";
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

describe("normalizeResumeEvaluationResult", () => {
  it("passes through a standard object and validates it against ResumeEvaluationSchema", () => {
    const result = normalizeResumeEvaluationResult(createValidEvaluationOutput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(createValidEvaluationOutput());
      expect(ResumeEvaluationSchema.safeParse(result.data).success).toBe(true);
    }
  });

  it("cleans extra fields by constructing a strict schema-compatible output", () => {
    const result = normalizeResumeEvaluationResult({
      ...createValidEvaluationOutput(),
      autoHire: true,
      ranking: 1,
      evidence: [
        {
          extra: "removed",
          id: " ev_backend_api ",
          relevance: " high ",
          source: " resume ",
          text: " Built APIs. "
        }
      ]
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("autoHire");
      expect(result.data).not.toHaveProperty("ranking");
      expect(result.data.evidence[0]).toEqual({
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Built APIs."
      });
      expect(ResumeEvaluationSchema.safeParse(result.data).success).toBe(true);
    }
  });

  it("fills defaults for optional-normalizable missing fields", () => {
    const result = normalizeResumeEvaluationResult({
      evidence: [
        {
          id: "ev_1",
          text: "Candidate has backend experience."
        }
      ],
      overallSummary: " Needs more structured evaluation. "
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toMatchObject({
        confidence: "LOW",
        notes: null,
        overallScore: 0,
        overallSummary: "Needs more structured evaluation.",
        recommendation: "NOT_ENOUGH_EVIDENCE",
        schemaVersion: "m07-b3-a.v1"
      });
      expect(result.data.dimensionScores).toHaveLength(1);
      expect(result.data.interviewQuestions).toHaveLength(1);
      expect(ResumeEvaluationSchema.safeParse(result.data).success).toBe(true);
    }
  });

  it("maps recognizable recommendation aliases and rejects unsafe values", () => {
    const mapped = normalizeResumeEvaluationResult(
      createValidEvaluationOutput({
        recommendation: "needs review" as never
      })
    );
    const rejected = normalizeResumeEvaluationResult(
      createValidEvaluationOutput({
        recommendation: "AUTO_HIRE" as never
      })
    );

    expect(mapped.success).toBe(true);

    if (mapped.success) {
      expect(mapped.data.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
    }

    expect(rejected).toEqual({
      success: false,
      error: "Unsupported recommendation value."
    });
  });

  it("clamps score values to the schema range and rounds decimals", () => {
    const result = normalizeResumeEvaluationResult(
      createValidEvaluationOutput({
        dimensionScores: [
          {
            evidenceIds: ["ev_backend_api"],
            key: "backend-api",
            label: "Backend API",
            rationale: "The resume describes building production APIs.",
            score: -10
          }
        ],
        overallScore: 101.7
      })
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.overallScore).toBe(100);
      expect(result.data.dimensionScores[0]?.score).toBe(0);
      expect(ResumeEvaluationSchema.safeParse(result.data).success).toBe(true);
    }
  });
});
