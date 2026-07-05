import type { ResumeEvaluationResult } from "@/types/evaluation-output";

export type EvaluationOutputQualityResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const genericOutputError = "AI evaluation output is too generic or lacks evidence.";
const requiredDimensionKeys = [
  "jd-match",
  "experience-relevance",
  "skill-match",
  "communication-signal",
  "risk-and-missing-info"
] as const;

const genericTextPatterns = [
  /^n\/a$/i,
  /^none$/i,
  /^暂无$/,
  /^无$/,
  /^not enough evidence\.?$/i,
  /^insufficient evidence only\.?$/i,
  /^no evaluation summary provided\.?$/i,
  /^no clear strength\.?$/i,
  /^no clear weakness\.?$/i,
  /^no clear risk\.?$/i,
  /^no description provided\.?$/i,
  /^no evidence provided\.?$/i
];

export function validateEvaluationOutputQuality(
  output: ResumeEvaluationResult
): EvaluationOutputQualityResult {
  if (!hasDetailedSummary(output.overallSummary)) {
    return fail();
  }

  if (
    output.strengths.length < 2 ||
    output.weaknesses.length < 2 ||
    output.risks.length < 1 ||
    output.evidence.length < 2 ||
    output.dimensionScores.length < requiredDimensionKeys.length ||
    output.interviewQuestions.length < 5
  ) {
    return fail();
  }

  if (
    !hasRequiredDimensionKeys(output) ||
    hasGenericText(output.strengths.flatMap((item) => [item.title, item.description])) ||
    hasGenericText(output.weaknesses.flatMap((item) => [item.title, item.description])) ||
    hasGenericText(output.risks.map((item) => item.description)) ||
    hasGenericText(output.evidence.map((item) => item.text)) ||
    hasGenericText(
      output.interviewQuestions.flatMap((item) => [item.question, item.purpose])
    )
  ) {
    return fail();
  }

  return {
    success: true
  };
}

function hasDetailedSummary(summary: string): boolean {
  if (isGenericText(summary)) {
    return false;
  }

  const chineseCharacterCount = countChineseCharacters(summary);
  const englishWordCount = countEnglishWords(summary);

  return chineseCharacterCount >= 80 || englishWordCount >= 40;
}

function hasRequiredDimensionKeys(output: ResumeEvaluationResult): boolean {
  const dimensionKeys = new Set(output.dimensionScores.map((item) => item.key));

  return requiredDimensionKeys.every((key) => dimensionKeys.has(key));
}

function hasGenericText(values: string[]): boolean {
  return values.some(isGenericText);
}

function isGenericText(value: string): boolean {
  const normalized = value.trim();

  return (
    normalized.length === 0 ||
    genericTextPatterns.some((pattern) => pattern.test(normalized))
  );
}

function countChineseCharacters(value: string): number {
  return value.match(/[\u3400-\u9fff]/g)?.length ?? 0;
}

function countEnglishWords(value: string): number {
  return value.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
}

function fail(): EvaluationOutputQualityResult {
  return {
    success: false,
    error: genericOutputError
  };
}
