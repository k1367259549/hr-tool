import type { NextRequest } from "next/server";
import {
  knowledgeExtractionService,
  KnowledgeExtractionServiceError
} from "@/services/knowledgeExtraction.service";
import type { Knowledge, KnowledgeExtractPayload } from "@/types/knowledge";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { handleKnowledgeApiError } from "../knowledgeApiError";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const payload = parseKnowledgeExtractPayload(body);
    const entries = await knowledgeExtractionService.extractKnowledge(payload);

    return successResponse<Knowledge[]>(entries, 201);
  } catch (error) {
    return handleKnowledgeApiError(error);
  }
}

function parseKnowledgeExtractPayload(payload: unknown): KnowledgeExtractPayload {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new KnowledgeExtractionServiceError(
      "VALIDATION_ERROR",
      "Request body must be a JSON object."
    );
  }

  const date = (payload as Record<string, unknown>).date;

  if (typeof date !== "string" || !date) {
    throw new KnowledgeExtractionServiceError("VALIDATION_ERROR", "Date is required.");
  }

  return {
    date
  };
}
