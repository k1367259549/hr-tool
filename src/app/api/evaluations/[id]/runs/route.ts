import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  resumeEvaluationRunService,
  ResumeEvaluationRunServiceError
} from "@/services/resumeEvaluationRun.service";
import type { ApiSuccessResponse } from "@/types/api";
import type { ResumeEvaluationRunDto } from "@/types/resumeEvaluationRun";
import {
  ApiRequestError,
  errorResponse,
  handleApiError,
  successResponse
} from "@/utils/apiResponse";
import {
  parseResumeEvaluationRunCreatePayload,
  ResumeEvaluationRunValidationError
} from "@/utils/resumeEvaluationRunValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const runs = await resumeEvaluationRunService.listRunsByEvaluationId(id);

    return NextResponse.json<ApiSuccessResponse<ResumeEvaluationRunDto[]>>(
      {
        data: runs,
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
    return handleEvaluationRunApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const payload = await readOptionalJsonBody(request);

    parseResumeEvaluationRunCreatePayload(payload);

    const run = await resumeEvaluationRunService.createMockEvaluationRun(id);

    return successResponse<ResumeEvaluationRunDto>(run, 201);
  } catch (error) {
    return handleEvaluationRunApiError(error);
  }
}

async function readOptionalJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();

  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError("VALIDATION_ERROR", "请求体必须是有效 JSON。", 400);
  }
}

function handleEvaluationRunApiError(error: unknown): Response {
  if (error instanceof ResumeEvaluationRunValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }

  if (error instanceof ResumeEvaluationRunServiceError) {
    if (error.code === "NOT_FOUND") {
      return errorResponse("NOT_FOUND", error.message, 404);
    }

    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
