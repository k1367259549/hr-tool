import type { NextRequest } from "next/server";
import { candidateService } from "@/services/candidate.service";
import type { CandidateDto } from "@/types/candidate";
import { successResponse } from "@/utils/apiResponse";
import { handleCandidateApiError } from "../../errorHandling";

type CandidateRestoreRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: NextRequest,
  context: CandidateRestoreRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const candidate = await candidateService.restoreCandidate(id);

    return successResponse<CandidateDto>(candidate);
  } catch (error) {
    return handleCandidateApiError(error);
  }
}
