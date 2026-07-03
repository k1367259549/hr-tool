import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resumeEvaluationResultService } from "@/services/resumeEvaluationResult.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { ResumeEvaluationOptionsDto } from "@/types/resumeEvaluationResult";
import { handleResumeEvaluationApiError } from "@/app/api/resume-evaluations/errorHandling";
import { ResumeEvaluationValidationError } from "@/utils/resumeEvaluationValidation";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const resumeId = request.nextUrl.searchParams.get("resumeId");

    if (!resumeId || !resumeId.trim()) {
      throw new ResumeEvaluationValidationError("resumeId 查询参数为必填项。");
    }

    const options = await resumeEvaluationResultService.getEvaluationOptions(resumeId.trim());

    return NextResponse.json<ApiSuccessResponse<ResumeEvaluationOptionsDto>>(
      {
        data: options,
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
