import type {
  CandidateCreateInput,
  CandidateListQuery,
  CandidateStatus,
  CandidateUpdateInput
} from "@/types/candidate";

const candidateStatuses = ["ACTIVE", "TALENT_POOL", "ARCHIVED"] as const;
const writableStatuses = ["ACTIVE", "TALENT_POOL"] as const;
const createFields = [
  "fullName",
  "email",
  "phone",
  "currentCompany",
  "currentTitle",
  "targetRoles",
  "sourceChannel",
  "owner",
  "tags",
  "notes",
  "status"
] as const;
const updateFields = createFields;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CandidateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateValidationError";
  }
}

export function parseCandidateCreatePayload(payload: unknown): CandidateCreateInput {
  const body = assertRecord(payload);

  assertAllowedFields(body, createFields);

  return {
    currentCompany: readNullableText(body, "currentCompany", 120),
    currentTitle: readNullableText(body, "currentTitle", 120),
    email: readEmail(body, "email"),
    fullName: readRequiredText(body, "fullName", 120),
    notes: readNullableText(body, "notes", 5000),
    owner: readNullableText(body, "owner", 120),
    phone: readNullableText(body, "phone", 60),
    sourceChannel: readNullableText(body, "sourceChannel", 120),
    status: readWritableStatus(body, "status"),
    tags: readStringList(body, "tags"),
    targetRoles: readStringList(body, "targetRoles")
  };
}

export function parseCandidateUpdatePayload(payload: unknown): CandidateUpdateInput {
  const body = assertRecord(payload);

  assertAllowedFields(body, updateFields);

  if (Object.keys(body).length === 0) {
    throw new CandidateValidationError("更新内容不能为空。");
  }

  return {
    currentCompany: readNullableText(body, "currentCompany", 120),
    currentTitle: readNullableText(body, "currentTitle", 120),
    email: readEmail(body, "email"),
    fullName: readOptionalRequiredText(body, "fullName", 120),
    notes: readNullableText(body, "notes", 5000),
    owner: readNullableText(body, "owner", 120),
    phone: readNullableText(body, "phone", 60),
    sourceChannel: readNullableText(body, "sourceChannel", 120),
    status: readWritableStatus(body, "status"),
    tags: readStringList(body, "tags"),
    targetRoles: readStringList(body, "targetRoles")
  };
}

export function parseCandidateListQuery(searchParams: URLSearchParams): CandidateListQuery {
  const status = readQueryStatus(searchParams.get("status"));

  return {
    owner: normalizeQueryText(searchParams.get("owner"), 120),
    page: readPositiveInteger(searchParams.get("page"), 1, 1, 100000),
    pageSize: readPositiveInteger(searchParams.get("pageSize"), 20, 1, 100),
    search: normalizeQueryText(searchParams.get("search"), 120),
    sourceChannel: normalizeQueryText(searchParams.get("sourceChannel"), 120),
    status
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CandidateValidationError("请求体必须是 JSON 对象。");
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
    throw new CandidateValidationError(`不支持的字段：${unknownFields.join(", ")}。`);
  }
}

function readRequiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CandidateValidationError(`${field} 为必填项。`);
  }

  return normalizeBoundedText(value, field, maxLength);
}

function readOptionalRequiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | undefined {
  if (!(field in body)) {
    return undefined;
  }

  return readRequiredText(body, field, maxLength);
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
    throw new CandidateValidationError(`${field} 必须是字符串。`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    return null;
  }

  return normalizeBoundedText(normalized, field, maxLength);
}

function readEmail(
  body: Record<string, unknown>,
  field: string
): string | null | undefined {
  const value = readNullableText(body, field, 254);

  if (!value) {
    return value;
  }

  const normalized = value.toLowerCase();

  if (!emailPattern.test(normalized)) {
    throw new CandidateValidationError(`${field} 格式无效。`);
  }

  return normalized;
}

function readStringList(
  body: Record<string, unknown>,
  field: string
): string[] | undefined {
  if (!(field in body)) {
    return undefined;
  }

  const value = body[field];

  if (value === null) {
    return [];
  }

  const rawItems = typeof value === "string" ? value.split(",") : value;

  if (!Array.isArray(rawItems)) {
    throw new CandidateValidationError(`${field} 必须是字符串数组。`);
  }

  const normalizedItems: string[] = [];
  const seen = new Set<string>();

  rawItems.forEach((item) => {
    if (typeof item !== "string") {
      throw new CandidateValidationError(`${field} 必须只包含字符串。`);
    }

    const normalized = item.trim();

    if (!normalized) {
      return;
    }

    if (normalized.length > 80) {
      throw new CandidateValidationError(`${field} 中的单项不能超过 80 个字符。`);
    }

    const dedupeKey = normalized.toLowerCase();

    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      normalizedItems.push(normalized);
    }
  });

  return normalizedItems;
}

function readWritableStatus(
  body: Record<string, unknown>,
  field: string
): Exclude<CandidateStatus, "ARCHIVED"> | undefined {
  if (!(field in body) || body[field] === undefined || body[field] === null) {
    return undefined;
  }

  const value = body[field];

  if (typeof value !== "string") {
    throw new CandidateValidationError(`${field} 必须是字符串。`);
  }

  if (!writableStatuses.includes(value as (typeof writableStatuses)[number])) {
    throw new CandidateValidationError("普通保存不能将候选人设为 ARCHIVED。");
  }

  return value as Exclude<CandidateStatus, "ARCHIVED">;
}

function readQueryStatus(value: string | null): CandidateStatus | undefined {
  const normalized = normalizeQueryText(value, 30);

  if (!normalized) {
    return undefined;
  }

  if (!candidateStatuses.includes(normalized as CandidateStatus)) {
    throw new CandidateValidationError("status 无效。");
  }

  return normalized as CandidateStatus;
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

  if (!Number.isInteger(parsed) || parsed < min) {
    return fallback;
  }

  return Math.min(parsed, max);
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
    throw new CandidateValidationError(`查询参数不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function normalizeBoundedText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new CandidateValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}
