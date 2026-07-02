import type { NextRequest } from "next/server";
import { recruiterWorkspaceService } from "@/services/recruiterWorkspace.service";
import type { RecruiterWorkspaceNoteDto } from "@/types/recruiterWorkspace";
import { errorResponse, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseRecruiterWorkspaceNotePayload,
  RecruiterWorkspaceValidationError
} from "@/utils/recruiterWorkspaceValidation";
import { handleRecruiterWorkspaceApiError } from "../errorHandling";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruiterWorkspaceNotePayload(body);
    const note = await recruiterWorkspaceService.addNote(input);

    return successResponse<RecruiterWorkspaceNoteDto>(note, 201);
  } catch (error) {
    if (error instanceof RecruiterWorkspaceValidationError) {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    return handleRecruiterWorkspaceApiError(error);
  }
}
