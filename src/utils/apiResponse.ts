import { NextResponse } from "next/server";
import type {
  ApiErrorCode,
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse
} from "@/types/api";

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
  code: ApiErrorCode,
  message: string,
  status = 500
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message
      }
    },
    {
      status
    }
  );
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiRequestError("VALIDATION_ERROR", "Request body must be valid JSON.", 400);
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  if (error instanceof ApiRequestError) {
    return errorResponse(error.code, error.message, error.status);
  }

  return errorResponse("DB_ERROR", "Request failed.", 500);
}
