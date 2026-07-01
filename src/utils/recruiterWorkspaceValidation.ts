import type {
  RecruiterWorkspaceNoteInput,
  RecruiterWorkspaceScheduleItemInput
} from "@/types/recruiterWorkspace";

const allowedScheduleTypes = ["PHONE_SCREEN", "INTERVIEW", "LEADER_MEETING", "RECRUITING_TASK"] as const;

export class RecruiterWorkspaceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecruiterWorkspaceValidationError";
  }
}

export function parseRecruiterWorkspaceNotePayload(payload: unknown): RecruiterWorkspaceNoteInput & {
  date?: string;
} {
  const body = assertRecord(payload);

  return {
    category: readOptionalText(body, "category", 100),
    content: readRequiredText(body, "content", 5000),
    date: readOptionalDate(body, "date")
  };
}

export function parseRecruiterWorkspaceSchedulePayload(payload: unknown): {
  date?: string;
  items: RecruiterWorkspaceScheduleItemInput[];
} {
  const body = assertRecord(payload);
  const itemsValue = body.items;

  if (!Array.isArray(itemsValue)) {
    throw new RecruiterWorkspaceValidationError("items 必须是数组。");
  }

  if (itemsValue.length > 50) {
    throw new RecruiterWorkspaceValidationError("单日程项不能超过 50 条。");
  }

  return {
    date: readOptionalDate(body, "date"),
    items: itemsValue.map(readScheduleItem)
  };
}

function readScheduleItem(value: unknown, index: number): RecruiterWorkspaceScheduleItemInput {
  const body = assertRecord(value);
  const itemType = readRequiredText(body, "itemType", 50);

  if (!isAllowedScheduleType(itemType)) {
    throw new RecruiterWorkspaceValidationError(`items[${index}].itemType 无效。`);
  }

  return {
    completed: readOptionalBoolean(body, "completed"),
    itemType,
    notes: readOptionalText(body, "notes", 5000),
    order: readOptionalNumber(body, "order"),
    relatedName: readOptionalText(body, "relatedName", 200),
    startTime: readOptionalText(body, "startTime", 20),
    title: readRequiredText(body, "title", 200)
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RecruiterWorkspaceValidationError("请求体必须是 JSON 对象。");
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
    throw new RecruiterWorkspaceValidationError(`${field} 为必填项。`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length > maxLength) {
    throw new RecruiterWorkspaceValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
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
    throw new RecruiterWorkspaceValidationError(`${field} 必须是字符串。`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (normalizedValue.length > maxLength) {
    throw new RecruiterWorkspaceValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalizedValue;
}

function readOptionalDate(source: Record<string, unknown>, field: string): string | undefined {
  const value = readOptionalText(source, field, 20);

  if (value === undefined) {
    return undefined;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RecruiterWorkspaceValidationError(`${field} 必须是 YYYY-MM-DD 格式。`);
  }

  return value;
}

function readOptionalBoolean(source: Record<string, unknown>, field: string): boolean | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new RecruiterWorkspaceValidationError(`${field} 必须是布尔值。`);
  }

  return value;
}

function readOptionalNumber(source: Record<string, unknown>, field: string): number | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RecruiterWorkspaceValidationError(`${field} 必须是非负数字。`);
  }

  return Math.round(value);
}

function isAllowedScheduleType(
  value: string
): value is RecruiterWorkspaceScheduleItemInput["itemType"] {
  return allowedScheduleTypes.some((itemType) => itemType === value);
}
