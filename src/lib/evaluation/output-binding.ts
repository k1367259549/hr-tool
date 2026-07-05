import { normalizeResumeEvaluationResult } from "@/lib/evaluation/normalizer";
import { ResumeEvaluationSchema } from "@/lib/evaluation/schema";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

export type EvaluationRunOutputBindingResult =
  | {
      success: true;
      output: ResumeEvaluationResult;
    }
  | {
      success: false;
      error: string;
    };

export function bindEvaluationRunOutput(
  input: unknown
): EvaluationRunOutputBindingResult {
  const normalized = normalizeResumeEvaluationResult(input);

  if (!normalized.success) {
    return {
      success: false,
      error: normalized.error
    };
  }

  const validated = ResumeEvaluationSchema.safeParse(normalized.data);

  if (!validated.success) {
    return {
      success: false,
      error:
        validated.error.issues[0]?.message ??
        "EvaluationRun output does not match ResumeEvaluationSchema."
    };
  }

  return {
    success: true,
    output: validated.data
  };
}
