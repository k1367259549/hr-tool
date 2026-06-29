import { PlannerServiceError } from "@/services/planner.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { LogValidationError } from "@/utils/logValidation";

export function handlePlannerApiError(error: unknown): Response {
  if (error instanceof PlannerServiceError) {
    const status = error.code === "LOG_NOT_FOUND" ? 404 : error.code === "AI_ERROR" ? 502 : 400;

    return errorResponse(error.code, error.message, status);
  }

  if (error instanceof LogValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  return handleApiError(error);
}
