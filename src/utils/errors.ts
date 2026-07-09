import { logger } from "@/lib/logger";
import type {
  AppErrorCode,
  ErrorCategory,
  NormalizedAppError,
  StandardErrorCode,
  ValidationIssue
} from "@/types/error";

const fallbackMessages: Record<StandardErrorCode, string> = {
  AI_ERROR: "AI 生成失败。",
  CONFIG_ERROR: "系统配置无效。",
  CONFLICT: "资源冲突。",
  DATABASE_ERROR: "数据库请求失败。",
  FEISHU_SYNC_ERROR: "飞书同步失败。",
  NOT_FOUND: "资源不存在。",
  TIME_CONFLICT: "时间冲突。",
  UNKNOWN_ERROR: "请求失败。",
  VALIDATION_ERROR: "校验失败。"
};

const statusByCode: Record<StandardErrorCode, number> = {
  AI_ERROR: 502,
  CONFIG_ERROR: 500,
  CONFLICT: 409,
  DATABASE_ERROR: 500,
  FEISHU_SYNC_ERROR: 502,
  NOT_FOUND: 404,
  TIME_CONFLICT: 409,
  UNKNOWN_ERROR: 500,
  VALIDATION_ERROR: 400
};

const categoryByCode: Record<StandardErrorCode, ErrorCategory> = {
  AI_ERROR: "ai",
  CONFIG_ERROR: "config",
  CONFLICT: "validation",
  DATABASE_ERROR: "database",
  FEISHU_SYNC_ERROR: "unknown",
  NOT_FOUND: "not_found",
  TIME_CONFLICT: "validation",
  UNKNOWN_ERROR: "unknown",
  VALIDATION_ERROR: "validation"
};

export class AppError extends Error {
  readonly code: StandardErrorCode;
  readonly status: number;

  constructor(code: StandardErrorCode, message?: string, status?: number) {
    super(sanitizeErrorMessage(message) || fallbackMessages[code]);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? statusByCode[code];
  }
}

export function createValidationError(issues: ValidationIssue[] | string): AppError {
  const message = Array.isArray(issues) ? formatValidationIssues(issues) : issues;

  return new AppError("VALIDATION_ERROR", message, 400);
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return fallbackMessages.VALIDATION_ERROR;
  }

  return issues
    .map((issue) => (issue.field ? `${issue.field}: ${issue.message}` : issue.message))
    .join(" ");
}

export function normalizeErrorCode(code: AppErrorCode | string): StandardErrorCode {
  if (code === "VALIDATION_ERROR") {
    return "VALIDATION_ERROR";
  }

  if (code === "CONFLICT" || code === "CONFLICT_ERROR") {
    return "CONFLICT";
  }

  if (
    code === "FILE_REQUIRED" ||
    code === "FILE_TOO_LARGE" ||
    code === "UNSUPPORTED_FILE_TYPE" ||
    code === "SPREADSHEET_PARSE_ERROR"
  ) {
    return "VALIDATION_ERROR";
  }

  if (code === "AI_ERROR" || code === "AI_ANALYSIS_ERROR") {
    return "AI_ERROR";
  }

  if (code === "CONFIG_ERROR") {
    return "CONFIG_ERROR";
  }

  if (code === "FEISHU_SYNC_ERROR") {
    return "FEISHU_SYNC_ERROR";
  }

  if (code === "TIME_CONFLICT") {
    return "TIME_CONFLICT";
  }

  if (code.startsWith("AI_") || code === "JSON_PARSE_ERROR") {
    return "AI_ERROR";
  }

  if (code.startsWith("PROMPT_")) {
    return "CONFIG_ERROR";
  }

  if (code === "DATABASE_ERROR" || code === "DB_ERROR") {
    return "DATABASE_ERROR";
  }

  if (code.endsWith("_NOT_FOUND") || code === "NOT_FOUND") {
    return "NOT_FOUND";
  }

  return "UNKNOWN_ERROR";
}

export function normalizeAppError(
  error: unknown,
  fallbackCode: StandardErrorCode = "UNKNOWN_ERROR"
): NormalizedAppError {
  if (error instanceof AppError) {
    return {
      category: categoryByCode[error.code],
      code: error.code,
      message: error.message,
      status: error.status
    };
  }

  const errorWithCode = readErrorWithCode(error);

  if (errorWithCode) {
    const code = normalizeErrorCode(errorWithCode.code);

    return {
      category: categoryByCode[code],
      code,
      message: sanitizeErrorMessage(errorWithCode.message) || fallbackMessages[code],
      status: statusByCode[code]
    };
  }

  const code = fallbackCode;

  return {
    category: categoryByCode[code],
    code,
    message: fallbackMessages[code],
    status: statusByCode[code]
  };
}

export function getPublicErrorMessage(error: unknown, fallbackCode?: StandardErrorCode): string {
  return normalizeAppError(error, fallbackCode).message;
}

export function logHandledError(message: string, error: unknown): void {
  const normalizedError = normalizeAppError(error);

  logger.error(message, {
    category: normalizedError.category,
    code: normalizedError.code,
    errorMessage: normalizedError.message,
    status: normalizedError.status
  });
}

function readErrorWithCode(error: unknown): { code: string; message?: string } | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const candidate = error as { code?: unknown; message?: unknown };

  if (typeof candidate.code !== "string") {
    return null;
  }

  return {
    code: candidate.code,
    message: typeof candidate.message === "string" ? candidate.message : undefined
  };
}

function sanitizeErrorMessage(message: string | undefined): string {
  if (!message) {
    return "";
  }

  return message.replace(/\s+at\s[\s\S]+/g, "").trim();
}
