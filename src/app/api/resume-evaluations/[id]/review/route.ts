import type { NextRequest } from "next/server";
import { resumeEvaluationResultService } from "@/services/resumeEvaluationResult.service";
import type { ResumeEvaluationDetailDto } from "@/types/resumeEvaluationResult";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseResumeEvaluationReviewPayload } from "@/utils/resumeEvaluationValidation";
import { handleResumeEvaluationApiError } from "../../errorHandling";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const input = parseResumeEvaluationReviewPayload(body);
    const evaluation = await resumeEvaluationResultService.reviewEvaluation(id, input);

    return successResponse<ResumeEvaluationDetailDto>(evaluation);
  } catch (error) {
    return handleResumeEvaluationApiError(error);
  }
}
