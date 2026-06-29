import { z } from "zod";
import type { ReviewAiOutput } from "@/types/review";

export const reviewAiOutputSchema = z
  .object({
    summary: z.string().min(1),
    strengths: z.string().min(1),
    weaknesses: z.string().min(1),
    suggestions: z.string().min(1),
    score: z.number().int().min(0).max(100)
  })
  .strict();

export class ReviewSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewSchemaValidationError";
  }
}

export function validateReviewAiOutput(output: unknown): ReviewAiOutput {
  const result = reviewAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new ReviewSchemaValidationError("AI review output does not match schema.");
  }

  return result.data;
}
