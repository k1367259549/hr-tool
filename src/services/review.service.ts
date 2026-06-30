import { createHash } from "node:crypto";
import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validateReviewAiOutput } from "@/ai/schemas/review.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { reviewRepository } from "@/repositories/review.repository";
import { logService } from "@/services/log.service";
import type { JsonObject, JsonValue } from "@/types/ai";
import type { RecruitLog } from "@/types/log";
import type {
  DailyReview,
  DailyReviewRepositoryUpsertInput,
  ReviewAiOutput,
  ReviewGenerateInput
} from "@/types/review";

const reviewPromptFile = "review.md";
const reviewPromptVersion = "1.0";

export type ReviewServiceErrorCode = "LOG_NOT_FOUND" | "AI_ERROR" | "VALIDATION_ERROR";

export class ReviewServiceError extends Error {
  readonly code: ReviewServiceErrorCode;

  constructor(code: ReviewServiceErrorCode, message: string) {
    super(message);
    this.name = "ReviewServiceError";
    this.code = code;
  }
}

export const reviewService = {
  async generateReview(input: ReviewGenerateInput): Promise<DailyReview> {
    const log = await logService.getLogByDate(input.date);

    if (!log) {
      throw new ReviewServiceError("LOG_NOT_FOUND", "Log not found.");
    }

    const promptInput = createReviewPromptInput(log);
    const rawOutput = await generateReviewOutput(promptInput);
    const reviewOutput = parseAndValidateReviewOutput(rawOutput);
    const repositoryInput = createRepositoryInput(log.id, promptInput, rawOutput, reviewOutput);

    return reviewRepository.upsertByLogId(repositoryInput);
  },

  async getReviewByDate(input: ReviewGenerateInput): Promise<DailyReview | null> {
    const log = await logService.getLogByDate(input.date);

    if (!log) {
      return null;
    }

    return reviewRepository.findByLogId(log.id);
  }
};

async function generateReviewOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      feature: "review",
      promptFile: reviewPromptFile,
      variables: {
        INPUT: promptInput
      },
      model: aiConfig.defaultModel,
      provider: aiConfig.defaultProvider,
      temperature: aiConfig.defaultTemperature
    });
  } catch {
    throw new ReviewServiceError("AI_ERROR", "AI review generation failed.");
  }
}

function parseAndValidateReviewOutput(rawOutput: string): ReviewAiOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validateReviewAiOutput(parsedJson);
  } catch {
    throw new ReviewServiceError("AI_ERROR", "AI review output is invalid.");
  }
}

function createReviewPromptInput(log: RecruitLog): JsonObject {
  return {
    id: log.id,
    date: log.date.toISOString(),
    position: log.position,
    resumeCount: log.resumeCount,
    screenCount: log.screenCount,
    phoneCount: log.phoneCount,
    interviewCount: log.interviewCount,
    offerCount: log.offerCount,
    entryCount: log.entryCount,
    summary: log.summary,
    problems: log.problems,
    reflection: log.reflection
  };
}

function createRepositoryInput(
  logId: string,
  promptInput: JsonObject,
  rawOutput: string,
  reviewOutput: ReviewAiOutput
): DailyReviewRepositoryUpsertInput {
  const parsedOutput: JsonObject = {
    summary: reviewOutput.summary,
    strengths: reviewOutput.strengths,
    weaknesses: reviewOutput.weaknesses,
    suggestions: reviewOutput.suggestions,
    score: reviewOutput.score
  };

  return {
    logId,
    summary: reviewOutput.summary,
    strengths: reviewOutput.strengths,
    weaknesses: reviewOutput.weaknesses,
    suggestions: reviewOutput.suggestions,
    score: reviewOutput.score,
    provider: aiConfig.defaultProvider,
    model: aiConfig.defaultModel,
    promptFile: reviewPromptFile,
    promptVersion: reviewPromptVersion,
    inputHash: createInputHash(promptInput),
    rawOutput,
    parsedOutput
  };
}

function createInputHash(input: JsonObject): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}
