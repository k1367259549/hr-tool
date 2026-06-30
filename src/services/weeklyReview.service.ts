import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validateWeeklyReviewAiOutput } from "@/ai/schemas/weeklyReview.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { logRepository } from "@/repositories/log.repository";
import type { JsonObject, JsonValue } from "@/types/ai";
import type { RecruitLog } from "@/types/log";
import type {
  WeeklyReviewAiOutput,
  WeeklyReviewGenerateInput,
  WeeklyReviewPromptInput,
  WeeklyReviewResponse
} from "@/types/weeklyReview";
import { calculateKpiSummary } from "@/utils/kpi";
import { parseLogDate } from "@/utils/logValidation";

const weeklyReviewPromptFile = "weekly-review.md";

export type WeeklyReviewServiceErrorCode = "LOG_NOT_FOUND" | "AI_ERROR" | "VALIDATION_ERROR";

export class WeeklyReviewServiceError extends Error {
  readonly code: WeeklyReviewServiceErrorCode;

  constructor(code: WeeklyReviewServiceErrorCode, message: string) {
    super(message);
    this.name = "WeeklyReviewServiceError";
    this.code = code;
  }
}

export const weeklyReviewService = {
  async generateWeeklyReview(input: WeeklyReviewGenerateInput): Promise<WeeklyReviewResponse> {
    const dateRange = parseWeeklyReviewDateRange(input);
    const logs = await logRepository.findMany({
      startDate: dateRange.startDate,
      endDate: dateRange.endDateExclusive
    });
    const chronologicalLogs = [...logs].reverse();

    if (chronologicalLogs.length === 0) {
      throw new WeeklyReviewServiceError("LOG_NOT_FOUND", "No logs found in date range.");
    }

    const promptInput = createWeeklyReviewPromptInput(
      dateRange.startDate,
      dateRange.endDate,
      chronologicalLogs
    );
    const rawOutput = await generateWeeklyReviewOutput(promptInput as unknown as JsonObject);
    const review = parseAndValidateWeeklyReviewOutput(rawOutput);

    return {
      startDate: promptInput.startDate,
      endDate: promptInput.endDate,
      logCount: promptInput.logCount,
      kpiSummary: promptInput.kpiSummary,
      review
    };
  }
};

async function generateWeeklyReviewOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      feature: "weekly_review",
      promptFile: weeklyReviewPromptFile,
      variables: {
        INPUT: promptInput
      },
      model: aiConfig.defaultModel,
      provider: aiConfig.defaultProvider,
      temperature: aiConfig.defaultTemperature
    });
  } catch {
    throw new WeeklyReviewServiceError("AI_ERROR", "AI weekly review generation failed.");
  }
}

function parseAndValidateWeeklyReviewOutput(rawOutput: string): WeeklyReviewAiOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validateWeeklyReviewAiOutput(parsedJson);
  } catch {
    throw new WeeklyReviewServiceError("AI_ERROR", "AI weekly review output is invalid.");
  }
}

function parseWeeklyReviewDateRange(input: WeeklyReviewGenerateInput): {
  startDate: Date;
  endDate: Date;
  endDateExclusive: Date;
} {
  const startDate = parseWeeklyReviewDate(input.startDate, "Start date must be a valid date.");
  const endDate = parseWeeklyReviewDate(input.endDate, "End date must be a valid date.");

  if (startDate.getTime() > endDate.getTime()) {
    throw new WeeklyReviewServiceError(
      "VALIDATION_ERROR",
      "Start date must be before or equal to end date."
    );
  }

  const endDateExclusive = new Date(endDate);
  endDateExclusive.setUTCDate(endDate.getUTCDate() + 1);

  return {
    startDate,
    endDate,
    endDateExclusive
  };
}

function parseWeeklyReviewDate(value: WeeklyReviewGenerateInput["startDate"], message: string): Date {
  try {
    return parseLogDate(value);
  } catch {
    throw new WeeklyReviewServiceError("VALIDATION_ERROR", message);
  }
}

function createWeeklyReviewPromptInput(
  startDate: Date,
  endDate: Date,
  logs: RecruitLog[]
): WeeklyReviewPromptInput {
  const kpiSummary = calculateKpiSummary(logs);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    logCount: logs.length,
    kpiSummary,
    logs: logs.map(createWeeklyReviewLogInput)
  };
}

function createWeeklyReviewLogInput(log: RecruitLog): WeeklyReviewPromptInput["logs"][number] {
  return {
    id: log.id,
    date: formatDate(log.date),
    position: log.position,
    resumeCount: log.resumeCount,
    screenCount: log.screenCount,
    phoneCount: log.phoneCount,
    interviewCount: log.interviewCount,
    offerCount: log.offerCount,
    entryCount: log.entryCount,
    source: log.source,
    channel: log.channel,
    roleType: log.roleType,
    priority: log.priority,
    summary: log.summary,
    problems: log.problems,
    reflection: log.reflection
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
