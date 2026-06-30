import { z } from "zod";
import type { SpreadsheetAnalysisAiOutput } from "@/types/spreadsheet";

export const spreadsheetAnalysisAiOutputSchema = z
  .object({
    summary: z.string().min(1),
    insights: z.string().min(1),
    problems: z.string().min(1),
    suggestions: z.string().min(1)
  })
  .strict();

export class SpreadsheetAnalysisSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpreadsheetAnalysisSchemaValidationError";
  }
}

export function validateSpreadsheetAnalysisAiOutput(
  output: unknown
): SpreadsheetAnalysisAiOutput {
  const result = spreadsheetAnalysisAiOutputSchema.safeParse(output);

  if (!result.success) {
    throw new SpreadsheetAnalysisSchemaValidationError("AI 表格分析输出不符合 schema。");
  }

  return result.data;
}

