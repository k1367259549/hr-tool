import type { NextRequest } from "next/server";
import { recruitTogetherService } from "@/services/recruitTogether.service";
import type { RecruiterSummaryResult } from "@/types/recruitTogether";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseRecruiterSummaryPayload } from "@/utils/recruitTogetherValidation";
import { handleRecruitTogetherApiError } from "../route";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRecruiterSummaryPayload(body);
    const result = await recruitTogetherService.generateRecruiterSummary(input);

    return successResponse<RecruiterSummaryResult>(result);
  } catch (error) {
    return handleRecruitTogetherApiError(error);
  }
}
