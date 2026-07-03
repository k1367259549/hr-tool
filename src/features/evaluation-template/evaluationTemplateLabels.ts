import type {
  EvaluationCriterionImportance,
  EvaluationTemplateStatus,
  EvaluationTemplateVersionStatus
} from "@/types/evaluationTemplate";

export const templateStatusLabels: Record<EvaluationTemplateStatus, string> = {
  ACTIVE: "启用",
  ARCHIVED: "已归档"
};

export const versionStatusLabels: Record<EvaluationTemplateVersionStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published"
};

export const criterionImportanceLabels: Record<EvaluationCriterionImportance, string> = {
  CONTEXTUAL: "结合场景判断",
  PREFERRED: "优先关注",
  REQUIRED: "重点关注"
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
