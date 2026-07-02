import type { NextRequest } from "next/server";
import {
  candidateUnderstandingService,
  CandidateUnderstandingServiceError
} from "@/services/candidateUnderstanding.service";
import type { CandidateUnderstandingResult } from "@/types/candidateUnderstanding";
import { errorResponse, handleApiError, successResponse } from "@/utils/apiResponse";
import {
  CandidateUnderstandingValidationError,
  readCandidateUnderstandingFormData
} from "@/utils/candidateUnderstandingValidation";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();
    const input = readCandidateUnderstandingFormData(formData);
    const result = await candidateUnderstandingService.generateCandidateUnderstanding(input);

    return successResponse<CandidateUnderstandingResult>(result, 201);
  } catch (error) {
    return handleCandidateUnderstandingApiError(error);
  }
}

function handleCandidateUnderstandingApiError(error: unknown): Response {
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
