import type { DailyExportData } from "@/types/export";
import type { PlanScheduleItem } from "@/types/planner";

export function formatDailyReportMarkdown(data: DailyExportData): string {
  return [
    "# HR Daily Report",
    "",
    "## Date",
    "",
    data.date,
    "",
    "## Daily Log",
    "",
    formatDailyLog(data),
    "",
    "## KPI Summary",
    "",
    formatKpiSummary(data),
    "",
    "## AI Review",
    "",
    formatReview(data),
    "",
    "## Tomorrow Plan",
    "",
    formatPlan(data)
  ].join("\n");
}

function formatDailyLog(data: DailyExportData): string {
  const { log } = data;

  return [
    `- Position: ${formatOptionalText(log.position)}`,
    `- Source: ${formatOptionalText(log.source)}`,
    `- Channel: ${formatOptionalText(log.channel)}`,
    `- Role Type: ${formatOptionalText(log.roleType)}`,
    `- Priority: ${formatOptionalText(log.priority)}`,
    "",
    "### Summary",
    "",
    formatOptionalText(log.summary),
    "",
    "### Problems",
    "",
    formatOptionalText(log.problems),
    "",
    "### Reflection",
    "",
    formatOptionalText(log.reflection)
  ].join("\n");
}

function formatKpiSummary(data: DailyExportData): string {
  const { log } = data;

  return [
    `- Resume Count: ${log.resumeCount}`,
    `- Screen Count: ${log.screenCount}`,
    `- Phone Count: ${log.phoneCount}`,
    `- Interview Count: ${log.interviewCount}`,
    `- Offer Count: ${log.offerCount}`,
    `- Entry Count: ${log.entryCount}`
  ].join("\n");
}

function formatReview(data: DailyExportData): string {
  if (!data.review) {
    return "No AI review generated for this date.";
  }

  const { review } = data;

  return [
    `- Score: ${review.score}/100`,
    `- Model: ${review.provider} / ${review.model}`,
    "",
    "### Summary",
    "",
    review.summary,
    "",
    "### Strengths",
    "",
    formatJsonText(review.strengths),
    "",
    "### Weaknesses",
    "",
    formatJsonText(review.weaknesses),
    "",
    "### Suggestions",
    "",
    formatJsonText(review.suggestions)
  ].join("\n");
}

function formatPlan(data: DailyExportData): string {
  if (!data.plan) {
    return "No tomorrow plan generated for this date.";
  }

  const { plan } = data;

  return [
    `- Priority: ${plan.priority}`,
    `- Model: ${plan.provider} / ${plan.model}`,
    "",
    "### Schedule",
    "",
    formatSchedule(plan.schedule),
    "",
    "### Priority Tasks",
    "",
    formatStringList(plan.priorityTasks),
    "",
    "### Goals",
    "",
    formatStringList(plan.goals),
    "",
    "### Risks",
    "",
    formatStringList(plan.risks),
    "",
    "### Expected Outcomes",
    "",
    formatStringList(plan.expectedOutcomes)
  ].join("\n");
}

function formatSchedule(value: unknown): string {
  if (!Array.isArray(value)) {
    return "- No schedule provided.";
  }

  const items = value.filter(isScheduleItem);

  if (items.length === 0) {
    return "- No schedule provided.";
  }

  return items
    .map((item) => `- ${capitalize(item.time)} (${item.priority}): ${item.content}`)
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
    return "- None.";
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.length > 0);

  if (items.length === 0) {
    return "- None.";
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

  return "None.";
}

function formatOptionalText(value: string | null): string {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue.length > 0 ? normalizedValue : "None.";
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
