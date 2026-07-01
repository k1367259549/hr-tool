import type { NextRequest } from "next/server";
import {
  candidateUnderstandingService,
  CandidateUnderstandingServiceError
} from "@/services/candidateUnderstanding.service";
import type { CandidateInsightDto } from "@/types/candidateUnderstanding";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  CandidateUnderstandingValidationError,
  parseCandidateInsightSavePayload
} from "@/utils/candidateUnderstandingValidation";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseCandidateInsightSavePayload(body);
    const insight = await candidateUnderstandingService.saveReviewedCandidateInsight(input);

    return successResponse<CandidateInsightDto>(insight, 201);
  } catch (error) {
    return handleCandidateInsightApiError(error);
  }
}

function handleCandidateInsightApiError(error: unknown): Response {
  if (error instanceof CandidateUnderstandingValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof CandidateUnderstandingServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    if (error.code === "VALIDATION_ERROR") {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    const status = error.code === "AI_ERROR" ? 502 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
