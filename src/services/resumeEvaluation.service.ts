import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validateResumeEvaluationAiOutput } from "@/ai/schemas/resumeEvaluation.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { logger } from "@/lib/logger";
import type { JsonObject, JsonValue } from "@/types/ai";
import type { ResumeEvaluateInput, ResumeEvaluateOutput } from "@/types/resumeEvaluation";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";

const resumeEvaluationPromptFile = "resume-evaluation.md";
const maxInputLength = 30000;

export type ResumeEvaluationServiceErrorCode = "AI_ERROR" | "VALIDATION_ERROR";

export class ResumeEvaluationServiceError extends Error {
  readonly code: ResumeEvaluationServiceErrorCode;

  constructor(code: ResumeEvaluationServiceErrorCode, message: string) {
    super(message);
    this.name = "ResumeEvaluationServiceError";
    this.code = code;
  }
}

export const resumeEvaluationService = {
  async evaluateResume(input: ResumeEvaluateInput): Promise<ResumeEvaluateOutput> {
    const normalizedInput = validateResumeEvaluateInput(input);

    logger.info("Resume evaluation started.", {
      feature: "resume-evaluate",
      jobDescriptionLength: normalizedInput.jobDescription.length,
      resumeTextLength: normalizedInput.resumeText.length
    });

    const rawOutput = await generateResumeEvaluationOutput(createPromptInput(normalizedInput));
    const evaluation = parseAndValidateResumeEvaluationOutput(rawOutput);

    logger.info("Resume evaluation completed.", {
      feature: "resume-evaluate",
      matchScore: evaluation.matchScore
    });

    return evaluation;
  }
};

function validateResumeEvaluateInput(input: ResumeEvaluateInput): ResumeEvaluateInput {
  const resumeText = normalizeRequiredText(input.resumeText, "resumeText");
  const jobDescription = normalizeRequiredText(input.jobDescription, "jobDescription");

  return {
    resumeText,
    jobDescription
  };
}

function normalizeRequiredText(value: string, field: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new ResumeEvaluationServiceError("VALIDATION_ERROR", `${field} 为必填项。`);
  }

  if (normalizedValue.length > maxInputLength) {
    throw new ResumeEvaluationServiceError(
      "VALIDATION_ERROR",
      `${field} 不能超过 ${maxInputLength} 个字符。`
    );
  }

  return normalizedValue;
}

function createPromptInput(input: ResumeEvaluateInput): JsonObject {
  return {
    resumeText: input.resumeText,
    jobDescription: input.jobDescription
  };
}

async function generateResumeEvaluationOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      feature: "resume-evaluate",
      promptFile: resumeEvaluationPromptFile,
      variables: {
        INPUT: promptInput
      },
      model: aiConfig.defaultModel,
      provider: aiConfig.defaultProvider,
      temperature: aiConfig.defaultTemperature
    });
  } catch (error) {
    throw new ResumeEvaluationServiceError(
      "AI_ERROR",
      getSafeAiErrorMessage(error, "简历评估生成失败。")
    );
  }
}

function parseAndValidateResumeEvaluationOutput(rawOutput: string): ResumeEvaluateOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validateResumeEvaluationAiOutput(parsedJson);
  } catch {
    throw new ResumeEvaluationServiceError("AI_ERROR", "AI 简历评估输出无效。");
  }
}
