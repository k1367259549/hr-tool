import type { AvailableResumeQuery, LinkResumeInput } from "@/types/candidateResumeLink";

const allowedLinkFields = ["resumeId"] as const;
const supportedResumeFileTypes = new Set(["PDF", "DOCX", "TXT"]);

export class CandidateResumeLinkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateResumeLinkValidationError";
  }
}

export function parseLinkResumePayload(payload: unknown): LinkResumeInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, allowedLinkFields);

  return {
    resumeId: readRequiredText(body, "resumeId", 120)
  };
}

export function parseAvailableResumeQuery(searchParams: URLSearchParams): AvailableResumeQuery {
  const fileType = normalizeOptionalText(searchParams.get("fileType"), 20)?.toUpperCase();

  if (fileType && !supportedResumeFileTypes.has(fileType)) {
    throw new CandidateResumeLinkValidationError("fileType 仅支持 PDF、DOCX 或 TXT。");
  }

  return {
    fileType,
    page: readPositiveInteger(searchParams.get("page"), 1, 1, 100000),
    pageSize: readPositiveInteger(searchParams.get("pageSize"), 20, 1, 100),
    search: normalizeOptionalText(searchParams.get("search"), 120)
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CandidateResumeLinkValidationError("请求体必须是 JSON 对象。");
  }

  return value as Record<string, unknown>;
}

function assertAllowedFields(
  body: Record<string, unknown>,
  allowedFields: readonly string[]
): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Object.keys(body).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new CandidateResumeLinkValidationError(`不支持的字段：${unknownFields.join(", ")}。`);
  }
}

function readRequiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CandidateResumeLinkValidationError(`${field} 为必填项。`);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new CandidateResumeLinkValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | null, maxLength: number): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    throw new CandidateResumeLinkValidationError(`查询参数不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function readPositiveInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new CandidateResumeLinkValidationError(
      `分页参数必须是 ${min} 到 ${max} 之间的整数。`
    );
  }

  return parsed;
}
