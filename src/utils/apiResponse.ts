import { NextResponse } from "next/server";
import type {
  ApiErrorCode,
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse
} from "@/types/api";
import type { AppErrorCode } from "@/types/error";
import { AppError, logHandledError, normalizeAppError, normalizeErrorCode } from "@/utils/errors";

export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

export function successResponse<TData>(
  data: TData,
  status = 200
): NextResponse<ApiSuccessResponse<TData>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null
    },
    {
      status
    }
  );
}

export function errorResponse(
  code: AppErrorCode,
  message: string,
  status = 500
): NextResponse<ApiErrorResponse> {
  const normalizedCode = normalizeErrorCode(code);
  const normalizedError = normalizeAppError(new AppError(normalizedCode, message, status));

  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: normalizedError.code,
        message: normalizedError.message
      }
    },
    {
      status: normalizedError.status
    }
  );
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiRequestError("VALIDATION_ERROR", "请求体必须是有效 JSON。", 400);
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof ApiRequestError) {
    return errorResponse(error.code, error.message, error.status);
  }

  const normalizedError = normalizeAppError(error);

  if (normalizedError.code === "UNKNOWN_ERROR") {
    logHandledError("Unhandled API error.", error);
  }

  return errorResponse(normalizedError.code, normalizedError.message, normalizedError.status);
}
