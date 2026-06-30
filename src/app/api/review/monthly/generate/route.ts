import type { NextRequest } from "next/server";
import { monthlyReviewService, MonthlyReviewServiceError } from "@/services/monthlyReview.service";
import type {
  MonthlyReviewGeneratePayload,
  MonthlyReviewResponse
} from "@/types/monthlyReview";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { handleMonthlyReviewApiError } from "../monthlyReviewApiError";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const payload = parseMonthlyReviewGeneratePayload(body);
    const review = await monthlyReviewService.generateMonthlyReview(payload);

    return successResponse<MonthlyReviewResponse>(review, 201);
  } catch (error) {
    return handleMonthlyReviewApiError(error);
  }
}

function parseMonthlyReviewGeneratePayload(payload: unknown): MonthlyReviewGeneratePayload {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", "Request body must be a JSON object.");
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.year !== "number") {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", "Year is required.");
  }

  if (typeof body.month !== "number") {
    throw new MonthlyReviewServiceError("VALIDATION_ERROR", "Month is required.");
  }

  return {
    year: body.year,
    month: body.month
  };
}
