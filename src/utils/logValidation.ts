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
