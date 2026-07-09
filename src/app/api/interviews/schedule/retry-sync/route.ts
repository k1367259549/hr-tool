import { NextResponse } from "next/server";
import {
  retryInterviewScheduleSync,
  type RetryInterviewScheduleSyncInput,
  type RetryInterviewScheduleSyncResult
} from "@/lib/interviewScheduling/retryInterviewScheduleSync";
import {
  ApiRequestError,
  handleApiError,
  readJsonBody,
  successResponse
} from "@/utils/apiResponse";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const input = parseRetryPayload(body);
    const result = await retryInterviewScheduleSync(input);

    if (!result.success) {
      return retryFailureResponse(result);
    }

    return successResponse<RetryInterviewScheduleSyncResult>(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

function parseRetryPayload(payload: unknown): RetryInterviewScheduleSyncInput {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiRequestError("VALIDATION_ERROR", "请求体必须是 JSON 对象。", 400);
  }

  const source = payload as Record<string, unknown>;
  const syncId = source.syncId;

  if (typeof syncId !== "string" || !syncId.trim()) {
    throw new ApiRequestError("VALIDATION_ERROR", "syncId is required.", 400);
  }

  return {
    syncId: syncId.trim()
  };
}

function retryFailureResponse(
  result: Extract<RetryInterviewScheduleSyncResult, { success: false }>
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
      status: 502
    }
  );
}
