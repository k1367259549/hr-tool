import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  EvaluationTemplateDetailDto,
  EvaluationTemplateListResultDto
} from "@/types/evaluationTemplate";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import {
  parseEvaluationTemplateCreatePayload,
  parseEvaluationTemplateListQuery
} from "@/utils/evaluationTemplateValidation";
import { handleEvaluationTemplateApiError } from "./errorHandling";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const query = parseEvaluationTemplateListQuery(request.nextUrl.searchParams);
    const result = await evaluationTemplateService.listTemplates(query);

    return NextResponse.json<ApiSuccessResponse<EvaluationTemplateListResultDto>>(
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
    return handleEvaluationTemplateApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseEvaluationTemplateCreatePayload(body);
    const template = await evaluationTemplateService.createTemplate(input);

    return successResponse<EvaluationTemplateDetailDto>(template, 201);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
