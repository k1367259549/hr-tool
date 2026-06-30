import type { NextRequest } from "next/server";
import { logService } from "@/services/log.service";
import type { RecruitLog } from "@/types/log";
import {
  handleApiError,
  readJsonBody,
  successResponse,
  errorResponse
} from "@/utils/apiResponse";
import {
  LogValidationError,
  parseRecruitLogUpdatePayload,
  validateLogId
} from "@/utils/logValidation";

type LogIdRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: LogIdRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    validateLogId(id);

    const log = await logService.getLogById(id);

    if (!log) {
      return errorResponse("LOG_NOT_FOUND", "未找到每日记录。", 404);
    }

    return successResponse<RecruitLog>(log);
  } catch (error) {
    return handleLogApiError(error);
  }
}

export async function PUT(request: NextRequest, context: LogIdRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    validateLogId(id);

    const existingLog = await logService.getLogById(id);

    if (!existingLog) {
      return errorResponse("LOG_NOT_FOUND", "未找到每日记录。", 404);
    }

    const body = await readJsonBody(request);
    const input = parseRecruitLogUpdatePayload(body);
    const log = await logService.updateLog(id, input);

    return successResponse<RecruitLog>(log);
  } catch (error) {
    return handleLogApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: LogIdRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    validateLogId(id);

    const existingLog = await logService.getLogById(id);

    if (!existingLog) {
      return errorResponse("LOG_NOT_FOUND", "未找到每日记录。", 404);
    }

    const log = await logService.deleteLog(id);

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
