import type { NextRequest } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { EvaluationTemplateDetailDto } from "@/types/evaluationTemplate";
import { successResponse } from "@/utils/apiResponse";
import { handleEvaluationTemplateApiError } from "../../errorHandling";

type EvaluationTemplateArchiveRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: NextRequest,
  context: EvaluationTemplateArchiveRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const template = await evaluationTemplateService.archiveTemplate(id);

    return successResponse<EvaluationTemplateDetailDto>(template);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
