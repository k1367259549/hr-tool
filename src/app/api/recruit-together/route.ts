import type { NextRequest } from "next/server";
import {
  recruitTogetherService
} from "@/services/recruitTogether.service";
import type { RecruitTogetherPageData, RecruitTogetherWorkflowDto } from "@/types/recruitTogether";
import { handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseRecruitTogetherSavePayload } from "@/utils/recruitTogetherValidation";
import { handleRecruitTogetherApiError } from "./errorHandling";

export async function GET(): Promise<Response> {
  try {
    const data = await recruitTogetherService.getPageData();

    return successResponse<RecruitTogetherPageData>(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruitTogetherSavePayload(body);
    const workflow = await recruitTogetherService.saveWorkflow(input);

    return successResponse<RecruitTogetherWorkflowDto>(workflow, 201);
  } catch (error) {
    return handleRecruitTogetherApiError(error);
  }
}
