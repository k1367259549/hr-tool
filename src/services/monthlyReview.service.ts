import { parseJsonOutput } from "@/ai/parser/jsonParser";
import { validateMonthlyReviewAiOutput } from "@/ai/schemas/monthlyReview.schema";
import { aiService } from "@/ai/ai.service";
import { aiConfig } from "@/config/ai.config";
import { logRepository } from "@/repositories/log.repository";
import type { JsonObject, JsonValue } from "@/types/ai";
import type { RecruitLog } from "@/types/log";
import type {
  MonthlyReviewAiOutput,
  MonthlyReviewGenerateInput,
  MonthlyReviewPromptInput,
  MonthlyReviewResponse
} from "@/types/monthlyReview";
import { calculateKpiSummary } from "@/utils/kpi";

const monthlyReviewPromptFile = "monthly-review.md";

export type MonthlyReviewServiceErrorCode = "LOG_NOT_FOUND" | "AI_ERROR" | "VALIDATION_ERROR";

export class MonthlyReviewServiceError extends Error {
  readonly code: MonthlyReviewServiceErrorCode;

  constructor(code: MonthlyReviewServiceErrorCode, message: string) {
    super(message);
    this.name = "MonthlyReviewServiceError";
    this.code = code;
  }
}

export const monthlyReviewService = {
  async generateMonthlyReview(input: MonthlyReviewGenerateInput): Promise<MonthlyReviewResponse> {
    const monthRange = parseMonthlyReviewMonth(input);
    const logs = await logRepository.findMany({
      startDate: monthRange.startDate,
      endDate: monthRange.endDateExclusive
    });
    const chronologicalLogs = [...logs].reverse();

    if (chronologicalLogs.length === 0) {
      throw new MonthlyReviewServiceError("LOG_NOT_FOUND", "No logs found in selected month.");
    }

    const promptInput = createMonthlyReviewPromptInput(
      monthRange.year,
      monthRange.month,
      monthRange.startDate,
      monthRange.endDate,
      chronologicalLogs
    );
    const rawOutput = await generateMonthlyReviewOutput(promptInput as unknown as JsonObject);
    const review = parseAndValidateMonthlyReviewOutput(rawOutput);

    return {
      year: promptInput.year,
      month: promptInput.month,
      startDate: promptInput.startDate,
      endDate: promptInput.endDate,
      logCount: promptInput.logCount,
      kpiSummary: promptInput.kpiSummary,
      review
    };
  }
};

async function generateMonthlyReviewOutput(promptInput: JsonObject): Promise<string> {
  try {
    return await aiService.generateTextFromPrompt({
      feature: "monthly_review",
      promptFile: monthlyReviewPromptFile,
      variables: {
        INPUT: promptInput
      },
      model: aiConfig.defaultModel,
      provider: aiConfig.defaultProvider,
      temperature: aiConfig.defaultTemperature
    });
  } catch {
    throw new MonthlyReviewServiceError("AI_ERROR", "AI monthly review generation failed.");
  }
}

function parseAndValidateMonthlyReviewOutput(rawOutput: string): MonthlyReviewAiOutput {
  try {
    const parsedJson = parseJsonOutput<JsonValue>(rawOutput);

    return validateMonthlyReviewAiOutput(parsedJson);
  } catch {
    throw new MonthlyReviewServiceError("AI_ERROR", "AI monthly review output is invalid.");
  }
}

function parseMonthlyReviewMonth(input: MonthlyReviewGenerateInput): {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  endDateExclusive: Date;
} {
  validateYear(input.year);
  validateMonth(input.month);

  const startDate = new Date(Date.UTC(input.year, input.month - 1, 1));
  const endDateExclusive = new Date(Date.UTC(input.year, input.month, 1));
  const endDate = new Date(endDateExclusive);
  endDate.setUTCDate(endDateExclusive.getUTCDate() - 1);

  return {
    year: input.year,
    month: input.month,
    startDate,
    endDate,
    endDateExclusive
  };
}

function validateYear(year: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", "Year must be an integer from 1900 to 9999.");
  }
}

function validateMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", "Month must be an integer from 1 to 12.");
  }
}

function createMonthlyReviewPromptInput(
  year: number,
  month: number,
  startDate: Date,
  endDate: Date,
  logs: RecruitLog[]
): MonthlyReviewPromptInput {
  const kpiSummary = calculateKpiSummary(logs);

  return {
    year,
    month,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    logCount: logs.length,
    kpiSummary,
    logs: logs.map(createMonthlyReviewLogInput)
  };
}

function createMonthlyReviewLogInput(log: RecruitLog): MonthlyReviewPromptInput["logs"][number] {
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
