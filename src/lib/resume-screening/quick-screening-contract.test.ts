import { describe, expect, it } from "vitest";
import {
  quickScreeningRecommendationLabels,
  resolveQuickScreeningResult,
  toQuickScreeningCompatibilityFields
} from "@/lib/resume-screening/quick-screening-contract";
import { QuickScreeningResultSchema } from "@/lib/resume-screening/schema";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { QuickScreeningResult } from "@/types/resume-screening";

describe("quick screening contract adapter", () => {
  it("accepts a canonical QuickScreeningResult without remapping", () => {
    const resolved = resolveQuickScreeningResult(canonicalQuickScreeningResult);

    expect(resolved.success).toBe(true);

    if (resolved.success) {
      expect(resolved.source).toBe("canonical");
      expect(resolved.result).toEqual(canonicalQuickScreeningResult);
      expect(QuickScreeningResultSchema.safeParse(resolved.result).success).toBe(true);
    }
  });

  it("projects compatibility fields from the canonical result", () => {
    const fields = toQuickScreeningCompatibilityFields(canonicalQuickScreeningResult);

    expect(fields.recommendation).toBe(canonicalQuickScreeningResult.recommendation);
    expect(fields.score).toBe(canonicalQuickScreeningResult.overallScore);
    expect(fields.summary).toBe(canonicalQuickScreeningResult.summary);
    expect(fields.evidence).toEqual(
      canonicalQuickScreeningResult.evidence.map((item) => item.text)
    );
  });

  it("converts a safe legacy ResumeEvaluationResult into canonical shape", () => {
    const resolved = resolveQuickScreeningResult(legacyEvaluationResult);

    expect(resolved.success).toBe(true);

    if (resolved.success) {
      expect(resolved.source).toBe("legacy");
      expect(resolved.result.recommendation).toBe("MANUAL_REVIEW");
      expect(resolved.result.overallScore).toBe(52);
      expect(resolved.result.dimensions[0]?.key).toBe("job_match");
      expect(resolved.result.evidence[0]?.source).toBe("RESUME");
      expect(QuickScreeningResultSchema.safeParse(resolved.result).success).toBe(true);
    }
  });

  it("returns a controlled status for damaged or incomplete historical data", () => {
    const damaged = resolveQuickScreeningResult({ score: 80 });
    const incompleteLegacy = resolveQuickScreeningResult({
      ...legacyEvaluationResult,
      evidence: []
    });

    expect(damaged).toEqual({
      code: "INVALID_QUICK_SCREENING_RESULT",
      message: "快速初筛结果格式无法识别，需要重新运行快速初筛。",
      success: false
    });
    expect(incompleteLegacy).toEqual({
      code: "UNSUPPORTED_LEGACY_RESULT",
      message: "历史快速初筛结果缺少可追溯证据，需要重新运行快速初筛。",
      success: false
    });
  });

  it("defines centralized Chinese recommendation labels", () => {
    expect(quickScreeningRecommendationLabels.PROCEED_TO_NEXT_STEP).toBe(
      "建议进入下一步"
    );
    expect(quickScreeningRecommendationLabels.MANUAL_REVIEW).toBe("需要人工复核");
    expect(quickScreeningRecommendationLabels.DO_NOT_PROCEED).toBe("暂不建议继续");
    expect(quickScreeningRecommendationLabels.NOT_ENOUGH_EVIDENCE).toBe("证据不足");
  });
});

const canonicalQuickScreeningResult: QuickScreeningResult = {
  dimensions: [
    {
      conclusion: "岗位要求存在部分证据，需要人工复核。",
      evidence: [
        {
          id: "ev_1",
          relatedRequirement: "TypeScript API",
          source: "RESUME",
          text: "简历中提到 TypeScript API 项目。"
        }
      ],
      key: "job_match",
      matchLevel: "medium",
      missingInformation: ["简历中未找到明确证据：Docker 部署"],
      name: "岗位要求匹配",
      risks: ["简历中未找到明确证据：Docker 部署"],
      score: 60
    }
  ],
  educationPass: "unclear",
  evidence: [
    {
      id: "ev_1",
      relatedRequirement: "TypeScript API",
      source: "RESUME",
      text: "简历中提到 TypeScript API 项目。"
    }
  ],
  fullTimeBachelor: "unclear",
  interviewQuestions: ["请说明 TypeScript API 项目的具体职责。"],
  mainRisk: "简历中未找到明确证据：Docker 部署",
  missingInformation: ["简历中未找到明确证据：Docker 部署"],
  nextStep: "建议招聘者先人工复核，再决定是否进入详细分析。",
  notes: null,
  overallScore: 60,
  priority: "B",
  reasons: ["简历中提到 TypeScript API 项目。"],
  recommendation: "MANUAL_REVIEW",
  risks: [
    {
      description: "简历中未找到明确证据：Docker 部署",
      severity: "medium",
      title: "Docker 部署"
    }
  ],
  robotArmRelevance: "medium",
  schemaVersion: "m11-a.quick.v1",
  screeningMode: "QUICK",
  shouldEnterDetailedAnalysis: "manual_review",
  strengths: ["简历中存在 TypeScript API 相关证据。"],
  summary: "规则型快速初筛发现部分岗位匹配证据，但仍有缺失信息需要人工确认。"
};

const legacyEvaluationResult: ResumeEvaluationResult = {
  confidence: "MEDIUM",
  dimensionScores: [
    {
      evidenceIds: ["ev_legacy_1"],
      key: "keyword-match",
      label: "Keyword match",
      rationale: "Legacy run found partial API evidence.",
      score: 52
    }
  ],
  evidence: [
    {
      id: "ev_legacy_1",
      relevance: "MEDIUM",
      source: "RESUME",
      text: "Legacy evidence: API project appears in resume."
    }
  ],
  interviewQuestions: [
    {
      category: "EXPERIENCE",
      evidenceIds: ["ev_legacy_1"],
      purpose: "Validate API ownership.",
      question: "请说明 API 项目的具体职责。"
    }
  ],
  notes: null,
  overallScore: 52,
  overallSummary: "Legacy quick screening summary.",
  recommendation: "UNCERTAIN",
  risks: [
    {
      description: "Docker evidence is not clear.",
      evidenceIds: ["ev_legacy_1"],
      severity: "MEDIUM",
      type: "MISSING_REQUIREMENT"
    }
  ],
  schemaVersion: "m07-b3-a.v1",
  strengths: [
    {
      description: "API project evidence exists.",
      evidenceIds: ["ev_legacy_1"],
      title: "API evidence"
    }
  ],
  weaknesses: [
    {
      description: "Docker deployment evidence is missing.",
      evidenceIds: ["ev_legacy_1"],
      severity: "MEDIUM",
      title: "Docker evidence"
    }
  ]
};
