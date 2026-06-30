import { ExportServiceError, exportService } from "@/services/export.service";
import type { SpreadsheetAnalysisExportResponse } from "@/types/export";
import { errorResponse, handleApiError, successResponse } from "@/utils/apiResponse";

type SpreadsheetExportRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: SpreadsheetExportRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const exportedReport = await exportService.exportSpreadsheetAnalysisMarkdown(id);

    return successResponse<SpreadsheetAnalysisExportResponse>(exportedReport);
  } catch (error) {
    return handleSpreadsheetExportApiError(error);
  }
}

function handleSpreadsheetExportApiError(error: unknown): Response {
  if (error instanceof ExportServiceError) {
    if (error.code === "NOT_FOUND" || error.code === "LOG_NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  return handleApiError(error);
}
