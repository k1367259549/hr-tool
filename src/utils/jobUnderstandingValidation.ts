import type {
  JobProfileCreateInput,
  JobUnderstandingInput,
  JobUnderstandingOutput
} from "@/types/jobProfile";

const maxTextLength = 30000;
const maxOptionalTextLength = 10000;

export class JobUnderstandingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobUnderstandingValidationError";
  }
}

export function parseJobUnderstandingGeneratePayload(payload: unknown): JobUnderstandingInput {
  const body = assertRecord(payload);

  return {
    hiringGoal: readOptionalText(body, "hiringGoal"),
    jd: readRequiredText(body, "jd", maxTextLength),
    jobTitle: readRequiredText(body, "jobTitle", 200),
    leaderRequirements: readOptionalText(body, "leaderRequirements"),
    notes: readOptionalText(body, "notes"),
    teamBackground: readOptionalText(body, "teamBackground")
  };
}

export function parseJobProfileSavePayload(payload: unknown): JobProfileCreateInput {
  const body = assertRecord(payload);
  const input = parseJobUnderstandingGeneratePayload(payload);

  return {
    ...input,
    aiModel: readRequiredText(body, "aiModel", 200),
    aiProvider: readRequiredText(body, "aiProvider", 100),
    coreResponsibilities: readStringList(body, "coreResponsibilities"),
    generationTimeMs: readOptionalNumber(body, "generationTimeMs"),
    hiringFocus: readStringList(body, "hiringFocus"),
    interviewFocus: readStringList(body, "interviewFocus"),
    jobSummary: readRequiredText(body, "jobSummary", maxTextLength),
    missingInformation: readStringList(body, "missingInformation"),
    potentialRisks: readStringList(body, "potentialRisks"),
    preferredCompetencies: readStringList(body, "preferredCompetencies"),
    promptFile: readRequiredText(body, "promptFile", 200),
    promptVersion: readRequiredText(body, "promptVersion", 50),
    requiredCompetencies: readStringList(body, "requiredCompetencies"),
    suggestedFollowUpQuestions: readStringList(body, "suggestedFollowUpQuestions"),
    workflowId: readRequiredText(body, "workflowId", 100)
  };
}

export function normalizeJobUnderstandingOutput(output: JobUnderstandingOutput): JobUnderstandingOutput {
  return {
    coreResponsibilities: normalizeStringList(output.coreResponsibilities),
    hiringFocus: normalizeStringList(output.hiringFocus),
    interviewFocus: normalizeStringList(output.interviewFocus),
    jobSummary: output.jobSummary.trim(),
    missingInformation: normalizeStringList(output.missingInformation),
    potentialRisks: normalizeStringList(output.potentialRisks),
    preferredCompetencies: normalizeStringList(output.preferredCompetencies),
    requiredCompetencies: normalizeStringList(output.requiredCompetencies),
    suggestedFollowUpQuestions: normalizeStringList(output.suggestedFollowUpQuestions)
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new JobUnderstandingValidationError("请求体必须是 JSON 对象。");
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
    throw new JobUnderstandingValidationError(`${field} 为必填项。`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length > maxLength) {
    throw new JobUnderstandingValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return normalizedValue;
}

function readOptionalText(source: Record<string, unknown>, field: string): string | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new JobUnderstandingValidationError(`${field} 必须是字符串。`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (normalizedValue.length > maxOptionalTextLength) {
    throw new JobUnderstandingValidationError(
      `${field} 不能超过 ${maxOptionalTextLength} 个字符。`
    );
  }

  return normalizedValue;
}

function readStringList(source: Record<string, unknown>, field: keyof JobUnderstandingOutput): string[] {
  const value = source[field];

  if (!Array.isArray(value)) {
    throw new JobUnderstandingValidationError(`${field} 必须是字符串数组。`);
  }

  return normalizeStringList(value);
}

function normalizeStringList(value: unknown[]): string[] {
  return value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new JobUnderstandingValidationError("列表字段必须只包含非空字符串。");
    }

    return item.trim();
  });
}

function readOptionalNumber(source: Record<string, unknown>, field: string): number | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new JobUnderstandingValidationError(`${field} 必须是非负数字。`);
  }

  return Math.round(value);
}
