import {
  RecruiterWorkspaceServiceError
} from "@/services/recruiterWorkspace.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";

export function handleRecruiterWorkspaceApiError(error: unknown): Response {
  if (error instanceof RecruiterWorkspaceServiceError) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
