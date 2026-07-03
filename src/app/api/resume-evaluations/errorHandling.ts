import { ResumeEvaluationResultServiceError } from "@/services/resumeEvaluationResult.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { ResumeEvaluationValidationError } from "@/utils/resumeEvaluationValidation";

export function handleResumeEvaluationApiError(error: unknown): Response {
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
