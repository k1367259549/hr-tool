import type { EvaluationProviderInput } from "@/lib/evaluation/provider-interface";
import { QuickScreeningResultSchema } from "@/lib/resume-screening/schema";
import type {
  QuickScreeningResult,
  RobotArmRelevance,
  ScreeningDimensionResult,
  ScreeningEvidence,
  ScreeningPriority,
  ScreeningRecommendation,
  ScreeningRisk,
  ScreeningTriState
} from "@/types/resume-screening";
import type {
  Evidence,
  EvaluationRecommendation as LegacyRecommendation,
  InterviewQuestion,
  Weakness,
  ResumeEvaluationResult
} from "@/types/evaluation-output";

export const RULE_BASED_QUICK_SCREENING_WEIGHTS = {
  completeness: 20,
  jdCoverage: 50,
  textRelevance: 30
} as const;

const MAX_REQUIREMENTS = 12;
const MAX_REQUIREMENT_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 1600;
const MAX_INTERVIEW_QUESTIONS = 6;
const GENERIC_ENGLISH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "build",
  "for",
  "from",
  "have",
  "in",
  "into",
  "is",
  "it",
  "need",
  "of",
  "or",
  "our",
  "role",
  "the",
  "to",
  "with",
  "work"
]);

type RequirementMatch = {
  requirement: string;
  matchScore: number;
  matchType: "MATCHED" | "PARTIAL" | "MISSING";
  evidence: ScreeningEvidence;
  strength?: string;
  risk?: ScreeningRisk;
  missingInformation?: string;
  question: string;
};

type NormalizedScreeningInput = {
  candidateName: string | null;
  jobDescription: string;
  jobTitle: string | null;
  resumeText: string;
};

export function createRuleBasedQuickScreeningResult(
  input: EvaluationProviderInput
): QuickScreeningResult {
  const normalized = normalizeInput(input);
  const requirements = extractJobRequirements(normalized.jobDescription);
  const resumeTokens = extractTerms(normalized.resumeText);
  const analysis = analyzeRequirements(requirements, normalized.resumeText, resumeTokens);
  const completenessScore = calculateCompletenessScore(normalized);
  const coverageScore = calculateCoverageScore(analysis, requirements.length);
  const relevanceScore = calculateRelevanceScore(analysis, normalized);
  const overallScore = calculateOverallScore({
    completenessScore,
    coverageScore,
    relevanceScore
  });
  const recommendation = determineRecommendation({
    analysis,
    completenessScore,
    coverageScore,
    relevanceScore
  });
  const shouldEnterDetailedAnalysis = determineDetailedAnalysisDecision(recommendation);
  const priority = determinePriority(recommendation, overallScore, analysis);
  const dimensions = buildDimensions({
    analysis,
    completenessScore,
    coverageScore,
    normalized,
    relevanceScore
  });
  const evidence = buildEvidence(analysis, normalized, requirements);
  const strengths = buildStrengths(analysis, normalized);
  const risks = buildRisks(analysis, normalized, requirements);
  const missingInformation = buildMissingInformation(analysis, normalized, requirements);
  const interviewQuestions = buildInterviewQuestions(analysis, normalized, requirements);
  const summary = buildSummary({
    analysis,
    completenessScore,
    coverageScore,
    normalized,
    overallScore,
    recommendation
  });
  const mainRisk = risks[0]?.description ?? createDefaultMainRisk(normalized, requirements);
  const nextStep = buildNextStep(recommendation, analysis, normalized, requirements);
  const educationPass = determineEducationPass(normalized, requirements);
  const fullTimeBachelor = determineFullTimeBachelor(normalized, requirements);
  const robotArmRelevance = determineRobotArmRelevance(coverageScore, relevanceScore, analysis);

  const result = {
    dimensions,
    educationPass,
    evidence,
    fullTimeBachelor,
    interviewQuestions,
    mainRisk,
    missingInformation,
    nextStep,
    notes: null,
    overallScore,
    priority,
    reasons: buildReasons(analysis, normalized, requirements),
    recommendation,
    risks,
    robotArmRelevance,
    schemaVersion: "m11-a.quick.v1" as const,
    screeningMode: "QUICK" as const,
    shouldEnterDetailedAnalysis,
    strengths,
    summary
  };

  const parsed = QuickScreeningResultSchema.safeParse(result);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Rule-based quick screening output is invalid."
    );
  }

  return parsed.data;
}

