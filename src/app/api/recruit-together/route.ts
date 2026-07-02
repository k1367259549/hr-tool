import type { NextRequest } from "next/server";
import {
  RecruitTogetherServiceError,
  recruitTogetherService
} from "@/services/recruitTogether.service";
import type { RecruitTogetherPageData, RecruitTogetherWorkflowDto } from "@/types/recruitTogether";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseRecruitTogetherSavePayload,
  RecruitTogetherValidationError
} from "@/utils/recruitTogetherValidation";

export async function GET(): Promise<Response> {
  try {
    const data = await recruitTogetherService.getPageData();

    return successResponse<RecruitTogetherPageData>(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruitTogetherSavePayload(body);
    const workflow = await recruitTogetherService.saveWorkflow(input);

    return successResponse<RecruitTogetherWorkflowDto>(workflow, 201);
  } catch (error) {
    return handleRecruitTogetherApiError(error);
  }
}

export function handleRecruitTogetherApiError(error: unknown): Response {
  if (error instanceof RecruitTogetherValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof RecruitTogetherServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    if (error.code === "VALIDATION_ERROR") {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    const status = error.code === "AI_ERROR" ? 502 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
