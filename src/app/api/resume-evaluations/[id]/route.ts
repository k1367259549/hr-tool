import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resumeEvaluationResultService } from "@/services/resumeEvaluationResult.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { ResumeEvaluationDetailDto } from "@/types/resumeEvaluationResult";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseResumeEvaluationUpdatePayload } from "@/utils/resumeEvaluationValidation";
import { handleResumeEvaluationApiError } from "../errorHandling";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const evaluation = await resumeEvaluationResultService.getEvaluation(id);

    return NextResponse.json<ApiSuccessResponse<ResumeEvaluationDetailDto>>(
      {
        data: evaluation,
        error: null,
        success: true
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return handleResumeEvaluationApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const input = parseResumeEvaluationUpdatePayload(body);
    const evaluation = await resumeEvaluationResultService.updateDraftEvaluation(id, input);

    return successResponse<ResumeEvaluationDetailDto>(evaluation);
  } catch (error) {
    return handleResumeEvaluationApiError(error);
  }
}
