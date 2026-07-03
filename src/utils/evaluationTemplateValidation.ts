import type {
  EvaluationCriterion,
  EvaluationCriterionImportance,
  EvaluationTemplateAssignmentInput,
  EvaluationTemplateCreateInput,
  EvaluationTemplateListQuery,
  EvaluationTemplateUpdateInput,
  EvaluationTemplateVersionUpdateInput
} from "@/types/evaluationTemplate";

const templateStatuses = ["ACTIVE", "ARCHIVED"] as const;
const criterionImportances = ["REQUIRED", "PREFERRED", "CONTEXTUAL"] as const;
const createFields = ["name", "description"] as const;
const updateFields = ["name", "description"] as const;
const draftVersionFields = ["criteria", "instructions", "changeNote", "createdBy"] as const;
const assignmentFields = ["templateVersionId", "assignedBy"] as const;
const criterionFields = [
  "key",
  "label",
  "description",
  "importance",
  "evidenceGuidance"
] as const;
const forbiddenCriterionFields = [
  "score",
  "weight",
  "threshold",
  "passScore",
  "failScore",
  "ranking",
  "autoReject",
  "autoHire"
] as const;

export class EvaluationTemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationTemplateValidationError";
  }
}

export function parseEvaluationTemplateListQuery(
  searchParams: URLSearchParams
): EvaluationTemplateListQuery {
  assertAllowedQueryFields(searchParams, ["search", "status", "page", "pageSize"]);

  return {
    page: readPositiveInteger(searchParams.get("page"), 1, 1, 100000),
    pageSize: readPositiveInteger(searchParams.get("pageSize"), 20, 1, 100),
    search: normalizeQueryText(searchParams.get("search"), 120),
    status: readOptionalEnum(searchParams.get("status"), templateStatuses, "status")
  };
}

export function parseEvaluationTemplateCreatePayload(
  payload: unknown
): EvaluationTemplateCreateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, createFields);

  return {
    description: readNullableText(body, "description", 1000),
    name: readRequiredText(body, "name", 120)
  };
}

export function parseEvaluationTemplateUpdatePayload(
  payload: unknown
): EvaluationTemplateUpdateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, updateFields);

  if (Object.keys(body).length === 0) {
    throw new EvaluationTemplateValidationError("更新内容不能为空。");
  }

  return {
    description: readNullableText(body, "description", 1000),
    name: readOptionalRequiredText(body, "name", 120)
  };
}

export function parseDraftVersionUpdatePayload(
  payload: unknown
): EvaluationTemplateVersionUpdateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, draftVersionFields);

  if (Object.keys(body).length === 0) {
    throw new EvaluationTemplateValidationError("更新内容不能为空。");
  }

  return {
    changeNote: readNullableText(body, "changeNote", 1000),
    createdBy: readNullableText(body, "createdBy", 120),
    criteria: readOptionalCriteria(body, "criteria"),
    instructions: readNullableText(body, "instructions", 5000)
  };
}

export function parseAssignmentPayload(payload: unknown): EvaluationTemplateAssignmentInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, assignmentFields);

  return {
    assignedBy: readNullableText(body, "assignedBy", 120),
    templateVersionId: readRequiredText(body, "templateVersionId", 120)
  };
}

export function parseEvaluationCriteriaJson(value: unknown): EvaluationCriterion[] {
  if (!Array.isArray(value)) {
    throw new EvaluationTemplateValidationError("criteria 必须是数组。");
  }

  const seenKeys = new Set<string>();

  return value.map((item, index) => {
    const criterion = parseCriterion(item, index);

    if (seenKeys.has(criterion.key)) {
      throw new EvaluationTemplateValidationError(`criteria key 重复：${criterion.key}。`);
    }

    seenKeys.add(criterion.key);
    return criterion;
  });
}