export function adaptQuickScreeningResultToLegacyEvaluationResult(
  result: QuickScreeningResult
): ResumeEvaluationResult {
  const legacyRecommendation = mapRecommendationToLegacy(result.recommendation);
  const primaryEvidenceIds = result.evidence.slice(0, 1).map((item) => item.id);
  const strengthEvidenceIds = result.evidence.length > 0 ? primaryEvidenceIds : ["ev_quick_1"];

  return {
    confidence: mapConfidence(result.overallScore, legacyRecommendation),
    dimensionScores: result.dimensions.map((dimension, index) => ({
      evidenceIds: dimension.evidence.map((item) => item.id),
      key: mapDimensionKeyToLegacy(dimension.key, index),
      label: dimension.name,
      rationale: dimension.conclusion,
      score: dimension.score
    })),
    evidence: result.evidence.map((item) => ({
      id: item.id,
      relevance: mapEvidenceRelevance(item.source, item.relatedRequirement, result),
      source: mapEvidenceSource(item.source),
      text: item.text
    })),
    interviewQuestions: result.interviewQuestions.map((question, index) => ({
      category: mapQuestionCategory(question, index),
      evidenceIds: chooseEvidenceIdsForQuestion(question, result, primaryEvidenceIds),
      purpose: question,
      question
    })),
    notes:
      "Rule-based quick screening adapter output. This is a local auxiliary signal, not a hiring decision.",
    overallScore: result.overallScore,
    overallSummary: `Rule-based signal only: ${result.summary}`,
    recommendation: legacyRecommendation,
    risks: result.risks.map((risk) => ({
      description: risk.description,
      evidenceIds: chooseEvidenceIdsForRisk(risk, result, primaryEvidenceIds),
      severity: mapSeverity(risk.severity),
      type: "OTHER"
    })),
    schemaVersion: "m07-b3-a.v1",
    strengths: result.strengths.map((strength, index) => ({
      description: strength,
      evidenceIds: chooseEvidenceIdsForStrength(strength, result, strengthEvidenceIds, index),
      title: strength.slice(0, 120)
    })),
    weaknesses: buildLegacyWeaknesses(result, primaryEvidenceIds)
  };
}

function normalizeInput(input: EvaluationProviderInput): NormalizedScreeningInput {
  return {
    candidateName: normalizeInlineText(input.candidateName),
    jobDescription: normalizeBodyText(input.jobDescription),
    jobTitle: normalizeInlineText(input.jobTitle),
    resumeText: normalizeBodyText(input.resumeText)
  };
}

function extractJobRequirements(jobDescription: string): string[] {
  const fragments = splitJobDescription(jobDescription)
    .map((fragment) => normalizeRequirement(fragment))
    .filter((fragment): fragment is string => fragment.length >= 3)
    .filter((fragment, index, array) => array.indexOf(fragment) === index);

  if (fragments.length > 0) {
    return fragments.slice(0, MAX_REQUIREMENTS);
  }

  const fallback = normalizeRequirement(jobDescription);

  return fallback ? [fallback.slice(0, MAX_REQUIREMENT_LENGTH)] : [];
}

function splitJobDescription(jobDescription: string): string[] {
  const normalized = jobDescription.replace(/\r/g, "\n");
  const byLine = normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/[•·▪●◆◇|；;。.!?！？、]/u))
    .flatMap((fragment) => fragment.split(/(?:^\s*[-*•]\s+)/u));

  if (byLine.some((item) => item.trim().length > 0)) {
    return byLine;
  }

  return normalized.split(/[。.!?！？；;，,]/u);
}

function analyzeRequirements(
  requirements: string[],
  resumeText: string,
  resumeTokens: string[]
): RequirementMatch[] {
  if (requirements.length === 0) {
    return [];
  }

  return requirements.map((requirement, index) =>
    analyzeSingleRequirement(requirement, index, resumeText, resumeTokens)
  );
}

