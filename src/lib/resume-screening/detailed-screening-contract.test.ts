import { describe, expect, it } from "vitest";
import {
  adaptDetailedScreeningResultToLegacyEvaluationResult,
  resolveDetailedScreeningResult
} from "@/lib/resume-screening/detailed-screening-contract";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { DetailedScreeningResult } from "@/types/resume-screening";

describe("detailed screening contract", () => {
  it("accepts a complete canonical Chinese detailed screening result", () => {
    const result = createDetailedResult({
      summary:
        "候选人简历中明确提到 TypeScript 后端 API 项目，与岗位中后端服务开发和接口设计要求存在直接对应关系。仍需人工确认项目所有权、协作方式、到岗时间、实习周期和每周出勤情况，本结果只作为详细分析草稿，不代表自动录用或拒绝。"
    });

    const resolved = resolveDetailedScreeningResult(result);

    expect(resolved).toEqual({
      result,
      source: "canonical",
      success: true
    });
  });

  it("accepts a complete canonical English detailed screening result", () => {
    const result = createDetailedResult({
      summary:
        "The resume explicitly mentions TypeScript backend API work, which maps to the job description's backend service and API design expectations. Recruiter review is still required to confirm ownership depth, collaboration context, start date, internship duration, and weekly availability before any human hiring decision is made."
    });

    const resolved = resolveDetailedScreeningResult(result);

    expect(resolved).toMatchObject({
      result,
      source: "canonical",
      success: true
    });
  });

  it("rejects canonical results with undeclared core fields", () => {
    const resolved = resolveDetailedScreeningResult({
      ...createDetailedResult(),
      rawProviderResponse: "not part of the contract"
    });

    expect(resolved).toMatchObject({
      code: "SCHEMA_VALIDATION_FAILED",
      success: false
    });
  });

  it("converts compatible legacy output without changing score semantics", () => {
    const legacy = createLegacyResult({
      overallScore: 64,
      recommendation: "UNCERTAIN"
    });

    const resolved = resolveDetailedScreeningResult(legacy);

    expect(resolved.success).toBe(true);

    if (resolved.success) {
      expect(resolved.source).toBe("legacy");
      expect(resolved.result.overallScore).toBe(64);
      expect(resolved.result.recommendation).toBe("MANUAL_REVIEW");
      expect(resolved.result.evidence[0]?.text).toBe(
        "Resume mentions TypeScript backend APIs."
      );
    }
  });

  it("returns a controlled error for legacy output without traceable evidence", () => {
    const resolved = resolveDetailedScreeningResult(
      createLegacyResult({
        dimensionScores: [],
        evidence: []
      })
    );

    expect(resolved).toMatchObject({
      code: "INCOMPATIBLE_LEGACY_RESULT",
      success: false
    });
  });

  it("does not infer legacy recommendation from canonical score", () => {
    const detailed = createDetailedResult({
      overallScore: 96,
      recommendation: "NOT_ENOUGH_EVIDENCE"
    });

    const legacy = adaptDetailedScreeningResultToLegacyEvaluationResult(detailed);

    expect(legacy.overallScore).toBe(96);
    expect(legacy.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
  });
});

function createDetailedResult(
  overrides: Partial<DetailedScreeningResult> = {}
): DetailedScreeningResult {
  return {
    dimensions: [
      {
        conclusion:
          "Resume evidence maps to the backend API requirement but ownership depth needs confirmation.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Backend API experience",
            source: "RESUME",
            text: "Resume mentions TypeScript backend APIs."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: ["Availability is not visible."],
        name: "Job match",
        risks: ["Ownership depth is not explicit."],
        score: 82
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relatedRequirement: "Backend API experience",
        source: "RESUME",
        text: "Resume mentions TypeScript backend APIs."
      },
      {
        id: "ev_missing_availability",
        relatedRequirement: "Internship availability",
        source: "MISSING_INFORMATION",
        text: "Start date and weekly availability are not stated."
      }
    ],
    interviewQuestions: [
      "Please describe your most relevant backend API project.",
      "What was your direct ownership in the API design?",
      "Which TypeScript tools did you use?",
      "How do you understand this backend role?",
      "What is your start date, internship duration, and weekly availability?"
    ],
    missingInformation: ["Start date and weekly availability are not stated."],
    nextStep: "Recruiter should manually confirm ownership depth and availability.",
    notes: null,
    overallScore: 82,
    recommendation: "PROCEED_TO_NEXT_STEP",
    risks: [
      {
        description: "Start date and weekly availability are not stated.",
        severity: "medium",
        title: "Availability missing"
      }
    ],
    schemaVersion: "m11-a.detailed.v1",
    screeningMode: "DETAILED",
    strengths: [
      "Resume mentions TypeScript backend APIs that relate to the JD.",
      "The project context is relevant enough for recruiter follow-up."
    ],
    summary:
      "The candidate has relevant TypeScript backend API evidence for the current job description, while availability and ownership depth still need recruiter confirmation.",
    weaknesses: [
      "Ownership depth is not explicit.",
      "Availability information is missing."
    ],
    ...overrides
  };
}

function createLegacyResult(
  overrides: Partial<ResumeEvaluationResult> = {}
): ResumeEvaluationResult {
  return {
    confidence: "MEDIUM",
    dimensionScores: [
      {
        evidenceIds: ["ev_backend_api"],
        key: "job-match",
        label: "Job match",
        rationale: "Resume evidence maps to the backend API requirement.",
        score: 64
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Resume mentions TypeScript backend APIs."
      }
    ],
    interviewQuestions: [
      {
        category: "EXPERIENCE",
        evidenceIds: ["ev_backend_api"],
        purpose: "Confirm ownership depth.",
        question: "Please describe your backend API project."
      }
    ],
    notes: null,
    overallScore: 64,
    overallSummary:
      "Legacy detailed result has enough evidence to be safely adapted to the canonical detailed screening result contract.",
    recommendation: "UNCERTAIN",
    risks: [
      {
        description: "Availability is not stated.",
        evidenceIds: ["ev_backend_api"],
        severity: "MEDIUM",
        type: "MISSING_REQUIREMENT"
      }
    ],
    schemaVersion: "m07-b3-a.v1",
    strengths: [
      {
        description: "Resume mentions TypeScript backend APIs.",
        evidenceIds: ["ev_backend_api"],
        title: "Backend API evidence"
      }
    ],
    weaknesses: [
      {
        description: "Ownership depth is not explicit.",
        evidenceIds: ["ev_backend_api"],
        severity: "MEDIUM",
        title: "Ownership depth unclear"
      }
    ],
    ...overrides
  };
}
