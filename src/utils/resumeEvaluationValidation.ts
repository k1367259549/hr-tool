import type {
  CriterionEvidenceAssessment,
  ResumeCriterionResult,
  ResumeEvaluationCreateInput,
  ResumeEvaluationListQuery,
  ResumeEvaluationReopenInput,
  ResumeEvaluationReviewInput,
  ResumeEvaluationUpdateInput
} from "@/types/resumeEvaluationResult";

const evaluationStatuses = ["DRAFT", "REVIEWED"] as const;
const criterionAssessments = [
  "NOT_ASSESSED",
  "SUPPORTED",
  "PARTIALLY_SUPPORTED",
  "NOT_SUPPORTED",
  "NOT_APPLICABLE"
] as const;
const createFields = [
  "resumeId",
  "resumeRevisionId",
  "parsedSnapshotId",
  "jobProfileId",
  "templateVersionId",
  "evaluatedBy"
] as const;
const updateFields = ["criterionResults", "overallNote", "evaluatedBy", "expectedRevision"] as const;
const reviewFields = ["expectedRevision", "actor"] as const;
const reopenFields = ["expectedRevision", "actor", "note"] as const;
const criterionResultFields = [
  "criterionKey",
  "assessment",
  "evidenceNotes",
  "recruiterNote"
] as const;

export class ResumeEvaluationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeEvaluationValidationError";
  }
}

export function parseResumeEvaluationListQuery(
  searchParams: URLSearchParams
): ResumeEvaluationListQuery {
  assertAllowedQueryFields(searchParams, [
    "resumeId",
    "jobProfileId",
    "templateVersionId",
    "status",
    "page",
    "pageSize"
  ]);

  return {
    jobProfileId: readOptionalQueryId(searchParams.get("jobProfileId")),
    page: readPositiveInteger(searchParams.get("page"), 1, 1, 100000),
    pageSize: readPositiveInteger(searchParams.get("pageSize"), 20, 1, 100),
    resumeId: readOptionalQueryId(searchParams.get("resumeId")),
    status: readOptionalEnum(searchParams.get("status"), evaluationStatuses, "status"),
    templateVersionId: readOptionalQueryId(searchParams.get("templateVersionId"))
  };
}

export function parseResumeEvaluationCreatePayload(
  payload: unknown
): ResumeEvaluationCreateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, createFields);

  return {
    evaluatedBy: readNullableText(body, "evaluatedBy", 120),
    jobProfileId: readRequiredText(body, "jobProfileId", 120),
    parsedSnapshotId: readNullableText(body, "parsedSnapshotId", 120),
    resumeId: readRequiredText(body, "resumeId", 120),
    resumeRevisionId: readNullableText(body, "resumeRevisionId", 120),
    templateVersionId: readRequiredText(body, "templateVersionId", 120)
  };
}

export function parseResumeEvaluationUpdatePayload(
  payload: unknown
): ResumeEvaluationUpdateInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, updateFields);

  const expectedRevision = readRequiredInteger(body, "expectedRevision");

  if (Object.keys(body).length <= 1) {
    throw new ResumeEvaluationValidationError("更新内容不能为空。");
  }

  return {
    criterionResults: readOptionalCriterionResults(body, "criterionResults"),
    evaluatedBy: readNullableText(body, "evaluatedBy", 120),
    expectedRevision,
    overallNote: readNullableText(body, "overallNote", 2000)
  };
}

export function parseResumeEvaluationReviewPayload(
  payload: unknown
): ResumeEvaluationReviewInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, reviewFields);

  return {
    actor: readNullableText(body, "actor", 120),
    expectedRevision: readRequiredInteger(body, "expectedRevision")
  };
}

export function parseResumeEvaluationReopenPayload(
  payload: unknown
): ResumeEvaluationReopenInput {
  const body = assertRecord(payload);
  assertAllowedFields(body, reopenFields);

  return {
    actor: readNullableText(body, "actor", 120),
    expectedRevision: readRequiredInteger(body, "expectedRevision"),
    note: readRequiredText(body, "note", 1000)
  };
}

function readOptionalCriterionResults(
  body: Record<string, unknown>,
  field: string
): ResumeCriterionResult[] | undefined {
  if (!(field in body)) {
    return undefined;
  }

  const value = body[field];

  if (!Array.isArray(value)) {
    throw new ResumeEvaluationValidationError("criterionResults 必须是数组。");
  }

  const seenKeys = new Set<string>();

  return value.map((item, index) => {
    const result = parseCriterionResult(item, index);

    if (seenKeys.has(result.criterionKey)) {
      throw new ResumeEvaluationValidationError(
        `criterionResults criterionKey 重复：${result.criterionKey}。`
      );
    }

    seenKeys.add(result.criterionKey);
    return result;
  });
}

