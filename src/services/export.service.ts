import { plannerRepository } from "@/repositories/planner.repository";
import { reviewRepository } from "@/repositories/review.repository";
import { logService } from "@/services/log.service";
import type { DailyExportInput, DailyExportResponse } from "@/types/export";
import { formatDailyReportMarkdown } from "@/utils/markdownExport";
import { LogValidationError, parseLogDate } from "@/utils/logValidation";

export type ExportServiceErrorCode = "LOG_NOT_FOUND" | "VALIDATION_ERROR";

export class ExportServiceError extends Error {
  readonly code: ExportServiceErrorCode;

  constructor(code: ExportServiceErrorCode, message: string) {
    super(message);
    this.name = "ExportServiceError";
    this.code = code;
  }
}

export const exportService = {
  async exportDailyMarkdown(input: DailyExportInput): Promise<DailyExportResponse> {
    const date = parseExportDate(input.date);
    const dateLabel = formatExportDate(date);
    const log = await logService.getLogByDate(date);

    if (!log) {
      throw new ExportServiceError("LOG_NOT_FOUND", "Log not found.");
    }

    const planDate = getNextDate(date);
    const [review, plan] = await Promise.all([
      reviewRepository.findByLogId(log.id),
      plannerRepository.findLatestByDate(planDate)
    ]);
    const markdown = formatDailyReportMarkdown({
      date: dateLabel,
      log,
      review,
      plan
    });

    return {
      date: dateLabel,
      markdown
    };
  }
};

function parseExportDate(value: string): Date {
  try {
    return parseLogDate(value);
  } catch (error) {
    if (error instanceof LogValidationError) {
      throw new ExportServiceError("VALIDATION_ERROR", error.message);
    }

    throw error;
  }
}

function formatExportDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getNextDate(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  return nextDate;
}