function analyzeSingleRequirement(
  requirement: string,
  index: number,
  resumeText: string,
  resumeTokens: string[]
): RequirementMatch {
  const normalizedRequirement = normalizeForMatching(requirement);
  const requirementTokens = extractTerms(requirement);
  const directMatch = normalizedRequirement.length > 0 &&
    normalizeForMatching(resumeText).includes(normalizedRequirement);
  const overlap = requirementTokens.filter((token) => resumeTokens.includes(token));
  const overlapRatio =
    requirementTokens.length > 0 ? overlap.length / requirementTokens.length : 0;
  const matchType: RequirementMatch["matchType"] = directMatch
    ? "MATCHED"
    : overlap.length > 0 && overlapRatio >= 0.34
      ? "PARTIAL"
      : "MISSING";
  const matchScore =
    matchType === "MATCHED" ? 100 : matchType === "PARTIAL" ? Math.round(overlapRatio * 100) : 0;
  const evidenceId = `ev_req_${index + 1}`;
  const evidenceText =
    matchType === "MATCHED"
      ? `简历中找到与岗位要求“${requirement}”相关的明确证据。`
      : matchType === "PARTIAL"
        ? `简历中找到与岗位要求“${requirement}”相关的部分证据，仍需人工复核。`
        : `简历中未找到明确证据：${requirement}`;

  return {
    evidence: {
      id: evidenceId,
      relatedRequirement: requirement,
      source: matchType === "MISSING" ? "MISSING_INFORMATION" : "RESUME",
      text: evidenceText
    },
    matchScore,
    matchType,
    requirement,
    question:
      matchType === "MISSING"
        ? `请说明你是否具备“${requirement}”相关经验，以及简历中未体现的原因。`
        : `请说明你在“${requirement}”上的具体职责、成果和直接贡献。`,
    risk:
      matchType === "MISSING"
        ? {
            description: `简历中未找到明确证据：${requirement}`,
            severity: "medium",
            title: truncateText(requirement, 120)
          }
        : undefined,
    missingInformation:
      matchType === "MISSING" ? `简历中未找到明确证据：${requirement}` : undefined,
    strength:
      matchType === "MATCHED"
        ? `简历中存在与“${requirement}”相关的明确证据。`
        : matchType === "PARTIAL"
          ? `简历中存在与“${requirement}”相关的部分证据。`
          : undefined
  };
}

function calculateCoverageScore(
  analysis: RequirementMatch[],
  requirementCount: number
): number {
  if (requirementCount === 0) {
    return 0;
  }

  const total = analysis.reduce((sum, item) => {
    if (item.matchType === "MATCHED") {
      return sum + 100;
    }

    if (item.matchType === "PARTIAL") {
      return sum + Math.max(30, item.matchScore);
    }

    return sum;
  }, 0);

  return clampToInteger((total / requirementCount) as number);
}

function calculateRelevanceScore(
  analysis: RequirementMatch[],
  input: NormalizedScreeningInput
): number {
  if (analysis.length > 0) {
    const total = analysis.reduce((sum, item) => sum + item.matchScore, 0);

    return clampToInteger(total / analysis.length);
  }

  const jdTokens = extractTerms(input.jobDescription);
  const resumeTokens = extractTerms(input.resumeText);
  const overlap = jdTokens.filter((token) => resumeTokens.includes(token));

  if (jdTokens.length === 0) {
    return 0;
  }

  return clampToInteger((overlap.length / jdTokens.length) * 100);
}

function calculateCompletenessScore(input: NormalizedScreeningInput): number {
  const resumeLengthScore = Math.min(40, Math.round(input.resumeText.length / 12));
  const jdLengthScore = Math.min(25, Math.round(input.jobDescription.length / 16));
  const signalScore = countCompletenessSignals(input.resumeText) * 10;
  const structureScore = countStructuredLines(input.resumeText) > 1 ? 15 : 0;
  const trimBonus = input.candidateName || input.jobTitle ? 5 : 0;

  return clampToInteger(
    Math.min(100, resumeLengthScore + jdLengthScore + signalScore + structureScore + trimBonus)
  );
}

function calculateOverallScore(input: {
  completenessScore: number;
  coverageScore: number;
  relevanceScore: number;
}): number {
  const weighted =
    input.coverageScore * RULE_BASED_QUICK_SCREENING_WEIGHTS.jdCoverage / 100 +
    input.relevanceScore * RULE_BASED_QUICK_SCREENING_WEIGHTS.textRelevance / 100 +
    input.completenessScore * RULE_BASED_QUICK_SCREENING_WEIGHTS.completeness / 100;

  return clampToInteger(weighted);
}

function determineRecommendation(input: {
  analysis: RequirementMatch[];
  completenessScore: number;
  coverageScore: number;
  relevanceScore: number;
}): ScreeningRecommendation {
  const matchedCount = input.analysis.filter((item) => item.matchType === "MATCHED").length;
  const partialCount = input.analysis.filter((item) => item.matchType === "PARTIAL").length;
  const totalRequirements = input.analysis.length;
  const hasEnoughEvidence =
    totalRequirements > 0 &&
    matchedCount > 0 &&
    input.coverageScore >= 70 &&
    input.completenessScore >= 35;

  if (hasEnoughEvidence) {
    return "PROCEED_TO_NEXT_STEP";
  }

  if (
    totalRequirements === 0 ||
    (matchedCount === 0 && partialCount === 0) ||
    input.coverageScore < 25 ||
    input.relevanceScore < 25
  ) {
    return "NOT_ENOUGH_EVIDENCE";
  }

  return "MANUAL_REVIEW";
}

