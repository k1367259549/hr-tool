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
  parseResumeEvaluationDetailedReviewPayload,
  ResumeEvaluationRunValidationError
} from "@/utils/resumeEvaluationRunValidation";

type RouteParams = {
  params: Promise<{ id: string; runId: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id, runId } = await params;
    const input = parseResumeEvaluationDetailedReviewPayload(await readJsonBody(request));
    const evaluation = await resumeEvaluationResultService.reviewDetailedAnalysisRun(
      id,
      runId,
      input
    );

    return successResponse<ResumeEvaluationDetailDto>(evaluation);
  } catch (error) {
    if (error instanceof ResumeEvaluationRunValidationError) {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    if (error instanceof ResumeEvaluationResultServiceError) {
      if (error.code === "NOT_FOUND") {
        return errorResponse("NOT_FOUND", error.message, 404);
      }

      return errorResponse(error.code, error.message, error.code === "CONFLICT" ? 409 : 400);
    }

    return handleApiError(error);
  }
}
