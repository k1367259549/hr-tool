import { z } from "zod";
import type { CandidateInsightOutput } from "@/types/candidateUnderstanding";

const stringArraySchema = z.array(z.string().min(1)).default([]);

const candidateInsightEvidenceSchema = z
  .object({
    claim: z.string().min(1),
    quote: z.string().min(1).optional(),
    sourceChunkIds: z.array(z.string().min(1)).default([])
  })
  .strict();

export const candidateUnderstandingAiOutputSchema = z
  .object({
    evidence: z.array(candidateInsightEvidenceSchema).default([]),
    insights: z
      .object({
        contextSignals: stringArraySchema,
        jobRelevantExperience: stringArraySchema.optional(),
        openQuestions: stringArraySchema,
        relevantExperience: stringArraySchema,
        transferableStrengths: stringArraySchema
      })
      .strict()
      .transform((value) => ({
        contextSignals: value.contextSignals,
        openQuestions: value.openQuestions,
        relevantExperience: value.relevantExperience,
        transferableStrengths: value.transferableStrengths
      })),
    missingInformation: stringArraySchema,
    potentialRisks: stringArraySchema,
    strengths: stringArraySchema,
    suggestedInterviewQuestions: stringArraySchema,
    suggestedNextActions: stringArraySchema,
    suggestedPhoneScreenQuestions: stringArraySchema,
    summary: z
      .object({
        candidateOverview: z.string().min(1),
        evidenceCoverage: z.string().min(1),
        roleContextUnderstanding: z.string().min(1)
      })
      .strict()
  })
  .strict();

export class CandidateUnderstandingSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateUnderstandingSchemaValidationError";
  }
}

export function validateCandidateUnderstandingAiOutput(output: unknown): CandidateInsightOutput {
  assertNoForbiddenFields(output);
  const result = candidateUnderstandingAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new CandidateUnderstandingSchemaValidationError("AI 候选人理解输出不符合 schema。");
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
      throw new CandidateUnderstandingSchemaValidationError("AI 输出包含禁止的评分或决策字段。");
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
    "classification",
    "evaluationcriteria"
  ];

  return forbiddenKeys.includes(normalizedKey);
}
