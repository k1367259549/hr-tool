import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { DetailedScreeningResultSchema, DetailedScreeningResultV2Schema } from "@/lib/resume-screening/schema";
import type {
  AnyDetailedScreeningResult,
  RobotArmRelevance,
  ScreeningDimensionKey,
  ScreeningEvidence,
  ScreeningEvidenceSource,
  ScreeningRecommendation,
  ScreeningRisk,
  ScreeningRiskSeverity
} from "@/types/resume-screening";
import type {
  EvaluationConfidenceLevel,
  EvaluationEvidenceRelevance,
  EvaluationEvidenceSource,
  EvaluationRecommendation,
  EvaluationSeverity,
  ResumeEvaluationResult
} from "@/types/evaluation-output";

export type DetailedScreeningContractErrorCode =
  | "INVALID_JSON"
  | "DETAILED_CONTRACT_VERSION_INVALID"
  | "SCHEMA_VALIDATION_FAILED"
  | "INCOMPATIBLE_LEGACY_RESULT";

export type DetailedScreeningCompatibilityStatus =
  | "CURRENT_V2"
  | "LEGACY_V1"
  | "INVALID";

export type DetailedScreeningContractResult =
  | {
      success: true;
      result: AnyDetailedScreeningResult;
      source: "canonical" | "legacy";
      compatibilityStatus: Exclude<DetailedScreeningCompatibilityStatus, "INVALID">;
      warning?: string;
    }
  | {
      success: false;
      code: DetailedScreeningContractErrorCode;
      message: string;
      compatibilityStatus: "INVALID";
    };

export function resolveDetailedScreeningResult(
  value: unknown
): DetailedScreeningContractResult {
  const canonical = DetailedScreeningResultV2Schema.safeParse(value);

  if (canonical.success) {
    return {
      compatibilityStatus: "CURRENT_V2",
      result: canonical.data,
      source: "canonical",
      success: true
    };
  }

  const v1 = DetailedScreeningResultSchema.safeParse(value);

  if (v1.success) {
    return {
      compatibilityStatus: "LEGACY_V1",
      result: v1.data,
      source: "legacy",
      success: true,
      warning:
        "该详细分析生成于评价标准逐项契约建立之前。如需逐项 AI 参考，请重新运行详细分析。"
    };
  }

  if (looksLikeDetailedV2(value)) {
    return {
      code: "DETAILED_CONTRACT_VERSION_INVALID",
      compatibilityStatus: "INVALID",
      message: "Detailed screening result does not match the current V2 contract.",
      success: false
    };
  }

  if (!isLegacyEvaluationResultLike(value)) {
    return {
      code: "SCHEMA_VALIDATION_FAILED",
      compatibilityStatus: "INVALID",
      message:
        canonical.error.issues[0]?.message ??
        "Detailed screening result does not match schema.",
      success: false
    };
  }

  const legacy = bindEvaluationRunOutput(value);

  if (!legacy.success) {
    return {
      code: "INCOMPATIBLE_LEGACY_RESULT",
      compatibilityStatus: "INVALID",
      message: legacy.error,
      success: false
    };
  }

  return legacyEvaluationResultToDetailedScreeningResult(legacy.output);
}

export function adaptDetailedScreeningResultToLegacyEvaluationResult(
  result: AnyDetailedScreeningResult
): ResumeEvaluationResult {
  const evidence = result.evidence.map((item) => ({
    id: item.id,
    relevance: mapEvidenceRelevance(item.source),
    source: mapEvidenceSource(item.source),
    text: item.text
  }));

  return {
    confidence: mapConfidence(result.overallScore),
    dimensionScores: result.dimensions.map((dimension, index) => ({
      evidenceIds: dimension.evidence.map((item) => item.id),
      key: mapDimensionKeyToLegacy(dimension.key, index),
      label: dimension.name,
      rationale: dimension.conclusion,
      score: dimension.score
    })),
    evidence,
    interviewQuestions: result.interviewQuestions.map((question, index) => ({
      category: index === 0 ? "EXPERIENCE" : "OTHER",
      evidenceIds: pickEvidenceIds(result.evidence),
      purpose: question,
      question
    })),
    notes: result.notes,
    overallScore: result.overallScore,
    overallSummary: result.summary,
    recommendation: mapRecommendationToLegacy(result.recommendation),
    risks: result.risks.map((risk) => ({
      description: risk.description,
      evidenceIds: pickEvidenceIds(result.evidence),
      severity: mapSeverityToLegacy(risk.severity),
      type: "OTHER"
    })),
    schemaVersion: "m07-b3-a.v1",
    strengths: result.strengths.map((strength, index) => ({
      description: strength,
      evidenceIds: pickEvidenceIds(result.evidence),
      title: truncateText(strength, 120) || `Strength ${index + 1}`
    })),
    weaknesses: result.weaknesses.map((weakness, index) => ({
      description: weakness,
      evidenceIds: pickEvidenceIds(result.evidence),
      severity: "MEDIUM",
      title: truncateText(weakness, 120) || `Weakness ${index + 1}`
    }))
  };
}

