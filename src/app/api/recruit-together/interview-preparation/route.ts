import type { NextRequest } from "next/server";
import { recruitTogetherService } from "@/services/recruitTogether.service";
import type { InterviewPreparationResult } from "@/types/recruitTogether";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseInterviewPreparationPayload } from "@/utils/recruitTogetherValidation";
import { handleRecruitTogetherApiError } from "../route";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseInterviewPreparationPayload(body);
    const result = await recruitTogetherService.generateInterviewPreparation(input);

    return successResponse<InterviewPreparationResult>(result);
  } catch (error) {
    return handleRecruitTogetherApiError(error);
  }
}
