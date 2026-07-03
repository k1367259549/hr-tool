import type { NextRequest } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { EvaluationTemplateVersionSummaryDto } from "@/types/evaluationTemplate";
import { successResponse } from "@/utils/apiResponse";
import { handleEvaluationTemplateApiError } from "../../errorHandling";

type EvaluationTemplateVersionsRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: NextRequest,
  context: EvaluationTemplateVersionsRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const version = await evaluationTemplateService.createNextDraft(id);

    return successResponse<EvaluationTemplateVersionSummaryDto>(version, 201);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
