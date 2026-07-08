import type { NextRequest } from "next/server";
import {
  resumeEvaluationRunService,
  ResumeEvaluationRunServiceError
} from "@/services/resumeEvaluationRun.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { QuickScreeningRunDto } from "@/types/resumeEvaluationRun";
import { errorResponse, handleApiError } from "@/utils/apiResponse";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const result = await resumeEvaluationRunService.createQuickScreeningRun(id);

    return Response.json(
      {
        data: result,
        error: null,
        success: true
      } satisfies ApiSuccessResponse<QuickScreeningRunDto>,
      {
        status: 201
      }
    );
  } catch (error) {
    return handleQuickScreeningApiError(error);
  }
}

function handleQuickScreeningApiError(error: unknown): Response {
  if (error instanceof ResumeEvaluationRunServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
