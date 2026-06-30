import { MonthlyReviewServiceError } from "@/services/monthlyReview.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";

export function handleMonthlyReviewApiError(error: unknown): Response {
  if (error instanceof MonthlyReviewServiceError) {
    const status = error.code === "LOG_NOT_FOUND" ? 404 : error.code === "AI_ERROR" ? 502 : 400;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
