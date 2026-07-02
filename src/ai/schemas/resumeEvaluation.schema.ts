import { z } from "zod";
import type { ResumeEvaluateOutput } from "@/types/resumeEvaluation";

// Legacy V1 schema for `/api/ai/resume-evaluate`.
// V2 Candidate Understanding uses its own score-free schema.
export const resumeEvaluationAiOutputSchema = z
  .object({
    summary: z.string().min(1),
    strengths: z.array(z.string().min(1)),
    risks: z.array(z.string().min(1)),
    matchScore: z.number().int().min(0).max(100),
    interviewQuestions: z.array(z.string().min(1))
  })
  .strict();

export class ResumeEvaluationSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeEvaluationSchemaValidationError";
  }
}

export function validateResumeEvaluationAiOutput(output: unknown): ResumeEvaluateOutput {
  const result = resumeEvaluationAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new ResumeEvaluationSchemaValidationError(
      "AI resume evaluation output does not match schema."
    );
  }

  return result.data;
}
