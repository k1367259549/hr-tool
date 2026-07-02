import type { NextRequest } from "next/server";
import {
  dailyWorkspaceService,
  DailyWorkspaceServiceError
} from "@/services/dailyWorkspace.service";
import type {
  DailyWorkspaceActivitySnapshot,
  DailyWorkspaceGenerateResult
} from "@/types/dailyWorkspace";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  DailyWorkspaceValidationError,
  parseDailyWorkspaceGeneratePayload
} from "@/utils/dailyWorkspaceValidation";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const data = await dailyWorkspaceService.getActivitySnapshot({ date });

    return successResponse<DailyWorkspaceActivitySnapshot>(data);
  } catch (error) {
    return handleDailyWorkspaceApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseDailyWorkspaceGeneratePayload(body);
    const result = await dailyWorkspaceService.generateDailyWorkspace(input);

    return successResponse<DailyWorkspaceGenerateResult>(result);
  } catch (error) {
    return handleDailyWorkspaceApiError(error);
  }
}

export function handleDailyWorkspaceApiError(error: unknown): Response {
  if (error instanceof DailyWorkspaceValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof DailyWorkspaceServiceError) {
    if (error.code === "VALIDATION_ERROR") {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    const status = error.code === "AI_ERROR" ? 502 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