function determineDetailedAnalysisDecision(
  recommendation: ScreeningRecommendation
): "yes" | "no" | "manual_review" {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "yes";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "manual_review";
  }

  return "no";
}

function determinePriority(
  recommendation: ScreeningRecommendation,
  overallScore: number,
  analysis: RequirementMatch[]
): ScreeningPriority {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return overallScore >= 85 ? "A" : "B";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return analysis.some((item) => item.matchType !== "MISSING") || overallScore >= 45
      ? "B"
      : "C";
  }

  return overallScore >= 35 ? "C" : "D";
}

function buildDimensions(input: {
  analysis: RequirementMatch[];
  completenessScore: number;
  coverageScore: number;
  normalized: NormalizedScreeningInput;
  relevanceScore: number;
}): ScreeningDimensionResult[] {
  const jobMatchEvidence = input.analysis.map((item) => item.evidence);
  const matchedCount = input.analysis.filter((item) => item.matchType === "MATCHED").length;
  const partialCount = input.analysis.filter((item) => item.matchType === "PARTIAL").length;
  const missingCount = input.analysis.filter((item) => item.matchType === "MISSING").length;

  const jobMatchDimension: ScreeningDimensionResult = {
    conclusion:
      input.analysis.length === 0
        ? "JD 中未提取到足够明确的要求，无法形成稳定判断。"
        : `${matchedCount} 条明确匹配，${partialCount} 条部分匹配，${missingCount} 条未找到明确证据。`,
    evidence:
      jobMatchEvidence.length > 0
        ? jobMatchEvidence
        : [
            {
              id: "ev_job_empty",
              relatedRequirement: null,
              source: "MISSING_INFORMATION",
              text: "JD 中未提取到明确要求，当前证据不足。"
            }
          ],
    key: "job_match",
    matchLevel: calculateMatchLevel(input.coverageScore),
    missingInformation: input.analysis
      .filter((item) => item.matchType === "MISSING")
      .map((item) => `简历中未找到明确证据：${item.requirement}`),
    name: "岗位要求匹配",
    risks: input.analysis
      .filter((item) => item.matchType === "MISSING")
      .map((item) => `简历中未找到明确证据：${item.requirement}`),
    score: input.coverageScore
  };

  const experienceEvidenceText = buildExperienceEvidenceText(input.normalized.resumeText);
  const experienceDimension: ScreeningDimensionResult = {
    conclusion: experienceEvidenceText.conclusion,
    evidence: [
      {
        id: "ev_experience_quality",
        relatedRequirement: null,
        source: "RESUME",
        text: experienceEvidenceText.evidence
      }
    ],
    key: "experience_quality",
    matchLevel: calculateMatchLevel(input.relevanceScore),
    missingInformation: experienceEvidenceText.missingInformation,
    name: "经历质量",
    risks: experienceEvidenceText.risks,
    score: input.relevanceScore
  };

  const riskEvidence = buildRiskEvidence(input.normalized, input.analysis);
  const riskDimension: ScreeningDimensionResult = {
    conclusion: riskEvidence.conclusion,
    evidence: riskEvidence.evidence,
    key: "risk_control",
    matchLevel: calculateMatchLevel(100 - input.completenessScore),
    missingInformation: riskEvidence.missingInformation,
    name: "风险与缺失信息",
    risks: riskEvidence.risks,
    score: Math.max(0, 100 - input.completenessScore)
  };

  return [jobMatchDimension, experienceDimension, riskDimension];
}

function buildEvidence(
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput,
  requirements: string[]
): ScreeningEvidence[] {
  const items = analysis.map((item) => item.evidence);

  if (items.length === 0) {
    items.push({
      id: "ev_general_gap",
      relatedRequirement: requirements[0] ?? null,
      source: "MISSING_INFORMATION",
      text:
        normalized.resumeText.length === 0
          ? "简历文本为空，无法提取明确证据。"
          : "JD 文本过短或缺少明确要求，当前证据不足。"
    });
  }

  return items;
}

