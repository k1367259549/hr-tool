import type { NextRequest } from "next/server";
import { candidateApplicationService } from "@/services/candidateApplication.service";
import type {
  ApplicationListResultDto,
  CandidateApplicationDetailDto
} from "@/types/candidateApplication";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseApplicationCreatePayload,
  parseApplicationListQuery
} from "@/utils/candidateApplicationValidation";
import { handleCandidateApplicationApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = parseApplicationListQuery(request.nextUrl.searchParams);
    const result = await candidateApplicationService.listApplications(query);

    return successResponse<ApplicationListResultDto>(result);
  } catch (error) {
    return handleCandidateApplicationApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseApplicationCreatePayload(body);
    const application = await candidateApplicationService.createApplication(input);

    return successResponse<CandidateApplicationDetailDto>(application, 201);
  } catch (error) {
    return handleCandidateApplicationApiError(error);
  }
}
