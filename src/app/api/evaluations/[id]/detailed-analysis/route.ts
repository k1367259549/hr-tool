import type { NextRequest } from "next/server";
import {
  createEvaluationProviderFromRuntimeConfig,
  readEvaluationProviderRuntimeConfig
} from "@/lib/evaluation/provider-runtime-config";
import {
  resumeEvaluationRunService,
  ResumeEvaluationRunServiceError
} from "@/services/resumeEvaluationRun.service";
import type { DetailedAnalysisRunDto } from "@/types/resumeEvaluationRun";
import { errorResponse, handleApiError, successResponse } from "@/utils/apiResponse";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const latestDetailedRun =
      await resumeEvaluationRunService.getLatestDetailedAnalysisRunByEvaluationId(id);

    return successResponse<DetailedAnalysisRunDto | null>(latestDetailedRun);
  } catch (error) {
    return handleDetailedAnalysisApiError(error);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const runtimeConfig = readEvaluationProviderRuntimeConfig(process.env);
    const provider = createEvaluationProviderFromRuntimeConfig(runtimeConfig);
    const result = await resumeEvaluationRunService.createDetailedAnalysisRun(id, {
      provider
    });

    return successResponse<DetailedAnalysisRunDto>(result, result.success ? 201 : 200);
  } catch (error) {
    return handleDetailedAnalysisApiError(error);
  }
}

function handleDetailedAnalysisApiError(error: unknown): Response {
  if (error instanceof ResumeEvaluationRunServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    if (error.code === "CONFLICT") {
      return errorResponse("CONFLICT", error.message, 409);
    }

    const status =
      error.code === "VALIDATION_ERROR"
        ? 400
        : error.code === "CONFIG_ERROR"
          ? 500
          : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
