import type { NextRequest } from "next/server";
import { weeklyReviewService, WeeklyReviewServiceError } from "@/services/weeklyReview.service";
import type { WeeklyReviewResponse } from "@/types/weeklyReview";
import { successResponse } from "@/utils/apiResponse";
import { handleWeeklyReviewApiError } from "./weeklyReviewApiError";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");

    if (!startDate) {
      throw new WeeklyReviewServiceError("VALIDATION_ERROR", "Start date is required.");
    }

    if (!endDate) {
      throw new WeeklyReviewServiceError("VALIDATION_ERROR", "End date is required.");
    }

    const review = await weeklyReviewService.generateWeeklyReview({
      startDate,
      endDate
    });

    return successResponse<WeeklyReviewResponse>(review);
  } catch (error) {
    return handleWeeklyReviewApiError(error);
  }
}
