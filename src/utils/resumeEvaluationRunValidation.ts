export type ResumeEvaluationRunCreatePayload = {
  runType: "MOCK";
};

export type ResumeEvaluationSelectedRunPayload = {
  selectedRunId: string | null;
};

const createRunFields = ["runType"] as const;
const selectedRunFields = ["selectedRunId"] as const;

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
