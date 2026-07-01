import {
  RecruitmentTaskServiceError
} from "@/services/recruitmentTask.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import {
  RecruitmentTaskValidationError
} from "@/utils/recruitmentTaskValidation";

export function handleRecruitmentTaskApiError(error: unknown): Response {
  if (error instanceof RecruitmentTaskValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof RecruitmentTaskServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
