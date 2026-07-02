import type { NextRequest } from "next/server";
import {
  jobUnderstandingService,
  JobUnderstandingServiceError
} from "@/services/jobUnderstanding.service";
import type { JobUnderstandingResult } from "@/types/jobProfile";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  JobUnderstandingValidationError,
  parseJobUnderstandingGeneratePayload
} from "@/utils/jobUnderstandingValidation";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseJobUnderstandingGeneratePayload(body);
    const result = await jobUnderstandingService.generateJobUnderstanding(input);

    return successResponse<JobUnderstandingResult>(result);
  } catch (error) {
    return handleJobUnderstandingApiError(error);
  }
}

function handleJobUnderstandingApiError(error: unknown): Response {
  if (error instanceof JobUnderstandingValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof JobUnderstandingServiceError) {
    const status = error.code === "AI_ERROR" ? 502 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
