import { ResumeLibraryServiceError } from "@/services/resumeLibrary.service";
import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { ResumeLibraryValidationError } from "@/utils/resumeLibraryValidation";

export function handleResumeLibraryApiError(error: unknown): Response {
  if (error instanceof ResumeLibraryValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof ResumeLibraryServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
