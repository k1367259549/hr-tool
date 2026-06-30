import { errorResponse, handleApiError } from "@/utils/apiResponse";
import { KnowledgeValidationError } from "@/utils/knowledgeValidation";

export function handleKnowledgeApiError(error: unknown): Response {
  if (error instanceof KnowledgeValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  return handleApiError(error);
}
