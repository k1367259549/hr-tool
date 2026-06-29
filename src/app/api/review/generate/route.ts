import type { NextRequest } from "next/server";
import { reviewService, ReviewServiceError } from "@/services/review.service";
import type { DailyReview, ReviewGeneratePayload } from "@/types/review";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { handleReviewApiError } from "../reviewApiError";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const payload = parseReviewGeneratePayload(body);
    const review = await reviewService.generateReview(payload);

    return successResponse<DailyReview>(review, 201);
  } catch (error) {
    return handleReviewApiError(error);
  }
}

function parseReviewGeneratePayload(payload: unknown): ReviewGeneratePayload {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ReviewServiceError("VALIDATION_ERROR", "Request body must be a JSON object.");
  }

  const date = (payload as Record<string, unknown>).date;

  if (typeof date !== "string" || !date) {
    throw new ReviewServiceError("VALIDATION_ERROR", "Date is required.");
  }

  return {
    date
  };
}
