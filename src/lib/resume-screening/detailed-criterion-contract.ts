import { DetailedScreeningResultV2Schema } from "@/lib/resume-screening/schema";
import type { EvaluationCriterion } from "@/types/evaluationTemplate";
import type { DetailedScreeningResultV2 } from "@/types/resume-screening";

export type DetailedCriterionContractErrorCode =
  | "EVALUATION_CRITERIA_REQUIRED"
  | "EVALUATION_CRITERIA_INVALID"
  | "DETAILED_CRITERION_KEY_MISSING"
  | "DETAILED_CRITERION_KEY_UNKNOWN"
  | "DETAILED_CRITERION_KEY_DUPLICATE"
  | "DETAILED_CRITERION_RESULT_INVALID";

export type DetailedCriterionContractResult =
  | { success: true; result: DetailedScreeningResultV2 }
  | { success: false; code: DetailedCriterionContractErrorCode; message: string };

export function validateAndNormalizeDetailedCriterionAssessments(
  criteria: EvaluationCriterion[],
  result: DetailedScreeningResultV2
): DetailedCriterionContractResult {
  if (criteria.length === 0) {
    return failure("EVALUATION_CRITERIA_REQUIRED", "详细分析必须使用至少一项评价标准。");
  }

  const criteriaByKey = new Map<string, EvaluationCriterion>();

  for (const criterion of criteria) {
    if (!isCriterionValid(criterion) || criteriaByKey.has(criterion.key)) {
      return failure("EVALUATION_CRITERIA_INVALID", "评价标准 key 或标签无效或重复。");
    }

    criteriaByKey.set(criterion.key, criterion);
  }

  const assessmentsByKey = new Map<string, DetailedScreeningResultV2["criterionAssessments"][number]>();

  for (const assessment of result.criterionAssessments) {
    if (assessmentsByKey.has(assessment.criterionKey)) {
      return failure("DETAILED_CRITERION_KEY_DUPLICATE", "详细分析返回了重复的 criterionKey。");
    }

    if (!criteriaByKey.has(assessment.criterionKey)) {
      return failure("DETAILED_CRITERION_KEY_UNKNOWN", "详细分析返回了未知的 criterionKey。");
    }

    assessmentsByKey.set(assessment.criterionKey, assessment);
  }

  for (const criterion of criteria) {
    if (!assessmentsByKey.has(criterion.key)) {
      return failure("DETAILED_CRITERION_KEY_MISSING", "详细分析遗漏了评价标准 criterionKey。");
    }
  }

  const normalized = {
    ...result,
    criterionAssessments: criteria.map((criterion) => {
      const assessment = assessmentsByKey.get(criterion.key);

      if (!assessment) {
        throw new Error("Validated criterion assessment is missing.");
      }

      return {
        ...assessment,
        criterionLabel: criterion.label
      };
    })
  };
  const parsed = DetailedScreeningResultV2Schema.safeParse(normalized);

  if (!parsed.success) {
    return failure(
      "DETAILED_CRITERION_RESULT_INVALID",
      parsed.error.issues[0]?.message ?? "详细分析逐项结果格式无效。"
    );
  }

  return { result: parsed.data, success: true };
}

function isCriterionValid(criterion: EvaluationCriterion): boolean {
  return (
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(criterion.key) &&
    criterion.label.trim().length > 0
  );
}

function failure(code: DetailedCriterionContractErrorCode, message: string) {
  return { code, message, success: false } as const;
}