function legacyEvaluationResultToDetailedScreeningResult(
  legacy: ResumeEvaluationResult
): DetailedScreeningContractResult {
  if (legacy.evidence.length === 0 || legacy.dimensionScores.length === 0) {
    return {
      code: "INCOMPATIBLE_LEGACY_RESULT",
      compatibilityStatus: "INVALID",
      message: "Historical detailed result lacks traceable evidence.",
      success: false
    };
  }

  const evidence = legacy.evidence.map(mapLegacyEvidence);
  const result = {
    dimensions: legacy.dimensionScores.map((dimension, index) => ({
      conclusion: dimension.rationale,
      evidence: selectEvidence(evidence, dimension.evidenceIds),
      key: mapLegacyDimensionKey(index),
      matchLevel: scoreToMatchLevel(dimension.score),
      missingInformation: legacy.weaknesses.map((item) => item.description),
      name: dimension.label,
      risks: legacy.risks.map((item) => item.description),
      score: dimension.score
    })),
    evidence,
    interviewQuestions: legacy.interviewQuestions.map((item) => item.question),
    missingInformation: legacy.weaknesses.map((item) => item.description),
    nextStep: createNextStep(mapLegacyRecommendation(legacy.recommendation)),
    notes: legacy.notes,
    overallScore: legacy.overallScore,
    recommendation: mapLegacyRecommendation(legacy.recommendation),
    risks: legacy.risks.map(mapLegacyRisk),
    schemaVersion: "m11-a.detailed.v1" as const,
    screeningMode: "DETAILED" as const,
    strengths: legacy.strengths.map((item) => item.description),
    summary: legacy.overallSummary,
    weaknesses: legacy.weaknesses.map((item) => item.description)
  };

  const parsed = DetailedScreeningResultSchema.safeParse(result);

  if (!parsed.success) {
    return {
      code: "INCOMPATIBLE_LEGACY_RESULT",
      compatibilityStatus: "INVALID",
      message:
        parsed.error.issues[0]?.message ??
        "Historical detailed result cannot be converted safely.",
      success: false
    };
  }

  return {
    compatibilityStatus: "LEGACY_V1",
    result: parsed.data,
    source: "legacy",
    success: true,
    warning:
      "该详细分析生成于评价标准逐项契约建立之前。如需逐项 AI 参考，请重新运行详细分析。"
  };
}

function looksLikeDetailedV2(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as { contractVersion?: unknown; schemaVersion?: unknown };

  return record.contractVersion !== undefined || record.schemaVersion === "m11-a.detailed.v2";
}

function isLegacyEvaluationResultLike(value: unknown): boolean {
  return typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === "m07-b3-a.v1";
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

function mapLegacyEvidenceSource(source: EvaluationEvidenceSource): ScreeningEvidenceSource {
  if (source === "JOB_PROFILE") {
    return "JOB_REQUIREMENT";
  }

  if (source === "EVALUATION_CRITERIA") {
    return "MISSING_INFORMATION";
  }

  return "RESUME";
}

function mapLegacyRisk(risk: ResumeEvaluationResult["risks"][number]): ScreeningRisk {
  return {
    description: risk.description,
    severity: mapLegacySeverity(risk.severity),
    title: risk.type
  };
}

function mapLegacySeverity(severity: EvaluationSeverity): ScreeningRiskSeverity {
  if (severity === "HIGH") {
    return "high";
  }

  if (severity === "LOW") {
    return "low";
  }

  return "medium";
}

function mapLegacyRecommendation(recommendation: EvaluationRecommendation): ScreeningRecommendation {
  if (recommendation === "STRONG_FIT" || recommendation === "POTENTIAL_FIT") {
    return "PROCEED_TO_NEXT_STEP";
  }

  if (recommendation === "UNCERTAIN") {
    return "MANUAL_REVIEW";
  }

  return "NOT_ENOUGH_EVIDENCE";
}

function mapRecommendationToLegacy(recommendation: ScreeningRecommendation): EvaluationRecommendation {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "POTENTIAL_FIT";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "UNCERTAIN";
  }

  return "NOT_ENOUGH_EVIDENCE";
}

function selectEvidence(evidence: ScreeningEvidence[], evidenceIds: string[]): ScreeningEvidence[] {
  const matched = evidence.filter((item) => evidenceIds.includes(item.id));

  return matched.length > 0 ? matched : evidence.slice(0, 1);
}

function mapLegacyDimensionKey(index: number): ScreeningDimensionKey {
  const keys: ScreeningDimensionKey[] = [
    "job_match",
    "experience_quality",
    "core_capability",
    "risk_control"
  ];

  return keys[index] ?? "core_capability";
}

function mapDimensionKeyToLegacy(key: ScreeningDimensionKey, index: number): string {
  const normalized = key.replaceAll("_", "-");

  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(normalized)
    ? normalized
    : `dimension-${index + 1}`;
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

function mapEvidenceSource(source: ScreeningEvidenceSource): EvaluationEvidenceSource {
  if (source === "JOB_REQUIREMENT") {
    return "JOB_PROFILE";
  }

  if (source === "MISSING_INFORMATION") {
    return "EVALUATION_CRITERIA";
  }

  return "RESUME";
}

function mapEvidenceRelevance(source: ScreeningEvidenceSource): EvaluationEvidenceRelevance {
  return source === "MISSING_INFORMATION" ? "LOW" : "HIGH";
}

function mapSeverityToLegacy(severity: ScreeningRiskSeverity): EvaluationSeverity {
  if (severity === "high") {
    return "HIGH";
  }

  if (severity === "low") {
    return "LOW";
  }

  return "MEDIUM";
}

function mapConfidence(score: number): EvaluationConfidenceLevel {
  if (score >= 80) {
    return "HIGH";
  }

  if (score >= 50) {
    return "MEDIUM";
  }

  return "LOW";
}

function pickEvidenceIds(evidence: ScreeningEvidence[]): string[] {
  const firstEvidence = evidence[0];

  return firstEvidence ? [firstEvidence.id] : ["ev_default"];
}

function createNextStep(recommendation: ScreeningRecommendation): string {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "建议进入招聘者人工复核和后续面试准备。";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "建议招聘者人工复核关键证据和缺失信息。";
  }

  return "建议先补充证据或重新运行详细分析。";
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength);
}
