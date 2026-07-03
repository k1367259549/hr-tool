import type { NextRequest } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { EvaluationTemplateVersionSummaryDto } from "@/types/evaluationTemplate";
import { successResponse } from "@/utils/apiResponse";
import { handleEvaluationTemplateApiError } from "../../../evaluation-templates/errorHandling";

type EvaluationTemplateVersionPublishRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: NextRequest,
  context: EvaluationTemplateVersionPublishRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const version = await evaluationTemplateService.publishVersion(id);

    return successResponse<EvaluationTemplateVersionSummaryDto>(version);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
