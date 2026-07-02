import type { NextRequest } from "next/server";
import { candidateApplicationService } from "@/services/candidateApplication.service";
import type { CandidateApplicationDetailDto } from "@/types/candidateApplication";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseApplicationUpdatePayload } from "@/utils/candidateApplicationValidation";
import { handleCandidateApplicationApiError } from "../errorHandling";

type ApplicationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: ApplicationRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const application = await candidateApplicationService.getApplication(id);

    return successResponse<CandidateApplicationDetailDto>(application);
  } catch (error) {
    return handleCandidateApplicationApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: ApplicationRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseApplicationUpdatePayload(body);
    const application = await candidateApplicationService.updateApplicationMetadata(id, input);

    return successResponse<CandidateApplicationDetailDto>(application);
  } catch (error) {
    return handleCandidateApplicationApiError(error);
  }
}
