import { SpreadsheetAnalysisServiceError } from "@/services/spreadsheetAnalysis.service";
import { SpreadsheetServiceError } from "@/services/spreadsheet.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { SpreadsheetParseError } from "@/utils/spreadsheetParser";
import { SpreadsheetValidationError } from "@/utils/spreadsheetValidation";

export function handleSpreadsheetApiError(error: unknown): Response {
  if (error instanceof SpreadsheetValidationError) {
    return errorResponse(error.code, error.message, 400);
  }

  if (error instanceof SpreadsheetParseError) {
    return errorResponse(error.code, error.message, 400);
  }

  if (error instanceof SpreadsheetAnalysisServiceError) {
    const status = error.code === "AI_ANALYSIS_ERROR" ? 502 : 400;

    return errorResponse(error.code, error.message, status);
  }

  if (error instanceof SpreadsheetServiceError) {
    return errorResponse(error.code, error.message, 404);
  }

  return handleApiError(error);
}

