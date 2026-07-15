export type ResumeEvaluationRunCreatePayload = {
  runType: "MOCK";
};

export type ResumeEvaluationSelectedRunPayload = {
  selectedRunId: string | null;
};

export type ResumeEvaluationDetailedReviewPayload = {
  decision: "ACCEPTED_AS_REFERENCE" | "NEEDS_REVISION" | "REJECTED";
  expectedRevision: number;
  note?: string | null;
  reviewer: string;
};

const createRunFields = ["runType"] as const;
const selectedRunFields = ["selectedRunId"] as const;
const detailedReviewFields = ["decision", "expectedRevision", "note", "reviewer"] as const;
const detailedReviewDecisions = [
  "ACCEPTED_AS_REFERENCE",
  "NEEDS_REVISION",
  "REJECTED"
] as const;

export class ResumeEvaluationRunValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeEvaluationRunValidationError";
  }
}

export function parseResumeEvaluationRunCreatePayload(
  payload: unknown
): ResumeEvaluationRunCreatePayload {
  if (payload === undefined) {
    return { runType: "MOCK" };
  }

  const body = assertRecord(payload);
  assertAllowedFields(body, createRunFields);

  if (!("runType" in body)) {
    return { runType: "MOCK" };
  }

  if (body.runType !== "MOCK") {
    throw new ResumeEvaluationRunValidationError("当前仅支持创建 MOCK run。");
  }

  return { runType: "MOCK" };
}

export function parseResumeEvaluationSelectedRunPayload(
  payload: unknown
): ResumeEvaluationSelectedRunPayload {
  const body = assertRecord(payload);
  assertAllowedFields(body, selectedRunFields);

  if (!("selectedRunId" in body)) {
    throw new ResumeEvaluationRunValidationError("selectedRunId 为必填项。");
  }

  const selectedRunId = body.selectedRunId;

  if (selectedRunId === null) {
    return { selectedRunId: null };
  }

  if (typeof selectedRunId !== "string") {
    throw new ResumeEvaluationRunValidationError("selectedRunId 必须是字符串或 null。");
  }

  const normalized = selectedRunId.trim();

  if (!normalized) {
    throw new ResumeEvaluationRunValidationError("selectedRunId 不能为空字符串。");
  }

  if (normalized.length > 120) {
    throw new ResumeEvaluationRunValidationError("selectedRunId 不能超过 120 个字符。");
  }

  return { selectedRunId: normalized };
}

export function parseResumeEvaluationDetailedReviewPayload(
  payload: unknown
): ResumeEvaluationDetailedReviewPayload {
  const body = assertRecord(payload);
  assertAllowedFields(body, detailedReviewFields);

  if (!detailedReviewDecisions.includes(body.decision as never)) {
    throw new ResumeEvaluationRunValidationError("decision 参数无效。");
  }

  if (!Number.isInteger(body.expectedRevision) || (body.expectedRevision as number) < 0) {
    throw new ResumeEvaluationRunValidationError("expectedRevision 必须是非负整数。");
  }

  const reviewer = parseRequiredText(body.reviewer, "reviewer", 160);
  const note = parseOptionalText(body.note, "note", 2000);

  if (
    (body.decision === "NEEDS_REVISION" || body.decision === "REJECTED") &&
    !note
  ) {
    throw new ResumeEvaluationRunValidationError(
      "NEEDS_REVISION 和 REJECTED 必须填写审核说明。"
    );
  }

  return {
    decision: body.decision as ResumeEvaluationDetailedReviewPayload["decision"],
    expectedRevision: body.expectedRevision as number,
    note,
    reviewer
  };
}

function parseRequiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new ResumeEvaluationRunValidationError(`${field} 必须是字符串。`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new ResumeEvaluationRunValidationError(`${field} 不能为空。`);
  }

  if (normalized.length > maxLength) {
    throw new ResumeEvaluationRunValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalized;
}

function parseOptionalText(
  value: unknown,
  field: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return parseRequiredText(value, field, maxLength);
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ResumeEvaluationRunValidationError("请求体必须是 JSON 对象。");
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
    throw new ResumeEvaluationRunValidationError(
      `不支持的字段：${unknownFields.join(", ")}。`
    );
  }
}
