import type {
  CandidateInsightCreateInput,
  CandidateInsightDetails,
  CandidateInsightEvidence,
  CandidateInsightOutput,
  CandidateInsightSummary
} from "@/types/candidateUnderstanding";

const maxOptionalTextLength = 10000;

export class CandidateUnderstandingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CandidateUnderstandingValidationError";
  }
}

export function readCandidateUnderstandingFormData(formData: FormData): {
  jobProfileId: string;
  file: File;
  candidateSource?: string;
  notes?: string;
} {
  return {
    candidateSource: readOptionalFormText(formData, "candidateSource"),
    file: readRequiredFormFile(formData, "file"),
    jobProfileId: readRequiredFormText(formData, "jobProfileId"),
    notes: readOptionalFormText(formData, "notes")
  };
}

export function parseCandidateInsightSavePayload(payload: unknown): CandidateInsightCreateInput {
  const body = assertRecord(payload);

  return {
    aiModel: readRequiredText(body, "aiModel", 200),
    aiProvider: readRequiredText(body, "aiProvider", 100),
    candidateSource: readOptionalText(body, "candidateSource"),
    evidence: readEvidence(body.evidence),
    generationTimeMs: readOptionalNumber(body, "generationTimeMs"),
    insights: readInsights(body.insights),
    jobProfileId: readRequiredText(body, "jobProfileId", 100),
    jobProfileVersion: readRequiredText(body, "jobProfileVersion", 200),
    missingInformation: readStringList(body, "missingInformation"),
    notes: readOptionalText(body, "notes"),
    potentialRisks: readStringList(body, "potentialRisks"),
    promptFile: readRequiredText(body, "promptFile", 200),
    promptVersion: readRequiredText(body, "promptVersion", 50),
    resumeId: readRequiredText(body, "resumeId", 100),
    resumeVersion: readRequiredText(body, "resumeVersion", 100),
    strengths: readStringList(body, "strengths"),
    suggestedInterviewQuestions: readStringList(body, "suggestedInterviewQuestions"),
    suggestedNextActions: readStringList(body, "suggestedNextActions"),
    suggestedPhoneScreenQuestions: readStringList(body, "suggestedPhoneScreenQuestions"),
    summary: readSummary(body.summary),
    workflowId: readRequiredText(body, "workflowId", 100)
  };
}

export function normalizeCandidateInsightOutput(output: CandidateInsightOutput): CandidateInsightOutput {
  return {
    evidence: output.evidence.map((item) => ({
      claim: item.claim.trim(),
      quote: item.quote?.trim(),
      sourceChunkIds: normalizeStringList(item.sourceChunkIds)
    })),
    insights: {
      contextSignals: normalizeStringList(output.insights.contextSignals),
      openQuestions: normalizeStringList(output.insights.openQuestions),
      relevantExperience: normalizeStringList(output.insights.relevantExperience),
      transferableStrengths: normalizeStringList(output.insights.transferableStrengths)
    },
    missingInformation: normalizeStringList(output.missingInformation),
    potentialRisks: normalizeStringList(output.potentialRisks),
    strengths: normalizeStringList(output.strengths),
    suggestedInterviewQuestions: normalizeStringList(output.suggestedInterviewQuestions),
    suggestedNextActions: normalizeStringList(output.suggestedNextActions),
    suggestedPhoneScreenQuestions: normalizeStringList(output.suggestedPhoneScreenQuestions),
    summary: {
      candidateOverview: output.summary.candidateOverview.trim(),
      evidenceCoverage: output.summary.evidenceCoverage.trim(),
      roleContextUnderstanding: output.summary.roleContextUnderstanding.trim()
    }
  };
}

function readRequiredFormText(formData: FormData, field: string): string {
  const value = formData.get(field);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CandidateUnderstandingValidationError(`${field} 为必填项。`);
  }

  return value.trim();
}

function readOptionalFormText(formData: FormData, field: string): string | undefined {
  const value = formData.get(field);

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new CandidateUnderstandingValidationError(`${field} 必须是字符串。`);
  }

  return normalizeOptionalText(value, field);
}

function readRequiredFormFile(formData: FormData, field: string): File {
  const value = formData.get(field);

  if (!(value instanceof File)) {
    throw new CandidateUnderstandingValidationError(`${field} 为必填文件。`);
  }

  return value;
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CandidateUnderstandingValidationError("请求体必须是 JSON 对象。");
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
    throw new CandidateUnderstandingValidationError(`${field} 为必填项。`);
  }

  if (value.trim().length > maxLength) {
    throw new CandidateUnderstandingValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return value.trim();
}

function readOptionalText(source: Record<string, unknown>, field: string): string | undefined {
  const value = source[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new CandidateUnderstandingValidationError(`${field} 必须是字符串。`);
  }

  return normalizeOptionalText(value, field);
}

function normalizeOptionalText(value: string, field: string): string | undefined {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (normalizedValue.length > maxOptionalTextLength) {
    throw new CandidateUnderstandingValidationError(
      `${field} 不能超过 ${maxOptionalTextLength} 个字符。`
    );
  }

  return normalizedValue;
}

function readSummary(value: unknown): CandidateInsightSummary {
  const summary = assertRecord(value);

  return {
    candidateOverview: readRequiredText(summary, "candidateOverview", maxOptionalTextLength),
    evidenceCoverage: readRequiredText(summary, "evidenceCoverage", maxOptionalTextLength),
    roleContextUnderstanding: readRequiredText(
      summary,
      "roleContextUnderstanding",
      maxOptionalTextLength
    )
  };
}

function readInsights(value: unknown): CandidateInsightDetails {
  const insights = assertRecord(value);

  return {
    contextSignals: readStringList(insights, "contextSignals"),
    openQuestions: readStringList(insights, "openQuestions"),
    relevantExperience: readStringList(insights, "relevantExperience"),
    transferableStrengths: readStringList(insights, "transferableStrengths")
  };
}

function readEvidence(value: unknown): CandidateInsightEvidence[] {
  if (!Array.isArray(value)) {
    throw new CandidateUnderstandingValidationError("evidence 必须是数组。");
  }

  return value.map((item) => {
    const evidence = assertRecord(item);

    return {
      claim: readRequiredText(evidence, "claim", maxOptionalTextLength),
      quote: readOptionalText(evidence, "quote"),
      sourceChunkIds: readStringList(evidence, "sourceChunkIds")
    };
  });
}

function readStringList(source: Record<string, unknown>, field: string): string[] {
  const value = source[field];

  if (!Array.isArray(value)) {
    throw new CandidateUnderstandingValidationError(`${field} 必须是字符串数组。`);
  }

  return normalizeStringList(value);
}

function normalizeStringList(value: unknown[]): string[] {
  return value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new CandidateUnderstandingValidationError("列表字段必须只包含非空字符串。");
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
    throw new CandidateUnderstandingValidationError(`${field} 必须是非负数字。`);
  }

  return Math.round(value);
}
