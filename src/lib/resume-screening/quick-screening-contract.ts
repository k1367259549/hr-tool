import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { QuickScreeningResultSchema } from "@/lib/resume-screening/schema";
import type {
  QuickScreeningResult,
  RobotArmRelevance,
  ScreeningDimensionKey,
  ScreeningEvidence,
  ScreeningEvidenceSource,
  ScreeningPriority,
  ScreeningRecommendation,
  ScreeningRisk,
  ScreeningRiskSeverity
} from "@/types/resume-screening";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { QuickScreeningResultDto } from "@/types/resumeEvaluationRun";

export const quickScreeningRecommendationLabels = {
  DO_NOT_PROCEED: "暂不建议继续",
  MANUAL_REVIEW: "需要人工复核",
  NOT_ENOUGH_EVIDENCE: "证据不足",
  PROCEED_TO_NEXT_STEP: "建议进入下一步"
} satisfies Record<ScreeningRecommendation, string>;

export const quickScreeningEvidenceSourceLabels = {
  JOB_REQUIREMENT: "岗位要求",
  MISSING_INFORMATION: "缺失信息",
  RESUME: "简历证据"
} satisfies Record<ScreeningEvidenceSource, string>;

export type QuickScreeningContractResolution =
  | {
      success: true;
      result: QuickScreeningResult;
      source: "canonical" | "legacy";
    }
  | {
      success: false;
      code: "INVALID_QUICK_SCREENING_RESULT" | "UNSUPPORTED_LEGACY_RESULT";
      message: string;
    };

export function resolveQuickScreeningResult(
  value: unknown
): QuickScreeningContractResolution {
  const canonical = QuickScreeningResultSchema.safeParse(value);

  if (canonical.success) {
    return {
      result: canonical.data,
      source: "canonical",
      success: true
    };
  }

  if (isLegacyLikeWithoutTraceableEvidence(value)) {
    return {
      code: "UNSUPPORTED_LEGACY_RESULT",
      message: "历史快速初筛结果缺少可追溯证据，需要重新运行快速初筛。",
      success: false
    };
  }

  if (!isLegacyEvaluationResultLike(value)) {
    return {
      code: "INVALID_QUICK_SCREENING_RESULT",
      message: "快速初筛结果格式无法识别，需要重新运行快速初筛。",
      success: false
    };
  }

  const legacy = bindEvaluationRunOutput(value);

  if (!legacy.success) {
    return {
      code: "INVALID_QUICK_SCREENING_RESULT",
      message: "快速初筛结果格式无法识别，需要重新运行快速初筛。",
      success: false
    };
  }

  return legacyEvaluationResultToQuickScreeningResult(legacy.output);
}

function isLegacyEvaluationResultLike(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (value as { schemaVersion?: unknown }).schemaVersion === "m07-b3-a.v1";
}

function isLegacyLikeWithoutTraceableEvidence(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { schemaVersion?: unknown; evidence?: unknown };

  return candidate.schemaVersion === "m07-b3-a.v1" &&
    Array.isArray(candidate.evidence) &&
    candidate.evidence.length === 0;
}

export function toQuickScreeningCompatibilityFields(
  screeningResult: QuickScreeningResult
): QuickScreeningResultDto {
  return {
    evidence: screeningResult.evidence.map((item) => item.text),
    nextStep: screeningResult.nextStep,
    reasons: screeningResult.reasons,
    recommendation: screeningResult.recommendation,
    risks: screeningResult.risks.map((item) => item.description),
    score: screeningResult.overallScore,
    summary: screeningResult.summary
  };
}

