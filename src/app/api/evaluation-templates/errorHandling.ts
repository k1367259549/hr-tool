import { EvaluationTemplateServiceError } from "@/services/evaluationTemplate.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { EvaluationTemplateValidationError } from "@/utils/evaluationTemplateValidation";

export function handleEvaluationTemplateApiError(error: unknown): Response {
  if (error instanceof EvaluationTemplateValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof EvaluationTemplateServiceError) {
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
