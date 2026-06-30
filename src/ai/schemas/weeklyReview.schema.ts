import { z } from "zod";
import type { WeeklyReviewAiOutput } from "@/types/weeklyReview";

export const weeklyReviewAiOutputSchema = z
  .object({
    summary: z.string().min(1),
    keyMetrics: z.string().min(1),
    strengths: z.string().min(1),
    weaknesses: z.string().min(1),
    suggestions: z.string().min(1),
    nextWeekFocus: z.string().min(1),
    score: z.number().int().min(0).max(100)
  })
  .strict();

export class WeeklyReviewSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeeklyReviewSchemaValidationError";
  }
}

export function validateWeeklyReviewAiOutput(output: unknown): WeeklyReviewAiOutput {
  const result = weeklyReviewAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new WeeklyReviewSchemaValidationError("AI weekly review output does not match schema.");
  }

  return result.data;
}