function buildStrengths(
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput
): string[] {
  const strengths = analysis
    .filter((item) => item.matchType !== "MISSING")
    .map((item) => item.strength)
    .filter((item): item is string => Boolean(item));

  if (strengths.length === 0 && hasUsefulResumeSignals(normalized.resumeText)) {
    strengths.push("简历包含可追溯的工作、项目、技能或教育信息。");
  }

  return uniqueStrings(strengths).slice(0, 5);
}

function buildRisks(
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput,
  requirements: string[]
): ScreeningRisk[] {
  const risks: ScreeningRisk[] = analysis
    .map((item) => item.risk)
    .filter((item): item is ScreeningRisk => Boolean(item));

  if (normalized.resumeText.length === 0) {
    risks.unshift({
      description: "简历文本为空，当前结果只能作为证据不足的辅助信号。",
      severity: "high",
      title: "简历为空"
    });
  }

  if (normalized.jobDescription.length === 0) {
    risks.unshift({
      description: "JD 文本为空，无法提取稳定要求。",
      severity: "high",
      title: "JD 为空"
    });
  }

  if (requirements.length === 0) {
    risks.push({
      description: "JD 中未提取到明确要求，因此无法做稳定的岗位匹配判断。",
      severity: "medium",
      title: "JD 要求不足"
    });
  }

  if (risks.length === 0) {
    risks.push({
      description: "当前证据足够形成基础判断，但仍建议招聘者人工复核。",
      severity: "low",
      title: "仍需人工确认"
    });
  }

  return uniqueRisks(risks).slice(0, 5);
}

function buildMissingInformation(
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput,
  requirements: string[]
): string[] {
  const items = analysis.flatMap((item) => item.missingInformation ?? []);

  if (normalized.resumeText.length < 60) {
    items.push("简历文本较短，信息完整性不足。");
  }

  if (normalized.jobDescription.length < 40) {
    items.push("JD 文本较短，无法提取足够明确的岗位要求。");
  }

  if (!hasAvailabilitySignal(normalized.resumeText)) {
    items.push("简历中未明确说明到岗时间、实习周期或每周可出勤情况。");
  }

  if (requirements.length === 0) {
    items.push("JD 中未提取到可稳定分析的明确要求。");
  }

  return uniqueStrings(items).slice(0, 10);
}

function buildInterviewQuestions(
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput,
  requirements: string[]
): string[] {
  const questions: string[] = [];

  for (const item of analysis.filter((entry) => entry.matchType !== "MATCHED")) {
    questions.push(item.question);
  }

  if (questions.length === 0 && requirements.length > 0) {
    questions.push(`请说明你对“${requirements[0]}”的相关理解和实际经历。`);
  }

  if (!hasAvailabilitySignal(normalized.resumeText)) {
    questions.push("请说明你的到岗时间、可持续周期和每周可出勤情况。");
  }

  if (questions.length === 0) {
    questions.push("请说明你最近一段最相关的工作或项目经历，以及你承担的具体职责。");
  }

  return uniqueStrings(questions).slice(0, MAX_INTERVIEW_QUESTIONS);
}

function buildSummary(input: {
  analysis: RequirementMatch[];
  completenessScore: number;
  coverageScore: number;
  normalized: NormalizedScreeningInput;
  overallScore: number;
  recommendation: ScreeningRecommendation;
}): string {
  const matchedCount = input.analysis.filter((item) => item.matchType === "MATCHED").length;
  const partialCount = input.analysis.filter((item) => item.matchType === "PARTIAL").length;
  const missingCount = input.analysis.filter((item) => item.matchType === "MISSING").length;
  const subject = input.normalized.candidateName ?? "该候选人";
  const role = input.normalized.jobTitle ? `围绕“${input.normalized.jobTitle}”` : "围绕当前岗位";
  const recommendationText = mapRecommendationToChinese(input.recommendation);
  const summary = [
    `${subject}${role}的快速初筛已完成。`,
    `共提取 ${input.analysis.length} 条可追踪要求，其中 ${matchedCount} 条已找到明确证据、${partialCount} 条只有部分证据、${missingCount} 条仍需补充确认。`,
    `JD 覆盖度为 ${input.coverageScore} 分，文本完整性为 ${input.completenessScore} 分，综合规则信号得分为 ${input.overallScore} 分。`,
    `${recommendationText} 这只是规则型辅助匹配信号，不是录用概率。`
  ].join(" ");

  return truncateText(summary, MAX_SUMMARY_LENGTH);
}

