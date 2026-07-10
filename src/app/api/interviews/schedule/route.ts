import {
  scheduleInterview,
  ScheduleInterviewError
} from "@/lib/interviewScheduling/scheduleInterview";
import type {
  ScheduleInterviewInput,
  ScheduleInterviewResult
} from "@/lib/interviewScheduling/scheduleInterview";
import { NextResponse } from "next/server";
import { errorResponse, handleApiError, readJsonBody, successResponse } from "@/utils/apiResponse";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseScheduleInterviewPayload(body);
    const result = await scheduleInterview(input);

    if (!result.success && result.code === "FEISHU_PARTIAL_SYNC_FAILED") {
      return partialFailureResponse(result);
    }

    if (!result.success) {
      return errorResponse(result.code, result.message, 409);
    }

    return successResponse<ScheduleInterviewResult>(result, 201);
  } catch (error) {
    if (error instanceof ScheduleInterviewError) {
      const status =
        error.code === "VALIDATION_ERROR" || error.code === "INVALID_IDEMPOTENCY_KEY"
          ? 400
          : error.code === "CONFIG_ERROR"
            ? 500
            : 502;

      return errorResponse(error.code, error.message, status);
    }

    return handleApiError(error);
  }
}

function parseScheduleInterviewPayload(payload: unknown): ScheduleInterviewInput {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ScheduleInterviewError("VALIDATION_ERROR", "请求体必须是 JSON 对象。");
  }

  const source = payload as Record<string, unknown>;

  return {
    candidateId: readRequiredString(source, "candidateId"),
    endTime: readRequiredString(source, "endTime"),
    idempotencyKey: readRequiredString(source, "idempotencyKey"),
    interviewerEmail: readRequiredString(source, "interviewerEmail"),
    mode: readRequiredString(source, "mode"),
    round: readRequiredString(source, "round"),
    startTime: readRequiredString(source, "startTime")
  };
}

function readRequiredString(source: Record<string, unknown>, field: string): string {
  const value = source[field];

  if (typeof value !== "string" || !value.trim()) {
    throw new ScheduleInterviewError("VALIDATION_ERROR", `${field} is required.`);
  }

  return value.trim();
}

function partialFailureResponse(
  result: Extract<ScheduleInterviewResult, { code: "FEISHU_PARTIAL_SYNC_FAILED" }>
): NextResponse {
  return NextResponse.json(
    {
      data: result,
      error: {
        code: result.code,
        message: result.message
      },
      success: false
    },
    {
      status: 207
    }
  );
}