function readOptionalCriteria(
  body: Record<string, unknown>,
  field: string
): EvaluationCriterion[] | undefined {
  if (!(field in body)) {
    return undefined;
  }

  const value = body[field];

  if (!Array.isArray(value)) {
    throw new EvaluationTemplateValidationError("criteria 必须是数组。");
  }

  return parseEvaluationCriteriaJson(value);
}

function parseCriterion(value: unknown, index: number): EvaluationCriterion {
  const body = assertRecord(value, `criteria[${index}] 必须是对象。`);
  assertForbiddenCriterionFields(body);
  assertAllowedFields(body, criterionFields, `criteria[${index}] 包含不支持的字段`);

  const criterion: EvaluationCriterion = {
    description: readRequiredText(body, "description", 1000),
    importance: readCriterionImportance(body, "importance"),
    key: readCriterionKey(body, "key"),
    label: readRequiredText(body, "label", 120)
  };
  const evidenceGuidance = readNullableText(body, "evidenceGuidance", 1000);

  if (evidenceGuidance !== undefined && evidenceGuidance !== null) {
    criterion.evidenceGuidance = evidenceGuidance;
  }

  return criterion;
}

function readCriterionKey(body: Record<string, unknown>, field: string): string {
  const value = readRequiredText(body, field, 80);

  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)) {
    throw new EvaluationTemplateValidationError(
      "criterion key 必须是稳定 slug，例如 backend-api-design。"
    );
  }

  return value;
}

function readCriterionImportance(
  body: Record<string, unknown>,
  field: string
): EvaluationCriterionImportance {
  const value = body[field];

  if (typeof value !== "string") {
    throw new EvaluationTemplateValidationError(`${field} 为必填项。`);
  }

  if (!criterionImportances.includes(value as EvaluationCriterionImportance)) {
    throw new EvaluationTemplateValidationError("importance 仅支持 REQUIRED、PREFERRED、CONTEXTUAL。");
  }

  return value as EvaluationCriterionImportance;
}

function assertForbiddenCriterionFields(body: Record<string, unknown>): void {
  const forbidden = Object.keys(body).filter((field) =>
    forbiddenCriterionFields.includes(field as (typeof forbiddenCriterionFields)[number])
  );

  if (forbidden.length > 0) {
    throw new EvaluationTemplateValidationError(
      `criteria 不允许包含评分、权重、阈值或自动决策字段：${forbidden.join(", ")}。`
    );
  }
}

function assertRecord(
  value: unknown,
  message = "请求体必须是 JSON 对象。"
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new EvaluationTemplateValidationError(message);
  }

  return value as Record<string, unknown>;
}

function assertAllowedFields(
  body: Record<string, unknown>,
  allowedFields: readonly string[],
  prefix = "不支持的字段"
): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Object.keys(body).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new EvaluationTemplateValidationError(`${prefix}：${unknownFields.join(", ")}。`);
  }
}

function assertAllowedQueryFields(
  searchParams: URLSearchParams,
  allowedFields: readonly string[]
): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Array.from(searchParams.keys()).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new EvaluationTemplateValidationError(`不支持的查询参数：${unknownFields.join(", ")}。`);
  }
}

function readRequiredText(body: Record<string, unknown>, field: string, maxLength: number): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new EvaluationTemplateValidationError(`${field} 为必填项。`);
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
    throw new EvaluationTemplateValidationError(`${field} 必须是字符串。`);
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalizeBoundedText(normalized, field, maxLength);
}

function readOptionalEnum<TValue extends string>(
  value: string | null,
  allowedValues: readonly TValue[],
  field: string
): TValue | undefined {
  const normalized = normalizeQueryText(value, 40);

  if (!normalized) {
    return undefined;
  }

  if (!allowedValues.includes(normalized as TValue)) {
    throw new EvaluationTemplateValidationError(`${field} 参数无效。`);
  }

  return normalized as TValue;
}

function readPositiveInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new EvaluationTemplateValidationError(`分页参数必须是 ${min} 到 ${max} 之间的整数。`);
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
    throw new EvaluationTemplateValidationError(`查询参数不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function normalizeBoundedText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new EvaluationTemplateValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}
