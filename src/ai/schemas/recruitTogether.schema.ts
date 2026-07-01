import { z } from "zod";
import type {
  InterviewPreparationOutput,
  RecruiterSummaryOutput,
  PhoneScreenPreparationOutput
} from "@/types/recruitTogether";

const stringArraySchema = z.array(z.string().min(1)).default([]);

export const phoneScreenPreparationSchema = z
  .object({
    conversationChecklist: stringArraySchema,
    conversationGoals: stringArraySchema,
    informationToConfirm: stringArraySchema,
    keyVerificationQuestions: stringArraySchema,
    riskVerificationQuestions: stringArraySchema,
    suggestedOpening: z.string().min(1),
    thingsToAvoid: stringArraySchema
  })
  .strict();

export const interviewPreparationSchema = z
  .object({
    evidenceToVerify: stringArraySchema,
    highPriorityTopics: stringArraySchema,
    interviewFocus: stringArraySchema,
    missingInformation: stringArraySchema,
    possibleFollowUpQuestions: stringArraySchema,
    suggestedQuestions: stringArraySchema
  })
  .strict();

export const recruiterSummarySchema = z
  .object({
    candidateTimeline: stringArraySchema,
    confirmedFacts: stringArraySchema,
    recruiterNotesSummary: z.string().min(1),
    suggestedNextRecruiterActions: stringArraySchema,
    openQuestions: stringArraySchema,
    unconfirmedFacts: stringArraySchema
  })
  .strict();

export class RecruitTogetherSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecruitTogetherSchemaValidationError";
  }
}

export function validatePhoneScreenPreparationOutput(
  output: unknown
): PhoneScreenPreparationOutput {
  assertNoForbiddenFields(output);
  const result = phoneScreenPreparationSchema.safeParse(output);

  if (!result.success) {
    throw new RecruitTogetherSchemaValidationError("AI 电话初筛准备输出不符合 schema。");
  }

  return result.data;
}

export function validateInterviewPreparationOutput(output: unknown): InterviewPreparationOutput {
  assertNoForbiddenFields(output);
  const result = interviewPreparationSchema.safeParse(output);

  if (!result.success) {
    throw new RecruitTogetherSchemaValidationError("AI 面试准备输出不符合 schema。");
  }

  return result.data;
}

export function validateRecruiterSummaryOutput(output: unknown): RecruiterSummaryOutput {
  assertNoForbiddenFields(output);
  const result = recruiterSummarySchema.safeParse(output);

  if (!result.success) {
    throw new RecruitTogetherSchemaValidationError("AI 招聘协作总结输出不符合 schema。");
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
      throw new RecruitTogetherSchemaValidationError("AI 输出包含禁止的评分或决策字段。");
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
    "decision",
    "passfail"
  ];

  return forbiddenKeys.includes(normalizedKey);
}
