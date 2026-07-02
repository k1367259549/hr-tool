import type { NextRequest } from "next/server";
import {
  resumeEvaluationService,
  ResumeEvaluationServiceError
} from "@/services/resumeEvaluation.service";
import type { ResumeEvaluateInput, ResumeEvaluateOutput } from "@/types/resumeEvaluation";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const payload = parseResumeEvaluatePayload(body);
    const evaluation = await resumeEvaluationService.evaluateResume(payload);

    return successResponse<ResumeEvaluateOutput>(evaluation);
  } catch (error) {
    return handleResumeEvaluationApiError(error);
  }
}

function parseResumeEvaluatePayload(payload: unknown): ResumeEvaluateInput {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ResumeEvaluationServiceError("VALIDATION_ERROR", "请求体必须是 JSON 对象。");
  }

  const record = payload as Record<string, unknown>;
  const resumeText = record.resumeText;
  const jobDescription = record.jobDescription;

  if (typeof resumeText !== "string") {
    throw new ResumeEvaluationServiceError("VALIDATION_ERROR", "resumeText 为必填字符串。");
  }

  if (typeof jobDescription !== "string") {
    throw new ResumeEvaluationServiceError("VALIDATION_ERROR", "jobDescription 为必填字符串。");
  }

  return {
    resumeText,
    jobDescription
  };
}

function handleResumeEvaluationApiError(error: unknown): Response {
  if (error instanceof ResumeEvaluationServiceError) {
    const status = error.code === "AI_ERROR" ? 502 : 400;

    return errorResponse(error.code, error.message, status);
  }

  return handleApiError(error);
}