function legacyEvaluationResultToQuickScreeningResult(
  legacy: ResumeEvaluationResult
): QuickScreeningContractResolution {
  if (legacy.evidence.length === 0 || legacy.dimensionScores.length === 0) {
    return {
      code: "UNSUPPORTED_LEGACY_RESULT",
      message: "历史快速初筛结果缺少可追溯证据，需要重新运行快速初筛。",
      success: false
    };
  }

  const evidence = legacy.evidence.map(mapLegacyEvidence);
  const strengths = legacy.strengths
    .map((item) => item.description || item.title)
    .filter(Boolean);
  const missingInformation = legacy.weaknesses
    .map((item) => item.description)
    .filter(Boolean);
  const risks = legacy.risks.map(mapLegacyRisk);
  const recommendation = mapLegacyRecommendation(legacy.recommendation);
  const reasons = [
    ...strengths,
    ...missingInformation,
    ...risks.map((item) => item.description)
  ].slice(0, 20);

  if (reasons.length === 0) {
    reasons.push(legacy.overallSummary);
  }

  const result = {
    dimensions: legacy.dimensionScores.slice(0, 4).map((dimension, index) => ({
      conclusion: dimension.rationale,
      evidence: selectEvidenceForLegacyDimension(evidence, dimension.evidenceIds),
      key: mapLegacyDimensionKey(index),
      matchLevel: scoreToMatchLevel(dimension.score),
      missingInformation,
      name: dimension.label,
      risks: risks.map((item) => item.description),
      score: dimension.score
    })),
    educationPass: "unclear" as const,
    evidence,
    fullTimeBachelor: "unclear" as const,
    interviewQuestions: legacy.interviewQuestions.map((item) => item.question),
    mainRisk:
      risks[0]?.description ??
      missingInformation[0] ??
      "历史结果未提供明确风险，建议人工确认。",
    missingInformation,
    nextStep: createNextStep(recommendation),
    notes: legacy.notes,
    overallScore: legacy.overallScore,
    priority: determinePriority(recommendation, legacy.overallScore),
    reasons,
    recommendation,
    risks,
    robotArmRelevance: scoreToMatchLevel(legacy.overallScore),
    schemaVersion: "m11-a.quick.v1" as const,
    screeningMode: "QUICK" as const,
    shouldEnterDetailedAnalysis: determineDetailedAnalysisDecision(recommendation),
    strengths,
    summary: legacy.overallSummary
  };

  const parsed = QuickScreeningResultSchema.safeParse(result);

  if (!parsed.success) {
    return {
      code: "UNSUPPORTED_LEGACY_RESULT",
      message: "历史快速初筛结果格式不完整，需要重新运行快速初筛。",
      success: false
    };
  }

  return {
    result: parsed.data,
    source: "legacy",
    success: true
  };
}

function mapLegacyEvidence(
  evidence: ResumeEvaluationResult["evidence"][number]
): ScreeningEvidence {
  return {
    id: evidence.id,
    relatedRequirement: null,
    source: mapLegacyEvidenceSource(evidence.source),
    text: evidence.text
  };
}

function mapLegacyEvidenceSource(
  source: ResumeEvaluationResult["evidence"][number]["source"]
): ScreeningEvidenceSource {
  if (source === "JOB_PROFILE") {
    return "JOB_REQUIREMENT";
  }

  if (source === "EVALUATION_CRITERIA") {
    return "MISSING_INFORMATION";
  }

  return "RESUME";
}

function mapLegacyRisk(
  risk: ResumeEvaluationResult["risks"][number]
): ScreeningRisk {
  return {
    description: risk.description,
    severity: mapLegacySeverity(risk.severity),
    title: risk.type
  };
}

function mapLegacySeverity(
  severity: ResumeEvaluationResult["risks"][number]["severity"]
): ScreeningRiskSeverity {
  if (severity === "HIGH") {
    return "high";
  }

  if (severity === "LOW") {
    return "low";
  }

  return "medium";
}

function mapLegacyRecommendation(
  recommendation: ResumeEvaluationResult["recommendation"]
): ScreeningRecommendation {
  if (recommendation === "STRONG_FIT" || recommendation === "POTENTIAL_FIT") {
    return "PROCEED_TO_NEXT_STEP";
  }

  if (recommendation === "UNCERTAIN") {
    return "MANUAL_REVIEW";
  }

  return "NOT_ENOUGH_EVIDENCE";
}

function selectEvidenceForLegacyDimension(
  evidence: ScreeningEvidence[],
  evidenceIds: string[]
): ScreeningEvidence[] {
  const matched = evidence.filter((item) => evidenceIds.includes(item.id));

  return matched.length > 0 ? matched : evidence.slice(0, 1);
}

function mapLegacyDimensionKey(index: number): ScreeningDimensionKey {
  const keys: ScreeningDimensionKey[] = [
    "job_match",
    "experience_quality",
    "risk_control",
    "core_capability"
  ];

  return keys[index] ?? "core_capability";
}

function scoreToMatchLevel(score: number): RobotArmRelevance {
  if (score >= 75) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  if (score > 0) {
    return "low";
  }

  return "unclear";
}

function determinePriority(
  recommendation: ScreeningRecommendation,
  score: number
): ScreeningPriority {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return score >= 85 ? "A" : "B";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return score >= 45 ? "B" : "C";
  }

  return score >= 35 ? "C" : "D";
}

function determineDetailedAnalysisDecision(
  recommendation: ScreeningRecommendation
): QuickScreeningResult["shouldEnterDetailedAnalysis"] {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "yes";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "manual_review";
  }

  return "no";
}

function createNextStep(recommendation: ScreeningRecommendation): string {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "建议进入详细分析或电话筛选，并由招聘者人工确认。";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "建议补充关键信息后，再由招聘者人工确认是否进入详细分析。";
  }

  if (recommendation === "DO_NOT_PROCEED") {
    return "暂不建议继续，但必须由招聘者人工确认。";
  }

  return "建议先补充证据或电话确认缺失信息。";
}
