import type { NextRequest } from "next/server";
import { ExportServiceError, exportService } from "@/services/export.service";
import type { DailyExportResponse } from "@/types/export";
import { errorResponse, handleApiError, successResponse } from "@/utils/apiResponse";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const exportedReport = await exportService.exportDailyMarkdown({
      date: request.nextUrl.searchParams.get("date") ?? ""
    });

    return successResponse<DailyExportResponse>(exportedReport);
  } catch (error) {
    return handleExportApiError(error);
  }
}

function handleExportApiError(error: unknown): Response {
  if (error instanceof ExportServiceError) {
    if (error.code === "LOG_NOT_FOUND") {
      return errorResponse("LOG_NOT_FOUND", error.message, 404);
    }

    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  return handleApiError(error);
}
