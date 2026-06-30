import type { NextRequest } from "next/server";
import { monthlyReviewService, MonthlyReviewServiceError } from "@/services/monthlyReview.service";
import type { MonthlyReviewResponse } from "@/types/monthlyReview";
import { successResponse } from "@/utils/apiResponse";
import { handleMonthlyReviewApiError } from "./monthlyReviewApiError";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const year = parseQueryInteger(request.nextUrl.searchParams.get("year"), "Year is required.");
    const month = parseQueryInteger(
      request.nextUrl.searchParams.get("month"),
      "Month is required."
    );
    const review = await monthlyReviewService.generateMonthlyReview({
      year,
      month
    });

    return successResponse<MonthlyReviewResponse>(review);
  } catch (error) {
    return handleMonthlyReviewApiError(error);
  }
}

function parseQueryInteger(value: string | null, message: string): number {
  if (!value) {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", message);
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", message);
  }

  return parsedValue;
}
