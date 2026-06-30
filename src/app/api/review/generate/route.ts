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
    throw new ReviewServiceError("VALIDATION_ERROR", "请求体必须是 JSON 对象。");
  }

  const date = (payload as Record<string, unknown>).date;

  if (typeof date !== "string" || !date) {
    throw new ReviewServiceError("VALIDATION_ERROR", "日期为必填项。");
  }

  return {
    date
  };
}
