import type {
  RecruitmentTaskActionInput,
  RecruitmentTaskCategory,
  RecruitmentTaskConfidence,
  RecruitmentTaskPriority,
  RecruitmentTaskStatus,
  RecruitmentTaskUpdateInput
} from "@/types/recruitmentTask";

const taskActions = ["ACCEPT", "MODIFY", "DISMISS", "RESCHEDULE", "COMPLETE", "START", "DEFER"] as const;
const priorities = ["HIGH", "MEDIUM", "LOW"] as const;
const confidences = ["HIGH", "MEDIUM", "LOW"] as const;
const statuses = ["TODO", "IN_PROGRESS", "COMPLETED", "DEFERRED", "CANCELLED"] as const;
const categories = [
  "PHONE_SCREEN",
  "INTERVIEW_PREPARATION",
  "LEADER_CONFIRMATION",
  "FOLLOW_UP",
  "MISSING_INFORMATION",
  "CANDIDATE_REVIEW",
  "JOB_CLARIFICATION",
  "RECRUITER_REMINDER"
] as const;

export class RecruitmentTaskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecruitmentTaskValidationError";
  }
}

export function parseRecruitmentTaskActionPayload(payload: unknown): RecruitmentTaskActionInput {
  const body = assertRecord(payload);
  const action = readRequiredText(body, "action", 40);

  if (!isAllowedAction(action)) {
    throw new RecruitmentTaskValidationError("action 无效。");
  }

  return {
    action,
    note: readOptionalText(body, "note", 1000),
    patch: readPatch(body.patch),
    taskId: readRequiredText(body, "taskId", 100)
  };
}

function readPatch(value: unknown): RecruitmentTaskUpdateInput | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const body = assertRecord(value);
  const priority = readOptionalText(body, "priority", 20);
  const confidence = readOptionalText(body, "confidence", 20);
  const status = readOptionalText(body, "status", 30);
  const category = readOptionalText(body, "category", 50);

  if (priority && !isAllowedPriority(priority)) {
    throw new RecruitmentTaskValidationError("priority 无效。");
  }

  if (confidence && !isAllowedConfidence(confidence)) {
    throw new RecruitmentTaskValidationError("confidence 无效。");
  }

  if (status && !isAllowedStatus(status)) {
    throw new RecruitmentTaskValidationError("status 无效。");
  }

  if (category && !isAllowedCategory(category)) {
    throw new RecruitmentTaskValidationError("category 无效。");
  }

  const normalizedPriority: RecruitmentTaskPriority | undefined = priority
    ? (priority as RecruitmentTaskPriority)
    : undefined;
  const normalizedConfidence: RecruitmentTaskConfidence | undefined = confidence
    ? (confidence as RecruitmentTaskConfidence)
    : undefined;
  const normalizedStatus: RecruitmentTaskStatus | undefined = status
    ? (status as RecruitmentTaskStatus)
    : undefined;

  return {
    dueTime: readOptionalDateTime(body, "dueTime"),
    confidence: normalizedConfidence,
    evidence: readOptionalStringList(body, "evidence"),
    priority: normalizedPriority,
    priorityReason: readOptionalText(body, "priorityReason", 1000),
    quickStartHref: readOptionalText(body, "quickStartHref", 300),
    reason: readOptionalText(body, "reason", 2000),
    recommendedNextAction: readOptionalText(body, "recommendedNextAction", 2000),
    relatedCandidate: readOptionalText(body, "relatedCandidate", 300),
    relatedJob: readOptionalText(body, "relatedJob", 300),
    status: normalizedStatus,
    title: readOptionalText(body, "title", 300)
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RecruitmentTaskValidationError("请求体必须是 JSON 对象。");
  }

  return value as Record<string, unknown>;
}

function readRequiredText(
  source: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = source[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RecruitmentTaskValidationError(`${field} 为必填项。`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length > maxLength) {
    throw new RecruitmentTaskValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalizedValue;
}

function readOptionalText(
  source: Record<string, unknown>,
  field: string,
  maxLength: number
): string | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new RecruitmentTaskValidationError(`${field} 必须是字符串。`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (normalizedValue.length > maxLength) {
    throw new RecruitmentTaskValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalizedValue;
}

function readOptionalDateTime(source: Record<string, unknown>, field: string): Date | undefined {
  const value = readOptionalText(source, field, 100);

  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RecruitmentTaskValidationError(`${field} 必须是有效时间。`);
  }

  return date;
}

function readOptionalStringList(source: Record<string, unknown>, field: string): string[] | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new RecruitmentTaskValidationError(`${field} 必须是字符串数组。`);
  }

  return value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new RecruitmentTaskValidationError(`${field} 必须只包含非空字符串。`);
    }

    return item.trim();
  });
}

function isAllowedAction(value: string): value is RecruitmentTaskActionInput["action"] {
  return taskActions.some((action) => action === value);
}

function isAllowedPriority(value: string): value is RecruitmentTaskPriority {
  return priorities.some((priority) => priority === value);
}

function isAllowedConfidence(value: string): value is RecruitmentTaskConfidence {
  return confidences.some((confidence) => confidence === value);
}

function isAllowedStatus(value: string): value is RecruitmentTaskStatus {
  return statuses.some((status) => status === value);
}

function isAllowedCategory(value: string): value is RecruitmentTaskCategory {
  return categories.some((category) => category === value);
}
