import type { NextRequest } from "next/server";
import { candidateService } from "@/services/candidate.service";
import type { CandidateDto } from "@/types/candidate";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseCandidateUpdatePayload } from "@/utils/candidateValidation";
import { handleCandidateApiError } from "../errorHandling";

type CandidateRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: CandidateRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const candidate = await candidateService.getCandidate(id);

    return successResponse<CandidateDto>(candidate);
  } catch (error) {
    return handleCandidateApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: CandidateRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseCandidateUpdatePayload(body);
    const candidate = await candidateService.updateCandidate(id, input);

    return successResponse<CandidateDto>(candidate);
  } catch (error) {
    return handleCandidateApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: CandidateRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const candidate = await candidateService.archiveCandidate(id);

    return successResponse<CandidateDto>(candidate);
  } catch (error) {
    return handleCandidateApiError(error);
  }
}
