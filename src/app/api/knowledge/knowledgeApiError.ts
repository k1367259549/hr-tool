import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { KnowledgeExtractionServiceError } from "@/services/knowledgeExtraction.service";
import { KnowledgeValidationError } from "@/utils/knowledgeValidation";

export function handleKnowledgeApiError(error: unknown): Response {
  if (error instanceof KnowledgeValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof KnowledgeExtractionServiceError) {
    if (error.code === "LOG_NOT_FOUND") {
      return errorResponse("LOG_NOT_FOUND", error.message, 404);
    }

    if (error.code === "VALIDATION_ERROR") {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }

    return errorResponse("AI_ERROR", error.message, 502);
  }

  return handleApiError(error);
}
