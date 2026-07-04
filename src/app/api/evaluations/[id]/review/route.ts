import type { NextRequest } from "next/server";
import {
  resumeEvaluationResultService,
  ResumeEvaluationResultServiceError
} from "@/services/resumeEvaluationResult.service";
import type { ResumeEvaluationDetailDto } from "@/types/resumeEvaluationResult";
import {
  errorResponse,
  handleApiError,
  readJsonBody,
  successResponse
} from "@/utils/apiResponse";
import {
  parseResumeEvaluationSubmitReviewPayload,
  ResumeEvaluationValidationError
} from "@/utils/resumeEvaluationValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const input = parseResumeEvaluationSubmitReviewPayload(body);
    const evaluation = await resumeEvaluationResultService.submitReview(id, input);

    return successResponse<ResumeEvaluationDetailDto>(evaluation);
  } catch (error) {
    return handleReviewApiError(error);
  }
}

function handleReviewApiError(error: unknown): Response {
  if (error instanceof ResumeEvaluationValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof ResumeEvaluationResultServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    if (error.code === "CONFLICT") {
      return errorResponse("CONFLICT", error.message, 409);
    }

    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
