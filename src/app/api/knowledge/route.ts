import type { NextRequest } from "next/server";
import { knowledgeService } from "@/services/knowledge.service";
import type { Knowledge } from "@/types/knowledge";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  normalizeKnowledgeQueryOptions,
  parseKnowledgeCreatePayload
} from "@/utils/knowledgeValidation";
import { handleKnowledgeApiError } from "./knowledgeApiError";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = normalizeKnowledgeQueryOptions({
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      tag: request.nextUrl.searchParams.get("tag") ?? undefined,
      keyword: request.nextUrl.searchParams.get("keyword") ?? undefined
    });
    const knowledgeEntries = await knowledgeService.getKnowledgeList(query);

    return successResponse<Knowledge[]>(knowledgeEntries);
  } catch (error) {
    return handleKnowledgeApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseKnowledgeCreatePayload(body);
    const knowledge = await knowledgeService.createKnowledge(input);

    return successResponse<Knowledge>(knowledge, 201);
  } catch (error) {
    return handleKnowledgeApiError(error);
  }
}
