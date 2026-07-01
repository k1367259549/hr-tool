import type { NextRequest } from "next/server";
import {
  jobUnderstandingService,
  JobUnderstandingServiceError
} from "@/services/jobUnderstanding.service";
import { jobProfileService, toJobProfileDto } from "@/services/jobProfile.service";
import type { JobProfileDto } from "@/types/jobProfile";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  JobUnderstandingValidationError,
  parseJobProfileSavePayload
} from "@/utils/jobUnderstandingValidation";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseJobProfileSavePayload(body);
    const jobProfile = await jobUnderstandingService.saveReviewedJobProfile(input);

    return successResponse<JobProfileDto>(toJobProfileDto(jobProfile), 201);
  } catch (error) {
    return handleJobProfileApiError(error);
  }
}

export async function GET(): Promise<Response> {
  try {
    const jobProfiles = await jobProfileService.listReviewedJobProfiles();

    return successResponse<JobProfileDto[]>(jobProfiles);
  } catch (error) {
    return handleApiError(error);
  }
}

function handleJobProfileApiError(error: unknown): Response {
  if (error instanceof JobUnderstandingValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof JobUnderstandingServiceError) {
    const status = error.code === "AI_ERROR" ? 502 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
