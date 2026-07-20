import { DailyWorkspaceServiceError } from "@/services/dailyWorkspace.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { DailyWorkspaceValidationError } from "@/utils/dailyWorkspaceValidation";

export function handleDailyWorkspaceApiError(error: unknown): Response {
  if (error instanceof DailyWorkspaceValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof DailyWorkspaceServiceError) {
    if (error.code === "VALIDATION_ERROR") {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    const status = error.code === "AI_ERROR" ? 502 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
