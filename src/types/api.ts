import type { StandardErrorCode } from "@/types/error";

export type ApiErrorCode = StandardErrorCode;

export type ApiError = {
  code: ApiErrorCode;
  message: string;
};

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  error: null;
};

export type ApiErrorResponse = {
  success: false;
  data: null;
  error: ApiError;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