function parseCriterionResult(value: unknown, index: number): ResumeCriterionResult {
  const body = assertRecord(value, `criterionResults[${index}] 必须是对象。`);
  assertAllowedFields(body, criterionResultFields, `criterionResults[${index}] 包含不支持的字段`);

  const result: ResumeCriterionResult = {
    assessment: readCriterionAssessment(body, "assessment"),
    criterionKey: readCriterionKey(body, "criterionKey"),
    evidenceNotes: readStringArray(body, "evidenceNotes", 20, 500)
  };

  const recruiterNote = readNullableText(body, "recruiterNote", 1000);

  if (recruiterNote !== undefined && recruiterNote !== null) {
    result.recruiterNote = recruiterNote;
  }

  return result;
}

function readCriterionKey(body: Record<string, unknown>, field: string): string {
  const value = readRequiredText(body, field, 80);

  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)) {
    throw new ResumeEvaluationValidationError(
      "criterionKey 必须是稳定 slug，例如 backend-api-design。"
    );
  }

  return value;
}

function readCriterionAssessment(
  body: Record<string, unknown>,
  field: string
): CriterionEvidenceAssessment {
  const value = body[field];

  if (typeof value !== "string") {
    throw new ResumeEvaluationValidationError(`${field} 为必填项。`);
  }

  if (!criterionAssessments.includes(value as CriterionEvidenceAssessment)) {
    throw new ResumeEvaluationValidationError(
      "assessment 仅支持 NOT_ASSESSED、SUPPORTED、PARTIALLY_SUPPORTED、NOT_SUPPORTED、NOT_APPLICABLE。"
    );
  }

  return value as CriterionEvidenceAssessment;
}

function readStringArray(
  body: Record<string, unknown>,
  field: string,
  maxItems: number,
  maxItemLength: number
): string[] {
  if (!(field in body)) {
    return [];
  }

  const value = body[field];

  if (!Array.isArray(value)) {
    throw new ResumeEvaluationValidationError(`${field} 必须是数组。`);
  }

  if (value.length > maxItems) {
    throw new ResumeEvaluationValidationError(`${field} 不能超过 ${maxItems} 条。`);
  }

  return value.map((item, index) => {
    if (typeof item !== "string") {
      throw new ResumeEvaluationValidationError(`${field}[${index}] 必须是字符串。`);
    }

    const normalized = item.trim();

    if (normalized.length > maxItemLength) {
      throw new ResumeEvaluationValidationError(
        `${field}[${index}] 不能超过 ${maxItemLength} 个字符。`
      );
    }

    return normalized;
  });
}

function assertRecord(
  value: unknown,
  message = "请求体必须是 JSON 对象。"
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ResumeEvaluationValidationError(message);
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
    throw new ResumeEvaluationValidationError(`${prefix}：${unknownFields.join(", ")}。`);
  }
}

function assertAllowedQueryFields(
  searchParams: URLSearchParams,
  allowedFields: readonly string[]
): void {
  const allowedSet = new Set<string>(allowedFields);
  const unknownFields = Array.from(searchParams.keys()).filter((field) => !allowedSet.has(field));

  if (unknownFields.length > 0) {
    throw new ResumeEvaluationValidationError(`不支持的查询参数：${unknownFields.join(", ")}。`);
  }
}

function readRequiredText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ResumeEvaluationValidationError(`${field} 为必填项。`);
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
    throw new ResumeEvaluationValidationError(`${field} 必须是字符串。`);
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalizeBoundedText(normalized, field, maxLength);
}

function readRequiredInteger(body: Record<string, unknown>, field: string): number {
  const value = body[field];

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ResumeEvaluationValidationError(`${field} 必须是非负整数。`);
  }

  return value;
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
    throw new ResumeEvaluationValidationError(
      `分页参数必须是 ${min} 到 ${max} 之间的整数。`
    );
  }

  return parsed;
}

function readOptionalQueryId(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > 120) {
    throw new ResumeEvaluationValidationError("查询参数 ID 不能超过 120 个字符。");
  }

  return normalized;
}

function readOptionalEnum<TValue extends string>(
  value: string | null,
  allowedValues: readonly TValue[],
  field: string
): TValue | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (!allowedValues.includes(normalized as TValue)) {
    throw new ResumeEvaluationValidationError(`${field} 参数无效。`);
  }

  return normalized as TValue;
}

function normalizeBoundedText(value: string, field: string, maxLength: number): string {
  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new ResumeEvaluationValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}
