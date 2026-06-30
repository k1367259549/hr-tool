import type { NextRequest } from "next/server";
import { weeklyReviewService, WeeklyReviewServiceError } from "@/services/weeklyReview.service";
import type {
  WeeklyReviewGeneratePayload,
  WeeklyReviewResponse
} from "@/types/weeklyReview";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { handleWeeklyReviewApiError } from "../weeklyReviewApiError";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const payload = parseWeeklyReviewGeneratePayload(body);
    const review = await weeklyReviewService.generateWeeklyReview(payload);

    return successResponse<WeeklyReviewResponse>(review, 201);
  } catch (error) {
    return handleWeeklyReviewApiError(error);
  }
}

function parseWeeklyReviewGeneratePayload(payload: unknown): WeeklyReviewGeneratePayload {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new WeeklyReviewServiceError("VALIDATION_ERROR", "Request body must be a JSON object.");
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.startDate !== "string" || !body.startDate) {
    throw new WeeklyReviewServiceError("VALIDATION_ERROR", "Start date is required.");
  }

  if (typeof body.endDate !== "string" || !body.endDate) {
    throw new WeeklyReviewServiceError("VALIDATION_ERROR", "End date is required.");
  }

  return {
    startDate: body.startDate,
    endDate: body.endDate
  };
}
