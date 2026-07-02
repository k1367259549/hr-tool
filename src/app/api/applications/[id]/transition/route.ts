import type { NextRequest } from "next/server";
import { candidateApplicationService } from "@/services/candidateApplication.service";
import type { CandidateApplicationDetailDto } from "@/types/candidateApplication";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseApplicationTransitionPayload } from "@/utils/candidateApplicationValidation";
import { handleCandidateApplicationApiError } from "../../errorHandling";

type ApplicationTransitionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: ApplicationTransitionRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseApplicationTransitionPayload(body);
    const application = await candidateApplicationService.transitionApplicationStage(id, input);

    return successResponse<CandidateApplicationDetailDto>(application);
  } catch (error) {
    return handleCandidateApplicationApiError(error);
  }
}
