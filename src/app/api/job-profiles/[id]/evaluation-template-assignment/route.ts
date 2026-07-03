import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { evaluationTemplateService } from "@/services/evaluationTemplate.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { JobProfileEvaluationAssignmentResultDto } from "@/types/evaluationTemplate";
import { readJsonBody, successResponse } from "@/utils/apiResponse";
import { parseAssignmentPayload } from "@/utils/evaluationTemplateValidation";
import { handleEvaluationTemplateApiError } from "../../../evaluation-templates/errorHandling";

type JobProfileAssignmentRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: JobProfileAssignmentRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const assignment = await evaluationTemplateService.getJobProfileAssignment(id);

    return NextResponse.json<ApiSuccessResponse<JobProfileEvaluationAssignmentResultDto>>(
      {
        data: assignment,
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

export async function PUT(
  request: NextRequest,
  context: JobProfileAssignmentRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const input = parseAssignmentPayload(body);
    const assignment = await evaluationTemplateService.assignTemplateVersion(id, input);

    return successResponse<JobProfileEvaluationAssignmentResultDto>(assignment);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: JobProfileAssignmentRouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;
    const assignment = await evaluationTemplateService.unassignTemplateVersion(id);

    return successResponse<JobProfileEvaluationAssignmentResultDto>(assignment);
  } catch (error) {
    return handleEvaluationTemplateApiError(error);
  }
}