function buildNextStep(
  recommendation: ScreeningRecommendation,
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput,
  requirements: string[]
): string {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "建议进入详细分析，并结合电话筛选继续确认关键证据和缺失信息。";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "建议招聘者先人工复核，再决定是否进入详细分析。";
  }

  if (requirements.length === 0 || analysis.length === 0) {
    return "建议先补充更完整的 JD 或简历信息，再重新进行快速初筛。";
  }

  if (normalized.resumeText.length === 0) {
    return "建议先补充简历内容，再重新进行快速初筛。";
  }

  return "建议补充缺失信息后，再决定是否进入详细分析。";
}

function createDefaultMainRisk(
  normalized: NormalizedScreeningInput,
  requirements: string[]
): string {
  if (normalized.resumeText.length === 0) {
    return "简历文本为空，证据不足。";
  }

  if (normalized.jobDescription.length === 0) {
    return "JD 文本为空，无法形成稳定判断。";
  }

  if (requirements.length === 0) {
    return "JD 中未提取到足够明确的要求。";
  }

  return "当前证据需要招聘者人工确认。";
}

function determineEducationPass(
  normalized: NormalizedScreeningInput,
  requirements: string[]
): ScreeningTriState {
  if (!hasEducationSignal(normalized.resumeText) && requirements.length === 0) {
    return "unclear";
  }

  if (hasBachelorSignal(normalized.resumeText)) {
    return "yes";
  }

  if (requirements.some((item) => /学历|本科|学士|bachelor|degree/i.test(item))) {
    return "no";
  }

  return "unclear";
}

function determineFullTimeBachelor(
  normalized: NormalizedScreeningInput,
  requirements: string[]
): ScreeningTriState {
  if (hasBachelorSignal(normalized.resumeText)) {
    return "yes";
  }

  if (requirements.some((item) => /本科|学士|bachelor|degree/i.test(item))) {
    return "no";
  }

  return "unclear";
}

function determineRobotArmRelevance(
  coverageScore: number,
  relevanceScore: number,
  analysis: RequirementMatch[]
): RobotArmRelevance {
  if (analysis.length === 0) {
    return "unclear";
  }

  if (coverageScore >= 75 && relevanceScore >= 70) {
    return "high";
  }

  if (coverageScore >= 40 || relevanceScore >= 40) {
    return "medium";
  }

  if (coverageScore > 0 || relevanceScore > 0) {
    return "low";
  }

  return "unclear";
}

function buildReasons(
  analysis: RequirementMatch[],
  normalized: NormalizedScreeningInput,
  requirements: string[]
): string[] {
  const reasons = analysis.map((item) =>
    item.matchType === "MISSING"
      ? `简历中未找到明确证据：${item.requirement}`
      : item.matchType === "PARTIAL"
        ? `简历中找到与“${item.requirement}”相关的部分证据。`
        : `简历中找到与“${item.requirement}”相关的明确证据。`
  );

  if (reasons.length === 0) {
    reasons.push(
      normalized.resumeText.length === 0
        ? "简历文本为空，无法形成规则匹配。"
        : requirements.length === 0
          ? "JD 中未提取到足够明确的要求。"
          : "当前证据不足，需要人工复核。"
    );
  }

  return uniqueStrings(reasons).slice(0, 10);
}

function buildExperienceEvidenceText(resumeText: string): {
  conclusion: string;
  evidence: string;
  missingInformation: string[];
  risks: string[];
} {
  const signals = extractCompletenessSignals(resumeText);

  if (resumeText.length === 0) {
    return {
      conclusion: "简历文本为空，无法评估经历质量。",
      evidence: "简历文本为空，缺少可追踪的经历信息。",
      missingInformation: ["简历文本为空，无法判断经历质量。"],
      risks: ["简历文本为空，无法评估经历质量。"]
    };
  }

  if (signals.length === 0) {
    return {
      conclusion: "简历中缺少清晰的工作、项目、技能或教育线索。",
      evidence: "简历中未发现明显的工作、项目、技能或教育线索。",
      missingInformation: ["简历中未发现明显的工作、项目、技能或教育线索。"],
      risks: ["简历缺少可追踪的经历结构。"]
    };
  }

  return {
    conclusion: `简历中存在 ${signals.length} 类可追踪经历线索：${signals.join("、")}。`,
    evidence: `简历中出现了可追踪的经历线索：${signals.join("、")}。`,
    missingInformation: [],
    risks: []
  };
}

