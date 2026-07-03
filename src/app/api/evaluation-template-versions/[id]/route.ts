import type { NextRequest } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { EvaluationTemplateVersionSummaryDto } from "@/types/evaluationTemplate";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseDraftVersionUpdatePayload } from "@/utils/evaluationTemplateValidation";
import { handleEvaluationTemplateApiError } from "../../evaluation-templates/errorHandling";

type EvaluationTemplateVersionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: EvaluationTemplateVersionRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseDraftVersionUpdatePayload(body);
    const version = await evaluationTemplateService.updateDraftVersion(id, input);

    return successResponse<EvaluationTemplateVersionSummaryDto>(version);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
