export type ResumeEvaluationRunCreatePayload = {
  runType: "MOCK";
};

const createRunFields = ["runType"] as const;

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
