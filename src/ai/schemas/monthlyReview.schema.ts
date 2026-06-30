import { z } from "zod";
import type { MonthlyReviewAiOutput } from "@/types/monthlyReview";

export const monthlyReviewAiOutputSchema = z
  .object({
    summary: z.string().min(1),
    keyMetrics: z.string().min(1),
    majorAchievements: z.string().min(1),
    mainProblems: z.string().min(1),
    suggestions: z.string().min(1),
    nextMonthFocus: z.string().min(1),
    score: z.number().int().min(0).max(100)
  })
  .strict();

export class MonthlyReviewSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonthlyReviewSchemaValidationError";
  }
}

export function validateMonthlyReviewAiOutput(output: unknown): MonthlyReviewAiOutput {
  const result = monthlyReviewAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new MonthlyReviewSchemaValidationError(
      "AI monthly review output does not match schema."
    );
  }

  return result.data;
}
