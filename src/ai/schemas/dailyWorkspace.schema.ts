import { z } from "zod";
import type {
  DailyInsightsOutput,
  DailySummaryOutput,
  ImprovementSuggestionsOutput,
  TomorrowPrioritiesOutput
} from "@/types/dailyWorkspace";

const stringArraySchema = z.array(z.string().min(1)).default([]);

const unifiedOutputSchema = {
  attention: stringArraySchema,
  audit: stringArraySchema,
  confidence: z.string().min(1),
  evidence: stringArraySchema,
  insights: stringArraySchema,
  suggestedActions: stringArraySchema,
  summary: z.string().min(1)
};

export const dailySummarySchema = z
  .object({
    ...unifiedOutputSchema,
    candidatesProcessed: stringArraySchema,
    interviewsCompleted: stringArraySchema,
    jobsWorkedOn: stringArraySchema,
    keyAchievements: stringArraySchema,
    pendingWork: stringArraySchema,
    phoneScreensCompleted: stringArraySchema,
    todaysWorkSummary: z.string().min(1)
  })
  .strict();

export const dailyInsightsSchema = z
  .object({
    ...unifiedOutputSchema,
    attentionPoints: stringArraySchema,
    candidateUnderstandingImprovements: stringArraySchema,
    evidenceCoverage: stringArraySchema,
    jobUnderstandingImprovements: stringArraySchema,
    recruitingObservations: stringArraySchema,
    repeatedCandidateRisks: stringArraySchema,
    repeatedMissingInformation: stringArraySchema,
    todaysRecruitingInsights: stringArraySchema
  })
  .strict();

export const tomorrowPrioritiesSchema = z
  .object({
    ...unifiedOutputSchema,
    candidatesToContact: stringArraySchema,
    candidatesWaitingFollowUp: stringArraySchema,
    highPriorityTasks: stringArraySchema,
    interviewsToPrepare: stringArraySchema,
    missingInformationToVerify: stringArraySchema,
    recruiterSuggestions: stringArraySchema
  })
  .strict();

export const improvementSuggestionsSchema = z
  .object({
    ...unifiedOutputSchema,
    aiSuggestions: stringArraySchema,
    potentialProductImprovementNotes: stringArraySchema,
    promptImprovementIdeas: stringArraySchema,
    recruiterEfficiencySuggestions: stringArraySchema,
    workflowImprovementIdeas: stringArraySchema
  })
  .strict();

export class DailyWorkspaceSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyWorkspaceSchemaValidationError";
  }
}

export function validateDailySummaryOutput(output: unknown): DailySummaryOutput {
  assertNoForbiddenFields(output);
  const result = dailySummarySchema.safeParse(output);

  if (!result.success) {
    throw new DailyWorkspaceSchemaValidationError("AI 每日总结输出不符合 schema。");
  }

  return result.data;
}

export function validateDailyInsightsOutput(output: unknown): DailyInsightsOutput {
  assertNoForbiddenFields(output);
  const result = dailyInsightsSchema.safeParse(output);

  if (!result.success) {
    throw new DailyWorkspaceSchemaValidationError("AI 招聘洞察输出不符合 schema。");
  }

  return result.data;
}

export function validateTomorrowPrioritiesOutput(output: unknown): TomorrowPrioritiesOutput {
  assertNoForbiddenFields(output);
  const result = tomorrowPrioritiesSchema.safeParse(output);

  if (!result.success) {
    throw new DailyWorkspaceSchemaValidationError("AI 明日优先级输出不符合 schema。");
  }

  return result.data;
}

export function validateImprovementSuggestionsOutput(
  output: unknown
): ImprovementSuggestionsOutput {
  assertNoForbiddenFields(output);
  const result = improvementSuggestionsSchema.safeParse(output);

  if (!result.success) {
    throw new DailyWorkspaceSchemaValidationError("AI 改进建议输出不符合 schema。");
  }

  return result.data;
}

function assertNoForbiddenFields(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoForbiddenFields);
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (isForbiddenField(key)) {
      throw new DailyWorkspaceSchemaValidationError("AI 输出包含禁止的自动决策或学习字段。");
    }

    assertNoForbiddenFields(nestedValue);
  }
}

function isForbiddenField(key: string): boolean {
  const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
  const forbiddenKeys = [
    "score",
    "matchscore",
    "ranking",
    "rank",
    "hirerecommendation",
    "rejectrecommendation",
    "offerrecommendation",
    "classification",
    "learningasset",
    "learningassets",
    "autolearn",
    "autoupdate"
  ];

  return forbiddenKeys.includes(normalizedKey);
}