function buildRiskEvidence(
  normalized: NormalizedScreeningInput,
  analysis: RequirementMatch[]
): {
  conclusion: string;
  evidence: ScreeningEvidence[];
  missingInformation: string[];
  risks: string[];
} {
  const missingEvidence = analysis
    .filter((item) => item.matchType === "MISSING")
    .slice(0, 3)
    .map((item, index) => ({
      id: `ev_missing_${index + 1}`,
      relatedRequirement: item.requirement,
      source: "MISSING_INFORMATION" as const,
      text: `简历中未找到明确证据：${item.requirement}`
    }));

  if (normalized.resumeText.length === 0) {
    return {
      conclusion: "简历为空，属于高风险信息不足状态。",
      evidence: [
        {
          id: "ev_resume_empty",
          relatedRequirement: null,
          source: "MISSING_INFORMATION",
          text: "简历文本为空，无法提取证据。"
        }
      ],
      missingInformation: ["简历文本为空，无法提取证据。"],
      risks: ["简历文本为空，无法提取证据。"]
    };
  }

  if (missingEvidence.length > 0) {
    return {
      conclusion: "存在若干岗位要求未在简历中找到明确证据。",
      evidence: missingEvidence,
      missingInformation: missingEvidence.map((item) => item.text),
      risks: missingEvidence.map((item) => item.text)
    };
  }

  return {
    conclusion: "当前没有显著的风险信号，但仍建议人工确认。",
    evidence: [
      {
        id: "ev_risk_none",
        relatedRequirement: null,
        source: "RESUME",
        text: "简历中未出现显著的缺失信息风险。"
      }
    ],
    missingInformation: [],
    risks: ["当前没有显著的风险信号，但仍建议人工确认。"]
  };
}

function mapRecommendationToLegacy(
  recommendation: ScreeningRecommendation
): LegacyRecommendation {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "POTENTIAL_FIT";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "UNCERTAIN";
  }

  return "NOT_ENOUGH_EVIDENCE";
}

function mapRecommendationToChinese(recommendation: ScreeningRecommendation): string {
  if (recommendation === "PROCEED_TO_NEXT_STEP") {
    return "建议进入下一步。";
  }

  if (recommendation === "MANUAL_REVIEW") {
    return "建议人工复核。";
  }

  return "证据不足。";
}

function mapConfidence(
  score: number,
  recommendation: LegacyRecommendation
): ResumeEvaluationResult["confidence"] {
  if (recommendation === "STRONG_FIT" || score >= 80) {
    return "HIGH";
  }

  if (recommendation === "POTENTIAL_FIT" || score >= 50) {
    return "MEDIUM";
  }

  return "LOW";
}

function mapEvidenceSource(source: ScreeningEvidence["source"]): Evidence["source"] {
  if (source === "JOB_REQUIREMENT") {
    return "JOB_PROFILE";
  }

  if (source === "MISSING_INFORMATION") {
    return "EVALUATION_CRITERIA";
  }

  return "RESUME";
}

function mapEvidenceRelevance(
  source: ScreeningEvidence["source"],
  relatedRequirement: string | null,
  result: QuickScreeningResult
): Evidence["relevance"] {
  if (source === "MISSING_INFORMATION") {
    return "LOW";
  }

  if (relatedRequirement && result.reasons.some((item) => item.includes(relatedRequirement))) {
    return "HIGH";
  }

  return "MEDIUM";
}

function mapDimensionKeyToLegacy(
  key: ScreeningDimensionResult["key"],
  index: number
): string {
  if (key === "job_match") {
    return "keyword-match";
  }

  const normalized = key.replaceAll("_", "-");

  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(normalized)
    ? normalized
    : `dimension-${index + 1}`;
}

function mapSeverity(
  severity: ScreeningRisk["severity"]
): ResumeEvaluationResult["risks"][number]["severity"] {
  if (severity === "high") {
    return "HIGH";
  }

  if (severity === "low") {
    return "LOW";
  }

  return "MEDIUM";
}

function mapQuestionCategory(
  question: string,
  index: number
): InterviewQuestion["category"] {
  if (question.includes("到岗") || question.includes("周期") || question.includes("出勤")) {
    return "RISK_FOLLOW_UP";
  }

  if (question.includes("经验") || question.includes("职责") || question.includes("成果")) {
    return "EXPERIENCE";
  }

  if (index === 0) {
    return "TECHNICAL";
  }

  return "OTHER";
}

