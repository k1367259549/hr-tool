import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resumeEvaluationResultService } from "@/services/resumeEvaluationResult.service";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  ResumeEvaluationDetailDto,
  ResumeEvaluationListResultDto
} from "@/types/resumeEvaluationResult";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseResumeEvaluationCreatePayload,
  parseResumeEvaluationListQuery
} from "@/utils/resumeEvaluationValidation";
import { handleResumeEvaluationApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = parseResumeEvaluationListQuery(request.nextUrl.searchParams);
    const result = await resumeEvaluationResultService.listEvaluations(query);

    return NextResponse.json<ApiSuccessResponse<ResumeEvaluationListResultDto>>(
      {
        data: result,
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

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseResumeEvaluationCreatePayload(body);
    const evaluation = await resumeEvaluationResultService.createEvaluation(input);

    return successResponse<ResumeEvaluationDetailDto>(evaluation, 201);
  } catch (error) {
    return handleResumeEvaluationApiError(error);
  }
}
