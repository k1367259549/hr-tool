export type ApiErrorCode =
  | "LOG_NOT_FOUND"
  | "REVIEW_NOT_FOUND"
  | "PLAN_NOT_FOUND"
  | "KNOWLEDGE_NOT_FOUND"
  | "AI_ERROR"
  | "VALIDATION_ERROR"
  | "DB_ERROR"
  | "CONFLICT_ERROR";

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
