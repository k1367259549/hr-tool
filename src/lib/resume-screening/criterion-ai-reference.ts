import type {
  CriterionAiReferenceDto
} from "@/types/resumeEvaluationResult";
import type { DetailedCriterionAssessment } from "@/types/resume-screening";
import type { EvaluationCriterion } from "@/types/evaluationTemplate";

export type CriterionAiReferenceMappingErrorCode =
  | "TEMPLATE_CRITERION_KEY_INVALID"
  | "TEMPLATE_CRITERION_KEY_DUPLICATE"
  | "ASSESSMENT_CRITERION_KEY_DUPLICATE"
  | "ASSESSMENT_CRITERION_KEY_MISSING"
  | "ASSESSMENT_CRITERION_KEY_UNKNOWN";

export type CriterionAiReferenceMappingResult =
  | { success: true; references: CriterionAiReferenceDto[] }
  | {
      success: false;
      code: CriterionAiReferenceMappingErrorCode;
      message: string;
    };

export function mapCriterionAssessmentsToAiReferences(
  criteria: EvaluationCriterion[],
  assessments: DetailedCriterionAssessment[]
): CriterionAiReferenceMappingResult {
  const criteriaByKey = new Map<string, EvaluationCriterion>();

  for (const criterion of criteria) {
    if (!isStableCriterionKey(criterion.key)) {
      return failure("TEMPLATE_CRITERION_KEY_INVALID", "评价标准 criterion key 无效。");
    }

    if (criteriaByKey.has(criterion.key)) {
      return failure("TEMPLATE_CRITERION_KEY_DUPLICATE", "评价标准包含重复 criterion key。");
    }

    criteriaByKey.set(criterion.key, criterion);
  }

  const assessmentsByKey = new Map<string, DetailedCriterionAssessment>();

  for (const assessment of assessments) {
    if (assessmentsByKey.has(assessment.criterionKey)) {
      return failure(
        "ASSESSMENT_CRITERION_KEY_DUPLICATE",
        "AI 详细分析包含重复 criterion key。"
      );
    }

    if (!criteriaByKey.has(assessment.criterionKey)) {
      return failure(
        "ASSESSMENT_CRITERION_KEY_UNKNOWN",
        "AI 详细分析包含当前模板中不存在的 criterion key。"
      );
    }

    assessmentsByKey.set(assessment.criterionKey, assessment);
  }

  const references: CriterionAiReferenceDto[] = [];

  for (const criterion of criteria) {
    const assessment = assessmentsByKey.get(criterion.key);

    if (!assessment) {
      return failure(
        "ASSESSMENT_CRITERION_KEY_MISSING",
        "AI 详细分析缺少当前模板评价标准的逐项结果。"
      );
    }

    references.push({
      conclusion: assessment.conclusion,
      criterionKey: criterion.key,
      criterionLabel: criterion.label,
      evidence: assessment.evidence.map((item) => ({ ...item })),
      interviewQuestions: [...assessment.interviewQuestions],
      missingInformation: [...assessment.missingInformation],
      risks: [...assessment.risks],
      score: assessment.score,
      status: "AVAILABLE"
    });
  }

  return { references, success: true };
}

function isStableCriterionKey(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
}

function failure(code: CriterionAiReferenceMappingErrorCode, message: string) {
  return { code, message, success: false } as const;
}
