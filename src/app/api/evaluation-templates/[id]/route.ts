import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { EvaluationTemplateDetailDto } from "@/types/evaluationTemplate";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseEvaluationTemplateUpdatePayload } from "@/utils/evaluationTemplateValidation";
import { handleEvaluationTemplateApiError } from "../errorHandling";

type EvaluationTemplateRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: EvaluationTemplateRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const template = await evaluationTemplateService.getTemplate(id);

    return NextResponse.json<ApiSuccessResponse<EvaluationTemplateDetailDto>>(
      {
        data: template,
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
    return handleEvaluationTemplateApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: EvaluationTemplateRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseEvaluationTemplateUpdatePayload(body);
    const template = await evaluationTemplateService.updateTemplate(id, input);

    return successResponse<EvaluationTemplateDetailDto>(template);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
