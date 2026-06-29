import { createHash } from "node:crypto";
import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validatePlannerAiOutput } from "@/ai/schemas/planner.schema";
import { aiService } from "@/ai/ai.service";
import { plannerRepository } from "@/repositories/planner.repository";
import { reviewRepository } from "@/repositories/review.repository";
import { logService } from "@/services/log.service";
import type { JsonObject, JsonValue } from "@/types/ai";
import type { RecruitLog } from "@/types/log";
import type { DailyReview } from "@/types/review";
import type {
  DailyPlan,
  DailyPlanRepositoryCreateInput,
  PlannerAiOutput,
  PlannerGenerateInput
} from "@/types/planner";
import { parseLogDate } from "@/utils/logValidation";

const plannerPromptFile = "planner.md";
const plannerPromptVersion = "1.0";
const plannerProvider = "openai";
const plannerModel = "gpt-4.1";
const plannerTemperature = 0.2;

export type PlannerServiceErrorCode = "LOG_NOT_FOUND" | "AI_ERROR" | "VALIDATION_ERROR";

export class PlannerServiceError extends Error {
  readonly code: PlannerServiceErrorCode;

  constructor(code: PlannerServiceErrorCode, message: string) {
    super(message);
    this.name = "PlannerServiceError";
    this.code = code;
  }
}

export const plannerService = {
  async generatePlan(input: PlannerGenerateInput): Promise<DailyPlan> {
    const targetDate = parsePlannerDate(input.date);
    const sourceDate = getPreviousDate(targetDate);
    const log = await logService.getLogByDate(sourceDate);

    if (!log) {
      throw new PlannerServiceError("LOG_NOT_FOUND", "Previous day log not found.");
    }

    const review = await reviewRepository.findByLogId(log.id);
    const promptInput = createPlannerPromptInput(targetDate, log, review);
    const rawOutput = await generatePlannerOutput(promptInput);
    const plannerOutput = parseAndValidatePlannerOutput(rawOutput);
    validatePlannerOutputDate(plannerOutput, targetDate);
    const repositoryInput = createRepositoryInput(
      targetDate,
      log.id,
      review?.id,
      promptInput,
      rawOutput,
      plannerOutput
    );

    return plannerRepository.create(repositoryInput);
  },

  async getPlanByDate(input: PlannerGenerateInput): Promise<DailyPlan | null> {
    const date = parsePlannerDate(input.date);

    return plannerRepository.findLatestByDate(date);
  }
};

async function generatePlannerOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      promptFile: plannerPromptFile,
      variables: {
        INPUT: promptInput
      },
      model: plannerModel,
      temperature: plannerTemperature
    });
  } catch {
    throw new PlannerServiceError("AI_ERROR", "AI plan generation failed.");
  }
}

function parseAndValidatePlannerOutput(rawOutput: string): PlannerAiOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validatePlannerAiOutput(parsedJson);
  } catch {
    throw new PlannerServiceError("AI_ERROR", "AI planner output is invalid.");
  }
}

function parsePlannerDate(value: PlannerGenerateInput["date"]): Date {
  try {
    return parseLogDate(value);
  } catch {
    throw new PlannerServiceError("VALIDATION_ERROR", "Date must be a valid date.");
  }
}

function validatePlannerOutputDate(plannerOutput: PlannerAiOutput, targetDate: Date): void {
  const outputDate = parsePlannerDate(plannerOutput.date);

  if (outputDate.getTime() !== targetDate.getTime()) {
    throw new PlannerServiceError("AI_ERROR", "AI planner output date does not match request.");
  }
}

function getPreviousDate(date: Date): Date {
  const previousDate = new Date(date);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);

  return previousDate;
}

function createPlannerPromptInput(
  targetDate: Date,
  log: RecruitLog,
  review: DailyReview | null
): JsonObject {
  return {
    targetDate: targetDate.toISOString(),
    sourceLog: {
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
    },
    sourceReview:
      review === null
        ? null
        : {
            id: review.id,
            summary: review.summary,
            strengths: normalizeJsonValue(review.strengths),
            weaknesses: normalizeJsonValue(review.weaknesses),
            suggestions: normalizeJsonValue(review.suggestions),
            score: review.score
          }
  };
}

function normalizeJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function createRepositoryInput(
  date: Date,
  logId: string,
  reviewId: string | undefined,
  promptInput: JsonObject,
  rawOutput: string,
  plannerOutput: PlannerAiOutput
): DailyPlanRepositoryCreateInput {
  const parsedOutput: JsonObject = {
    date: plannerOutput.date,
    schedule: plannerOutput.schedule,
    priorityTasks: plannerOutput.priorityTasks,
    goals: plannerOutput.goals,
    risks: plannerOutput.risks,
    expectedOutcomes: plannerOutput.expectedOutcomes,
    priority: plannerOutput.priority
  };

  return {
    date,
    logId,
    reviewId,
    schedule: plannerOutput.schedule,
    priorityTasks: plannerOutput.priorityTasks,
    goals: plannerOutput.goals,
    risks: plannerOutput.risks,
    expectedOutcomes: plannerOutput.expectedOutcomes,
    priority: plannerOutput.priority,
    provider: plannerProvider,
    model: plannerModel,
    promptFile: plannerPromptFile,
    promptVersion: plannerPromptVersion,
    inputHash: createInputHash(promptInput),
    rawOutput,
    parsedOutput
  };
}

function createInputHash(input: JsonObject): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}
