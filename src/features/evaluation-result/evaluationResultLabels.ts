import type {
  CriterionEvidenceAssessment,
  ResumeEvaluationStatus
} from "@/types/resumeEvaluationResult";

export const evaluationStatusLabels: Record<ResumeEvaluationStatus, string> = {
  DRAFT: "草稿",
  REVIEWED: "已审阅"
};

export const criterionAssessmentLabels: Record<CriterionEvidenceAssessment, string> = {
  NOT_APPLICABLE: "不适用",
  NOT_ASSESSED: "未评估",
  NOT_SUPPORTED: "无支撑",
  PARTIALLY_SUPPORTED: "部分支撑",
  SUPPORTED: "有支撑"
};

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
