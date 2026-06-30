import type { NextRequest } from "next/server";
import { knowledgeService } from "@/services/knowledge.service";
import type { Knowledge } from "@/types/knowledge";
import { errorResponse, readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseKnowledgeUpdatePayload,
  validateKnowledgeId
} from "@/utils/knowledgeValidation";
import { handleKnowledgeApiError } from "../knowledgeApiError";

type KnowledgeIdRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: KnowledgeIdRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    validateKnowledgeId(id);

    const knowledge = await knowledgeService.getKnowledgeById(id);

    if (!knowledge) {
      return errorResponse("KNOWLEDGE_NOT_FOUND", "Knowledge entry not found.", 404);
    }

    return successResponse<Knowledge>(knowledge);
  } catch (error) {
    return handleKnowledgeApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: KnowledgeIdRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    validateKnowledgeId(id);

    const existingKnowledge = await knowledgeService.getKnowledgeById(id);

    if (!existingKnowledge) {
      return errorResponse("KNOWLEDGE_NOT_FOUND", "Knowledge entry not found.", 404);
    }

    const body = await readJsonBody(request);
    const input = parseKnowledgeUpdatePayload(body);
    const knowledge = await knowledgeService.updateKnowledge(id, input);

    return successResponse<Knowledge>(knowledge);
  } catch (error) {
    return handleKnowledgeApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: KnowledgeIdRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    validateKnowledgeId(id);

    const existingKnowledge = await knowledgeService.getKnowledgeById(id);

    if (!existingKnowledge) {
      return errorResponse("KNOWLEDGE_NOT_FOUND", "Knowledge entry not found.", 404);
    }

    const knowledge = await knowledgeService.deleteKnowledge(id);

    return successResponse<Knowledge>(knowledge);
  } catch (error) {
    return handleKnowledgeApiError(error);
  }
}
