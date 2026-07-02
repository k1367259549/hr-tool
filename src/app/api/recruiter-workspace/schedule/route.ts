import type { NextRequest } from "next/server";
import { recruiterWorkspaceService } from "@/services/recruiterWorkspace.service";
import type { RecruiterWorkspaceScheduleItemDto } from "@/types/recruiterWorkspace";
import { errorResponse, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseRecruiterWorkspaceSchedulePayload,
  RecruiterWorkspaceValidationError
} from "@/utils/recruiterWorkspaceValidation";
import { handleRecruiterWorkspaceApiError } from "../errorHandling";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruiterWorkspaceSchedulePayload(body);
    const schedule = await recruiterWorkspaceService.saveSchedule(input);

    return successResponse<RecruiterWorkspaceScheduleItemDto[]>(schedule);
  } catch (error) {
    if (error instanceof RecruiterWorkspaceValidationError) {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    return handleRecruiterWorkspaceApiError(error);
  }
}
