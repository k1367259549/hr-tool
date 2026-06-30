import type { NextRequest } from "next/server";
import { reviewService } from "@/services/review.service";
import type { DailyReview } from "@/types/review";
import { errorResponse, successResponse } from "@/utils/apiResponse";
import { handleReviewApiError } from "../../reviewApiError";

type ReviewDateRouteContext = {
  params: Promise<{
    date: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: ReviewDateRouteContext
): Promise<Response> {
  try {
    const { date } = await context.params;
    const review = await reviewService.getReviewByDate({
      date: decodeURIComponent(date)
    });

    if (!review) {
      return errorResponse("REVIEW_NOT_FOUND", "未找到复盘。", 404);
    }

    return successResponse<DailyReview>(review);
  } catch (error) {
    return handleReviewApiError(error);
  }
}
