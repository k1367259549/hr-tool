import { CandidateServiceError } from "@/services/candidate.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { CandidateValidationError } from "@/utils/candidateValidation";

export function handleCandidateApiError(error: unknown): Response {
  if (error instanceof CandidateValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof CandidateServiceError) {
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
