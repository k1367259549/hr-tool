import { CandidateApplicationServiceError } from "@/services/candidateApplication.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { CandidateApplicationValidationError } from "@/utils/candidateApplicationValidation";

export function handleCandidateApplicationApiError(error: unknown): Response {
  if (error instanceof CandidateApplicationValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof CandidateApplicationServiceError) {
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
