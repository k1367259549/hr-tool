import type { ResumeIntakeSource } from "@prisma/client";
import {
  getNormalizedResumeFileType,
  isSupportedResumeFileName,
  MAX_RESUME_FILE_SIZE_BYTES,
  RESUME_FILE_SIZE_LIMIT_LABEL
} from "@/config/resume.config";
import type {
  ResumeFileType,
  ResumeLibraryUploadInput,
  ResumeLinkStatus,
  ResumeListQuery,
  ResumeMetadataUpdateInput,
  ResumeParsingStatus
} from "@/types/resumeLibrary";

const supportedFileTypes = ["PDF", "DOCX", "TXT"] as const;
const supportedParsingStatuses = ["PARSED", "FAILED"] as const;
const supportedIntakeSources = ["RESUME_LIBRARY", "CANDIDATE_UNDERSTANDING"] as const;
const supportedLinkStatuses = ["linked", "unlinked", "all"] as const;
const uploadFields = ["file", "candidateSource", "notes"] as const;
const metadataFields = ["candidateSource", "notes"] as const;

export class ResumeLibraryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeLibraryValidationError";
  }
}

export function parseResumeListQuery(searchParams: URLSearchParams): ResumeListQuery {
  return {
    fileType: readOptionalEnum(searchParams.get("fileType"), supportedFileTypes, "fileType"),
    intakeSource: readOptionalEnum(
      searchParams.get("intakeSource"),
      supportedIntakeSources,
      "intakeSource"
    ),
    linkStatus:
      readOptionalEnum(searchParams.get("linkStatus"), supportedLinkStatuses, "linkStatus") ??
      "all",
    page: readPositiveInteger(searchParams.get("page"), 1, 1, 100000),
    pageSize: readPositiveInteger(searchParams.get("pageSize"), 20, 1, 100),
    parsingStatus: readOptionalEnum(
      searchParams.get("parsingStatus"),
      supportedParsingStatuses,
      "parsingStatus"
    ),
    search: normalizeQueryText(searchParams.get("search"), 120)
  };
}

export function parseResumeUploadFormData(formData: FormData): ResumeLibraryUploadInput {
  assertAllowedFormFields(formData, uploadFields);
  const fileValue = formData.get("file");

  if (!isFileLike(fileValue)) {
    throw new ResumeLibraryValidationError("请上传简历文件。");
  }

  validateResumeFile(fileValue);

  return {
    candidateSource: readNullableFormText(formData, "candidateSource", 120),
    file: fileValue,
    notes: readNullableFormText(formData, "notes", 5000)
  };
}

export function parseResumeMetadataUpdatePayload(payload: unknown): ResumeMetadataUpdateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, metadataFields);

  if (Object.keys(body).length === 0) {
    throw new ResumeLibraryValidationError("更新内容不能为空。");
  }

  return {
    candidateSource: readNullableText(body, "candidateSource", 120),
    notes: readNullableText(body, "notes", 5000)
  };
}

export function validateResumeFile(file: File): ResumeFileType {
  if (file.size <= 0) {
    throw new ResumeLibraryValidationError("简历文件不能为空。");
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new ResumeLibraryValidationError(`简历文件不能超过 ${RESUME_FILE_SIZE_LIMIT_LABEL}。`);
  }

  const fileType = getNormalizedResumeFileType(file.name);

  if (!isSupportedResumeFileName(file.name) || !fileType) {
    throw new ResumeLibraryValidationError("仅支持 PDF、DOCX、TXT 简历。");
  }

  return fileType;
}

function assertAllowedFormFields(formData: FormData, allowedFields: readonly string[]): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Array.from(formData.keys()).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new ResumeLibraryValidationError(`不支持的字段：${unknownFields.join(", ")}。`);
  }
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ResumeLibraryValidationError("请求体必须是 JSON 对象。");
  }

  return value as Record<string, unknown>;
}

function assertAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Object.keys(body).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new ResumeLibraryValidationError(`不支持的字段：${unknownFields.join(", ")}。`);
  }
}

function readNullableFormText(
  formData: FormData,
  field: string,
  maxLength: number
): string | null | undefined {
  if (!formData.has(field)) {
    return undefined;
  }

  const value = formData.get(field);

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ResumeLibraryValidationError(`${field} 必须是字符串。`);
  }

  return normalizeNullableText(value, field, maxLength);
}

function readNullableText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | null | undefined {
  if (!(field in body)) {
    return undefined;
  }

  const value = body[field];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ResumeLibraryValidationError(`${field} 必须是字符串。`);
  }

  return normalizeNullableText(value, field, maxLength);
}

function normalizeNullableText(
  value: string,
  field: string,
  maxLength: number
): string | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new ResumeLibraryValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function readOptionalEnum<TValue extends string>(
  value: string | null,
  allowedValues: readonly TValue[],
  field: string
): TValue | undefined {
  const normalized = normalizeQueryText(value, 80);

  if (!normalized) {
    return undefined;
  }

  if (!allowedValues.includes(normalized as TValue)) {
    throw new ResumeLibraryValidationError(`${field} 参数无效。`);
  }

  return normalized as TValue;
}

function readPositiveInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ResumeLibraryValidationError(`分页参数必须是 ${min} 到 ${max} 之间的整数。`);
  }

  return parsed;
}

function normalizeQueryText(value: string | null, maxLength: number): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    throw new ResumeLibraryValidationError(`查询参数不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

export function isResumeFileType(value: string): value is ResumeFileType {
  return supportedFileTypes.includes(value as ResumeFileType);
}

export function isResumeParsingStatus(value: string): value is ResumeParsingStatus {
  return supportedParsingStatuses.includes(value as ResumeParsingStatus);
}

export function isResumeIntakeSource(value: string): value is ResumeIntakeSource {
  return supportedIntakeSources.includes(value as ResumeIntakeSource);
}

export function isResumeLinkStatus(value: string): value is ResumeLinkStatus {
  return supportedLinkStatuses.includes(value as ResumeLinkStatus);
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  if (typeof value !== "object" || value === null || typeof value === "string") {
    return false;
  }

  const candidate = value as {
    arrayBuffer?: unknown;
    name?: unknown;
    size?: unknown;
  };

  return (
    typeof candidate.arrayBuffer === "function" &&
    typeof candidate.name === "string" &&
    typeof candidate.size === "number"
  );
}
