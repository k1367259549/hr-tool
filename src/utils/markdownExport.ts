import type { DailyExportData, SpreadsheetAnalysisExportData } from "@/types/export";
import type { PlanScheduleItem } from "@/types/planner";

export function formatDailyReportMarkdown(data: DailyExportData): string {
  return [
    "# HR 每日报告",
    "",
    "## 日期",
    "",
    data.date,
    "",
    "## 每日记录",
    "",
    formatDailyLog(data),
    "",
    "## KPI 汇总",
    "",
    formatKpiSummary(data),
    "",
    "## AI 复盘",
    "",
    formatReview(data),
    "",
    "## 明日计划",
    "",
    formatPlan(data)
  ].join("\n");
}

export function formatSpreadsheetAnalysisMarkdown(data: SpreadsheetAnalysisExportData): string {
  const { analysis, upload } = data;

  return [
    "# Spreadsheet Analysis Report",
    "",
    "## File Information",
    "",
    `- File Name: ${upload.fileName}`,
    `- File Type: ${upload.fileType.toUpperCase()}`,
    `- Row Count: ${upload.rowCount ?? 0}`,
    `- Upload Status: ${upload.status}`,
    `- Uploaded At: ${upload.createdAt}`,
    `- Model: ${analysis.model}`,
    "",
    "## Summary",
    "",
    analysis.summary,
    "",
    "## Insights",
    "",
    analysis.insights,
    "",
    "## Problems",
    "",
    analysis.problems,
    "",
    "## Suggestions",
    "",
    analysis.suggestions,
    "",
    "## Generated At",
    "",
    analysis.createdAt
  ].join("\n");
}

function formatDailyLog(data: DailyExportData): string {
  const { log } = data;

  return [
    `- 职位：${formatOptionalText(log.position)}`,
    `- 来源：${formatOptionalText(log.source)}`,
    `- 渠道：${formatOptionalText(log.channel)}`,
    `- 岗位类型：${formatOptionalText(log.roleType)}`,
    `- 优先级：${formatOptionalText(log.priority)}`,
    "",
    "### 总结",
    "",
    formatOptionalText(log.summary),
    "",
    "### 问题",
    "",
    formatOptionalText(log.problems),
    "",
    "### 反思",
    "",
    formatOptionalText(log.reflection)
  ].join("\n");
}

function formatKpiSummary(data: DailyExportData): string {
  const { log } = data;

  return [
    `- 简历数：${log.resumeCount}`,
    `- 筛选数：${log.screenCount}`,
    `- 电话沟通数：${log.phoneCount}`,
    `- 面试数：${log.interviewCount}`,
    `- Offer 数：${log.offerCount}`,
    `- 入职数：${log.entryCount}`
  ].join("\n");
}

function formatReview(data: DailyExportData): string {
  if (!data.review) {
    return "该日期暂无 AI 复盘。";
  }

  const { review } = data;

  return [
    `- 评分：${review.score}/100`,
    `- 模型：${review.provider} / ${review.model}`,
    "",
    "### 总结",
    "",
    review.summary,
    "",
    "### 亮点",
    "",
    formatJsonText(review.strengths),
    "",
    "### 问题",
    "",
    formatJsonText(review.weaknesses),
    "",
    "### 建议",
    "",
    formatJsonText(review.suggestions)
  ].join("\n");
}

function formatPlan(data: DailyExportData): string {
  if (!data.plan) {
    return "该日期暂无明日计划。";
  }

  const { plan } = data;

  return [
    `- 优先级：${formatPriority(plan.priority)}`,
    `- 模型：${plan.provider} / ${plan.model}`,
    "",
    "### 日程",
    "",
    formatSchedule(plan.schedule),
    "",
    "### 重点任务",
    "",
    formatStringList(plan.priorityTasks),
    "",
    "### 目标",
    "",
    formatStringList(plan.goals),
    "",
    "### 风险",
    "",
    formatStringList(plan.risks),
    "",
    "### 预期结果",
    "",
    formatStringList(plan.expectedOutcomes)
  ].join("\n");
}

function formatSchedule(value: unknown): string {
  if (!Array.isArray(value)) {
    return "- 暂无日程。";
  }

  const items = value.filter(isScheduleItem);

  if (items.length === 0) {
    return "- 暂无日程。";
  }

  return items
    .map((item) => `- ${formatScheduleTime(item.time)}（${formatPriority(item.priority)}）：${item.content}`)
    .join("\n");
}

function isScheduleItem(value: unknown): value is PlanScheduleItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    isScheduleTime(item.time) &&
    typeof item.content === "string" &&
    isPriority(item.priority)
  );
}

function isScheduleTime(value: unknown): value is PlanScheduleItem["time"] {
  return value === "morning" || value === "afternoon" || value === "evening";
}

function isPriority(value: unknown): value is PlanScheduleItem["priority"] {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH";
}

function formatStringList(value: unknown): string {
  if (!Array.isArray(value)) {
    return "- 无。";
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);

  if (items.length === 0) {
    return "- 无。";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatJsonText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatJsonText(item)).join("\n");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return "无。";
}

function formatOptionalText(value: string | null): string {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue.length > 0 ? normalizedValue : "无。";
}

function formatScheduleTime(value: PlanScheduleItem["time"]): string {
  const labels: Record<PlanScheduleItem["time"], string> = {
    afternoon: "下午",
    evening: "晚上",
    morning: "上午"
  };

  return labels[value];
}

function formatPriority(value: PlanScheduleItem["priority"]): string {
  const labels: Record<PlanScheduleItem["priority"], string> = {
    HIGH: "高",
    LOW: "低",
    MEDIUM: "中"
  };

  return labels[value];
}
