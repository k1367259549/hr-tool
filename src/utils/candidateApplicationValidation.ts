import type {
  ApplicationCreateInput,
  ApplicationListQuery,
  ApplicationStage,
  ApplicationTransitionInput,
  ApplicationUpdateInput
} from "@/types/candidateApplication";

const applicationStages = [
  "NEW",
  "RESUME_SCREEN",
  "PHONE_SCREEN",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN"
] as const;
const listStatuses = ["open", "closed", "all"] as const;
const createFields = ["candidateId", "jobProfileId", "owner", "sourceChannel", "notes"] as const;
const updateFields = ["owner", "sourceChannel", "notes"] as const;
const transitionFields = ["toStage", "note"] as const;

export class CandidateApplicationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateApplicationValidationError";
  }
}

export function parseApplicationCreatePayload(payload: unknown): ApplicationCreateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, createFields);

  return {
    candidateId: readRequiredText(body, "candidateId", 120),
    jobProfileId: readRequiredText(body, "jobProfileId", 120),
    notes: readNullableText(body, "notes", 5000),
    owner: readNullableText(body, "owner", 120),
    sourceChannel: readNullableText(body, "sourceChannel", 120)
  };
}

export function parseApplicationUpdatePayload(payload: unknown): ApplicationUpdateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, updateFields);

  if (Object.keys(body).length === 0) {
    throw new CandidateApplicationValidationError("更新内容不能为空。");
  }

  return {
    notes: readNullableText(body, "notes", 5000),
    owner: readNullableText(body, "owner", 120),
    sourceChannel: readNullableText(body, "sourceChannel", 120)
  };
}

export function parseApplicationTransitionPayload(payload: unknown): ApplicationTransitionInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, transitionFields);

  return {
    note: readNullableText(body, "note", 1000),
    toStage: readStage(body, "toStage")
  };
}

export function parseApplicationListQuery(searchParams: URLSearchParams): ApplicationListQuery {
  return {
    candidateId: normalizeQueryText(searchParams.get("candidateId"), 120),
    jobProfileId: normalizeQueryText(searchParams.get("jobProfileId"), 120),
    owner: normalizeQueryText(searchParams.get("owner"), 120),
    page: readPositiveInteger(searchParams.get("page"), 1, 1, 100000),
    pageSize: readPositiveInteger(searchParams.get("pageSize"), 20, 1, 100),
    search: normalizeQueryText(searchParams.get("search"), 120),
    stage: readOptionalStage(searchParams.get("stage")),
    status: readListStatus(searchParams.get("status"))
  };
}

export function isTerminalApplicationStage(stage: ApplicationStage): boolean {
  return stage === "HIRED" || stage === "REJECTED" || stage === "WITHDRAWN";
}

export function getAllowedApplicationTransitions(stage: ApplicationStage): ApplicationStage[] {
  if (isTerminalApplicationStage(stage)) {
    return [];
  }

  const adjacent: Record<Exclude<ApplicationStage, "HIRED" | "REJECTED" | "WITHDRAWN">, ApplicationStage[]> = {
    INTERVIEW: ["PHONE_SCREEN", "OFFER", "REJECTED", "WITHDRAWN"],
    NEW: ["RESUME_SCREEN", "REJECTED", "WITHDRAWN"],
    OFFER: ["INTERVIEW", "HIRED", "REJECTED", "WITHDRAWN"],
    PHONE_SCREEN: ["RESUME_SCREEN", "INTERVIEW", "REJECTED", "WITHDRAWN"],
    RESUME_SCREEN: ["NEW", "PHONE_SCREEN", "REJECTED", "WITHDRAWN"]
  };

  return adjacent[stage as Exclude<ApplicationStage, "HIRED" | "REJECTED" | "WITHDRAWN">];
}

export function assertApplicationTransitionAllowed(
  fromStage: ApplicationStage,
  toStage: ApplicationStage
): void {
  if (fromStage === toStage) {
    throw new CandidateApplicationValidationError("目标阶段必须不同于当前阶段。");
  }

  if (!getAllowedApplicationTransitions(fromStage).includes(toStage)) {
    throw new CandidateApplicationValidationError("不允许的阶段移动。");
  }
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CandidateApplicationValidationError("请求体必须是 JSON 对象。");
  }

  return value as Record<string, unknown>;
}

function assertAllowedFields(body: Record<string, unknown>, allowedFields: readonly string[]): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Object.keys(body).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new CandidateApplicationValidationError(`不支持的字段：${unknownFields.join(", ")}。`);
  }
}

function readRequiredText(body: Record<string, unknown>, field: string, maxLength: number): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CandidateApplicationValidationError(`${field} 为必填项。`);
  }

  return normalizeBoundedText(value, field, maxLength);
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
    throw new CandidateApplicationValidationError(`${field} 必须是字符串。`);
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalizeBoundedText(normalized, field, maxLength);
}

function readStage(body: Record<string, unknown>, field: string): ApplicationStage {
  const value = body[field];

  if (typeof value !== "string") {
    throw new CandidateApplicationValidationError(`${field} 为必填项。`);
  }

  if (!applicationStages.includes(value as ApplicationStage)) {
    throw new CandidateApplicationValidationError("阶段无效。");
  }

  return value as ApplicationStage;
}

function readOptionalStage(value: string | null): ApplicationStage | undefined {
  const normalized = normalizeQueryText(value, 40);

  if (!normalized) {
    return undefined;
  }

  if (!applicationStages.includes(normalized as ApplicationStage)) {
    throw new CandidateApplicationValidationError("stage 无效。");
  }

  return normalized as ApplicationStage;
}

function readListStatus(value: string | null): ApplicationListQuery["status"] {
  const normalized = normalizeQueryText(value, 20) ?? "open";

  if (!listStatuses.includes(normalized as ApplicationListQuery["status"])) {
    throw new CandidateApplicationValidationError("status 仅支持 open、closed 或 all。");
  }

  return normalized as ApplicationListQuery["status"];
}

function readPositiveInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new CandidateApplicationValidationError(`分页参数必须是 ${min} 到 ${max} 之间的整数。`);
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
    throw new CandidateApplicationValidationError(`查询参数不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function normalizeBoundedText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new CandidateApplicationValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}
