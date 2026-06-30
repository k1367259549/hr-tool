import { plannerRepository } from "@/repositories/planner.repository";
import { reviewRepository } from "@/repositories/review.repository";
import { logService } from "@/services/log.service";
import { spreadsheetService } from "@/services/spreadsheet.service";
import type {
  DailyExportInput,
  DailyExportResponse,
  SpreadsheetAnalysisExportResponse
} from "@/types/export";
import {
  formatDailyReportMarkdown,
  formatSpreadsheetAnalysisMarkdown
} from "@/utils/markdownExport";
import { LogValidationError, parseLogDate } from "@/utils/logValidation";

export type ExportServiceErrorCode = "LOG_NOT_FOUND" | "NOT_FOUND" | "VALIDATION_ERROR";

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
      throw new ExportServiceError("LOG_NOT_FOUND", "未找到每日记录。");
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
  },

  async exportSpreadsheetAnalysisMarkdown(
    uploadId: string
  ): Promise<SpreadsheetAnalysisExportResponse> {
    if (uploadId.trim().length === 0) {
      throw new ExportServiceError("VALIDATION_ERROR", "上传记录 ID 不能为空。");
    }

    const report = await spreadsheetService.getAnalysisByUploadId(uploadId);

    if (!report.analysis) {
      throw new ExportServiceError("NOT_FOUND", "未找到表格分析报告。");
    }

    const markdown = formatSpreadsheetAnalysisMarkdown({
      analysis: report.analysis,
      upload: report.upload
    });

    return {
      id: report.upload.id,
      fileName: report.upload.fileName,
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
