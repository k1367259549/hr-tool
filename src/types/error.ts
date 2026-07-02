export type StandardErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "AI_ERROR"
  | "CONFIG_ERROR"
  | "UNKNOWN_ERROR";

export type LegacyErrorCode =
  | "LOG_NOT_FOUND"
  | "REVIEW_NOT_FOUND"
  | "PLAN_NOT_FOUND"
  | "KNOWLEDGE_NOT_FOUND"
  | "SPREADSHEET_NOT_FOUND"
  | "FILE_REQUIRED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "SPREADSHEET_PARSE_ERROR"
  | "AI_ANALYSIS_ERROR"
  | "DB_ERROR"
  | "CONFLICT_ERROR";

export type AppErrorCode = StandardErrorCode | LegacyErrorCode;

export type ErrorCategory =
  | "validation"
  | "not_found"
  | "database"
  | "ai"
  | "config"
  | "unknown";

export type AppErrorShape = {
  code: StandardErrorCode;
  message: string;
};

export type NormalizedAppError = AppErrorShape & {
  category: ErrorCategory;
  status: number;
};

export type ValidationIssue = {
  field?: string;
  message: string;
};
