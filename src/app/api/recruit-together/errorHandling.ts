import { RecruitTogetherServiceError } from "@/services/recruitTogether.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { RecruitTogetherValidationError } from "@/utils/recruitTogetherValidation";

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
