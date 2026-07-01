import type { NextRequest } from "next/server";
import { recruitTogetherService } from "@/services/recruitTogether.service";
import type { PhonePreparationResult } from "@/types/recruitTogether";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseRecruitTogetherContextPayload } from "@/utils/recruitTogetherValidation";
import { handleRecruitTogetherApiError } from "../route";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruitTogetherContextPayload(body);
    const result = await recruitTogetherService.generatePhonePreparation(input);

    return successResponse<PhonePreparationResult>(result);
  } catch (error) {
    return handleRecruitTogetherApiError(error);
  }
}
