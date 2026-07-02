import { z } from "zod";
import type { JobUnderstandingOutput } from "@/types/jobProfile";

const stringArraySchema = z.array(z.string().min(1)).default([]);

export const jobUnderstandingAiOutputSchema = z
  .object({
    coreResponsibilities: stringArraySchema,
    hiringFocus: stringArraySchema,
    interviewFocus: stringArraySchema,
    jobSummary: z.string().min(1),
    missingInformation: stringArraySchema,
    potentialRisks: stringArraySchema,
    preferredCompetencies: stringArraySchema,
    requiredCompetencies: stringArraySchema,
    suggestedFollowUpQuestions: stringArraySchema
  })
  .strict();

export class JobUnderstandingSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobUnderstandingSchemaValidationError";
  }
}

export function validateJobUnderstandingAiOutput(output: unknown): JobUnderstandingOutput {
  const result = jobUnderstandingAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new JobUnderstandingSchemaValidationError("AI 岗位理解输出不符合 schema。");
  }

  return result.data;
}
