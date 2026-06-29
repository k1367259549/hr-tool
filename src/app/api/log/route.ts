import type { NextRequest } from "next/server";
import { logService } from "@/services/log.service";
import type { RecruitLog } from "@/types/log";
import {
  handleApiError,
  readJsonBody,
  successResponse,
  errorResponse
} from "@/utils/apiResponse";
import { LogValidationError, parseRecruitLogCreatePayload } from "@/utils/logValidation";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam === null ? undefined : Number(limitParam);
    const logs = await logService.getLogs({
      date,
      limit
    });

    return successResponse<RecruitLog[]>(logs);
  } catch (error) {
    return handleLogApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruitLogCreatePayload(body);
    const log = await logService.createLog(input);

    return successResponse<RecruitLog>(log, 201);
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