function chooseEvidenceIdsForQuestion(
  question: string,
  result: QuickScreeningResult,
  fallbackIds: string[]
): string[] {
  const matched = result.evidence.filter(
    (item) => item.relatedRequirement !== null && question.includes(item.relatedRequirement)
  );

  return matched.length > 0 ? matched.map((item) => item.id) : fallbackIds;
}

function chooseEvidenceIdsForStrength(
  strength: string,
  result: QuickScreeningResult,
  fallbackIds: string[],
  index: number
): string[] {
  const matched = result.evidence.filter(
    (item) => item.relatedRequirement !== null && strength.includes(item.relatedRequirement)
  );

  if (matched.length > 0) {
    return matched.map((item) => item.id);
  }

  return fallbackIds.length > 0 ? fallbackIds : [`ev_strength_${index + 1}`];
}

function chooseEvidenceIdsForRisk(
  risk: ScreeningRisk,
  result: QuickScreeningResult,
  fallbackIds: string[]
): string[] {
  const matched = result.evidence.filter(
    (item) =>
      item.relatedRequirement !== null && risk.description.includes(item.relatedRequirement)
  );

  return matched.length > 0 ? matched.map((item) => item.id) : fallbackIds;
}

function buildLegacyWeaknesses(
  result: QuickScreeningResult,
  fallbackIds: string[]
): Weakness[] {
  return result.missingInformation.slice(0, 5).map((item, index) => ({
    description: item,
    evidenceIds:
      result.evidence.length > 0
        ? [result.evidence[Math.min(index, result.evidence.length - 1)]?.id ?? fallbackIds[0] ?? `ev_weak_${index + 1}`]
        : [fallbackIds[0] ?? `ev_weak_${index + 1}`],
    severity: "MEDIUM",
    title: truncateText(item, 120)
  }));
}

function calculateMatchLevel(score: number): RobotArmRelevance {
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

function hasUsefulResumeSignals(text: string): boolean {
  return extractCompletenessSignals(text).length > 0;
}

function extractCompletenessSignals(text: string): string[] {
  const normalized = text.toLowerCase();
  const signals = new Set<string>();

  if (/project|项目|项目经历/.test(normalized)) {
    signals.add("项目");
  }

  if (/work|experience|经历|工作|实习|任职/.test(normalized)) {
    signals.add("工作经历");
  }

  if (/skill|skills|技能|技术栈|工具/.test(normalized)) {
    signals.add("技能");
  }

  if (/education|学校|学历|本科|学士|硕士|博士/.test(normalized)) {
    signals.add("教育");
  }

  return Array.from(signals);
}

function countCompletenessSignals(text: string): number {
  return extractCompletenessSignals(text).length;
}

function countStructuredLines(text: string): number {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && /[:：•·\-*]/.test(line)).length;
}

function hasAvailabilitySignal(text: string): boolean {
  return /availability|available|start date|start|到岗|周期|出勤|可投|实习/i.test(text);
}

function hasEducationSignal(text: string): boolean {
  return /education|school|degree|学历|教育|本科|学士|硕士|博士/i.test(text);
}

function hasBachelorSignal(text: string): boolean {
  return /bachelor|本科|学士/i.test(text);
}

function extractTerms(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .match(/[a-z0-9+#.]+|[\u3400-\u9fff]{2,}/gu)
    ?.map((token) => token.trim())
    .filter((token) => token.length > 1) ?? [];
  const seen = new Set<string>();

  return tokens.filter((token) => {
    if (GENERIC_ENGLISH_STOP_WORDS.has(token)) {
      return false;
    }

    if (seen.has(token)) {
      return false;
    }

    seen.add(token);
    return true;
  });
}

function normalizeRequirement(text: string): string {
  const trimmed = text.trim();

  if (/^(岗位|职位|job title|role)\s*[:：]/i.test(trimmed)) {
    return "";
  }

  const withoutLabel = trimmed.replace(
    /^(岗位要求|任职要求|要求|职责|负责|加分项|requirements?|qualifications?)\s*[:：]\s*/i,
    ""
  );

  return normalizeForMatching(withoutLabel).slice(0, MAX_REQUIREMENT_LENGTH);
}

function normalizeBodyText(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeInlineText(text: string | undefined): string | null {
  if (typeof text !== "string") {
    return null;
  }

  const normalized = text.trim().replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : null;
}

function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+\u3400-\u9fff#.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function uniqueRisks(values: ScreeningRisk[]): ScreeningRisk[] {
  const seen = new Set<string>();

  return values.filter((item) => {
    const key = `${item.title}|${item.description}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function clampToInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}
