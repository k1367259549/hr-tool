import type { NextRequest } from "next/server";
import { candidateService } from "@/services/candidate.service";
import type { CandidateDto, CandidateListResultDto } from "@/types/candidate";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseCandidateCreatePayload,
  parseCandidateListQuery
} from "@/utils/candidateValidation";
import { handleCandidateApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = parseCandidateListQuery(request.nextUrl.searchParams);
    const candidates = await candidateService.listCandidates(query);

    return successResponse<CandidateListResultDto>(candidates);
  } catch (error) {
    return handleCandidateApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseCandidateCreatePayload(body);
    const candidate = await candidateService.createCandidate(input);

    return successResponse<CandidateDto>(candidate, 201);
  } catch (error) {
    return handleCandidateApiError(error);
  }
}
