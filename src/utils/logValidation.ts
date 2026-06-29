import type {
  RecruitLogCountField,
  RecruitLogCreateInput,
  RecruitLogDateInput,
  RecruitLogQueryOptions,
  RecruitLogRepositoryCreateInput,
  RecruitLogRepositoryQueryOptions,
  RecruitLogRepositoryUpdateInput,
  RecruitLogUpdateInput
} from "@/types/log";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const recruitLogCountFields: RecruitLogCountField[] = [
  "resumeCount",
  "screenCount",
  "phoneCount",
  "interviewCount",
  "offerCount",
  "entryCount"
];

export class LogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogValidationError";
  }
}

export function parseLogDate(value: RecruitLogDateInput | undefined): Date {
  if (value === undefined) {
    throw new LogValidationError("Date is required.");
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new LogValidationError("Date must be a valid date.");
  }

  return date;
}

export function validateRecruitLogCounts(
  input: Partial<Record<RecruitLogCountField, number | undefined>>
): void {
  for (const field of recruitLogCountFields) {
    const value = input[field];

    if (value === undefined) {
      continue;
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new LogValidationError(`${field} must be a non-negative integer.`);
    }
  }
}

export function validateLogLimit(limit: number | undefined): void {
  if (limit === undefined) {
    return;
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new LogValidationError("Limit must be a positive integer.");
  }
}

export function validateLogId(id: string): void {
  if (!uuidPattern.test(id)) {
    throw new LogValidationError("ID must be a valid UUID.");
  }
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new LogValidationError("Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function readOptionalString(
  source: Record<string, unknown>,
  field: "position" | "summary" | "problems" | "reflection"
): string | null | undefined {
  const value = source[field];

  if (value === undefined || value === null || typeof value === "string") {
    return value;
  }

  throw new LogValidationError(`${field} must be a string or null.`);
}

function readOptionalNumber(
  source: Record<string, unknown>,
  field: RecruitLogCountField
): number | undefined {
  const value = source[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number") {
    throw new LogValidationError(`${field} must be a number.`);
  }

  return value;
}

export function parseRecruitLogCreatePayload(payload: unknown): RecruitLogCreateInput {
  const body = assertRecord(payload);
  const date = body.date;

  if (typeof date !== "string") {
    throw new LogValidationError("Date is required.");
  }

  return {
    date,
    position: readOptionalString(body, "position"),
    resumeCount: readOptionalNumber(body, "resumeCount"),
    screenCount: readOptionalNumber(body, "screenCount"),
    phoneCount: readOptionalNumber(body, "phoneCount"),
    interviewCount: readOptionalNumber(body, "interviewCount"),
    offerCount: readOptionalNumber(body, "offerCount"),
    entryCount: readOptionalNumber(body, "entryCount"),
    summary: readOptionalString(body, "summary"),
    problems: readOptionalString(body, "problems"),
    reflection: readOptionalString(body, "reflection")
  };
}

export function parseRecruitLogUpdatePayload(payload: unknown): RecruitLogUpdateInput {
  const body = assertRecord(payload);
  const date = body.date;

  if (date !== undefined && typeof date !== "string") {
    throw new LogValidationError("Date must be a string.");
  }

  return {
    date,
    position: readOptionalString(body, "position"),
    resumeCount: readOptionalNumber(body, "resumeCount"),
    screenCount: readOptionalNumber(body, "screenCount"),
    phoneCount: readOptionalNumber(body, "phoneCount"),
    interviewCount: readOptionalNumber(body, "interviewCount"),
    offerCount: readOptionalNumber(body, "offerCount"),
    entryCount: readOptionalNumber(body, "entryCount"),
    summary: readOptionalString(body, "summary"),
    problems: readOptionalString(body, "problems"),
    reflection: readOptionalString(body, "reflection")
  };
}

export function normalizeRecruitLogCreateInput(
  input: RecruitLogCreateInput
): RecruitLogRepositoryCreateInput {
  const date = parseLogDate(input.date);
  validateRecruitLogCounts(input);

  return {
    date,
    position: input.position,
    resumeCount: input.resumeCount,
    screenCount: input.screenCount,
    phoneCount: input.phoneCount,
    interviewCount: input.interviewCount,
    offerCount: input.offerCount,
    entryCount: input.entryCount,
    summary: input.summary,
    problems: input.problems,
    reflection: input.reflection
  };
}

export function normalizeRecruitLogUpdateInput(
  input: RecruitLogUpdateInput
): RecruitLogRepositoryUpdateInput {
  validateRecruitLogCounts(input);

  return {
    date: input.date === undefined ? undefined : parseLogDate(input.date),
    position: input.position,
    resumeCount: input.resumeCount,
    screenCount: input.screenCount,
    phoneCount: input.phoneCount,
    interviewCount: input.interviewCount,
    offerCount: input.offerCount,
    entryCount: input.entryCount,
    summary: input.summary,
    problems: input.problems,
    reflection: input.reflection
  };
}

export function normalizeRecruitLogQueryOptions(
  options: RecruitLogQueryOptions = {}
): RecruitLogRepositoryQueryOptions {
  validateLogLimit(options.limit);

  return {
    date: options.date === undefined ? undefined : parseLogDate(options.date),
    limit: options.limit
  };
}
