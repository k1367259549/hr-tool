import type { NextRequest } from "next/server";
import { logService } from "@/services/log.service";
import type { RecruitLog } from "@/types/log";
import { errorResponse, handleApiError, successResponse } from "@/utils/apiResponse";
import { LogValidationError } from "@/utils/logValidation";

type LogDateRouteContext = {
  params: Promise<{
    date: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: LogDateRouteContext
): Promise<Response> {
  try {
    const { date } = await context.params;
    const log = await logService.getLogByDate(decodeURIComponent(date));

    if (!log) {
      return errorResponse("LOG_NOT_FOUND", "Log not found.", 404);
    }

    return successResponse<RecruitLog>(log);
  } catch (error) {
    return handleLogApiError(error);
  }
}

function handleLogApiError(error: unknown): Response {
  if (error instanceof LogValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  return handleApiError(error);
}
