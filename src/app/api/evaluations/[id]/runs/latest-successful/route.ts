import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  resumeEvaluationRunService,
  ResumeEvaluationRunServiceError
} from "@/services/resumeEvaluationRun.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { ResumeEvaluationRunDto } from "@/types/resumeEvaluationRun";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { ResumeEvaluationRunValidationError } from "@/utils/resumeEvaluationRunValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type LatestSuccessfulRunResponse = {
  run: ResumeEvaluationRunDto | null;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const run = await resumeEvaluationRunService.getLatestSuccessfulRunByEvaluationId(id);

    return NextResponse.json<ApiSuccessResponse<LatestSuccessfulRunResponse>>(
      {
        data: { run },
        error: null,
        success: true
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return handleEvaluationRunApiError(error);
  }
}

function handleEvaluationRunApiError(error: unknown): Response {
  if (error instanceof ResumeEvaluationRunValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof ResumeEvaluationRunServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
