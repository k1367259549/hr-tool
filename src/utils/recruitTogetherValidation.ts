import type {
  InterviewNotes,
  InterviewPreparationInput,
  InterviewPreparationOutput,
  PhoneNotes,
  PhoneScreenPreparationOutput,
  RecruiterSummaryInput,
  RecruiterSummaryOutput,
  RecruitTogetherContextInput,
  RecruitTogetherCreateInput
} from "@/types/recruitTogether";

const maxTextLength = 20000;

export class RecruitTogetherValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecruitTogetherValidationError";
  }
}

export function parseRecruitTogetherContextPayload(payload: unknown): RecruitTogetherContextInput {
  const body = assertRecord(payload);

  return {
    candidateInsightId: readRequiredText(body, "candidateInsightId", 100),
    jobProfileId: readRequiredText(body, "jobProfileId", 100),
    workflowId: readOptionalText(body, "workflowId", 100)
  };
}

export function parseInterviewPreparationPayload(payload: unknown): InterviewPreparationInput {
  const body = assertRecord(payload);

  return {
    ...parseRecruitTogetherContextPayload(payload),
    phoneNotes: readPhoneNotes(body.phoneNotes),
    phonePreparation: readPhonePreparation(body.phonePreparation)
  };
}

export function parseRecruiterSummaryPayload(payload: unknown): RecruiterSummaryInput {
  const body = assertRecord(payload);

  return {
    ...parseRecruitTogetherContextPayload(payload),
    interviewNotes: readInterviewNotes(body.interviewNotes),
    interviewPreparation: readInterviewPreparation(body.interviewPreparation),
    phoneNotes: readPhoneNotes(body.phoneNotes),
    phonePreparation: readPhonePreparation(body.phonePreparation)
  };
}

export function parseRecruitTogetherSavePayload(payload: unknown): RecruitTogetherCreateInput {
  const body = assertRecord(payload);

  return {
    ...parseRecruiterSummaryPayload(payload),
    aiModel: readRequiredText(body, "aiModel", 200),
    aiProvider: readRequiredText(body, "aiProvider", 100),
    generationTimes: readGenerationTimes(body.generationTimes),
    promptVersions: readPromptVersions(body.promptVersions),
    recruiterSummary: readRecruiterSummary(body.recruiterSummary)
  };
}

export function normalizePhonePreparation(
  output: PhoneScreenPreparationOutput
): PhoneScreenPreparationOutput {
  return {
    conversationChecklist: normalizeStringList(output.conversationChecklist),
    conversationGoals: normalizeStringList(output.conversationGoals),
    informationToConfirm: normalizeStringList(output.informationToConfirm),
    keyVerificationQuestions: normalizeStringList(output.keyVerificationQuestions),
    riskVerificationQuestions: normalizeStringList(output.riskVerificationQuestions),
    suggestedOpening: output.suggestedOpening.trim(),
    thingsToAvoid: normalizeStringList(output.thingsToAvoid)
  };
}

export function normalizeInterviewPreparation(
  output: InterviewPreparationOutput
): InterviewPreparationOutput {
  return {
    evidenceToVerify: normalizeStringList(output.evidenceToVerify),
    highPriorityTopics: normalizeStringList(output.highPriorityTopics),
    interviewFocus: normalizeStringList(output.interviewFocus),
    missingInformation: normalizeStringList(output.missingInformation),
    possibleFollowUpQuestions: normalizeStringList(output.possibleFollowUpQuestions),
    suggestedQuestions: normalizeStringList(output.suggestedQuestions)
  };
}

export function normalizeRecruiterSummary(output: RecruiterSummaryOutput): RecruiterSummaryOutput {
  return {
    candidateTimeline: normalizeStringList(output.candidateTimeline),
    confirmedFacts: normalizeStringList(output.confirmedFacts),
    openQuestions: normalizeStringList(output.openQuestions),
    recruiterNotesSummary: output.recruiterNotesSummary.trim(),
    suggestedNextRecruiterActions: normalizeStringList(output.suggestedNextRecruiterActions),
    unconfirmedFacts: normalizeStringList(output.unconfirmedFacts)
  };
}

function readPhonePreparation(value: unknown): PhoneScreenPreparationOutput {
  const body = assertRecord(value);

  return {
    conversationChecklist: readStringList(body, "conversationChecklist"),
    conversationGoals: readStringList(body, "conversationGoals"),
    informationToConfirm: readStringList(body, "informationToConfirm"),
    keyVerificationQuestions: readStringList(body, "keyVerificationQuestions"),
    riskVerificationQuestions: readStringList(body, "riskVerificationQuestions"),
    suggestedOpening: readRequiredText(body, "suggestedOpening", maxTextLength),
    thingsToAvoid: readStringList(body, "thingsToAvoid")
  };
}

function readPhoneNotes(value: unknown): PhoneNotes {
  const body = assertRecord(value);

  return {
    availability: readOptionalText(body, "availability", maxTextLength) ?? "",
    candidateMotivation: readOptionalText(body, "candidateMotivation", maxTextLength) ?? "",
    communicationQuality: readOptionalText(body, "communicationQuality", maxTextLength) ?? "",
    freeNotes: readOptionalText(body, "freeNotes", maxTextLength) ?? "",
    keyFacts: readStringList(body, "keyFacts"),
    openQuestions: readStringList(body, "openQuestions"),
    salaryExpectation: readOptionalText(body, "salaryExpectation", maxTextLength) ?? ""
  };
}

function readInterviewPreparation(value: unknown): InterviewPreparationOutput {
  const body = assertRecord(value);

  return {
    evidenceToVerify: readStringList(body, "evidenceToVerify"),
    highPriorityTopics: readStringList(body, "highPriorityTopics"),
    interviewFocus: readStringList(body, "interviewFocus"),
    missingInformation: readStringList(body, "missingInformation"),
    possibleFollowUpQuestions: readStringList(body, "possibleFollowUpQuestions"),
    suggestedQuestions: readStringList(body, "suggestedQuestions")
  };
}

function readInterviewNotes(value: unknown): InterviewNotes {
  const body = assertRecord(value);

  return {
    concerns: readStringList(body, "concerns"),
    interviewSummary: readOptionalText(body, "interviewSummary", maxTextLength) ?? "",
    newEvidence: readStringList(body, "newEvidence"),
    overallImpression: readOptionalText(body, "overallImpression", maxTextLength) ?? "",
    strengths: readStringList(body, "strengths"),
    weaknesses: readStringList(body, "weaknesses")
  };
}

function readRecruiterSummary(value: unknown): RecruiterSummaryOutput {
  const body = assertRecord(value);

  return {
    candidateTimeline: readStringList(body, "candidateTimeline"),
    confirmedFacts: readStringList(body, "confirmedFacts"),
    openQuestions: readStringList(body, "openQuestions"),
    recruiterNotesSummary: readRequiredText(body, "recruiterNotesSummary", maxTextLength),
    suggestedNextRecruiterActions: readStringList(body, "suggestedNextRecruiterActions"),
    unconfirmedFacts: readStringList(body, "unconfirmedFacts")
  };
}

function readPromptVersions(value: unknown): RecruitTogetherCreateInput["promptVersions"] {
  const body = assertRecord(value);

  return {
    interviewPreparation: readRequiredText(body, "interviewPreparation", 50),
    phonePreparation: readRequiredText(body, "phonePreparation", 50),
    recruiterSummary: readRequiredText(body, "recruiterSummary", 50)
  };
}

function readGenerationTimes(value: unknown): RecruitTogetherCreateInput["generationTimes"] {
  const body = assertRecord(value);

  return {
    interviewPreparation: readOptionalNumber(body, "interviewPreparation"),
    phonePreparation: readOptionalNumber(body, "phonePreparation"),
    recruiterSummary: readOptionalNumber(body, "recruiterSummary")
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RecruitTogetherValidationError("请求体必须是 JSON 对象。");
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
    throw new RecruitTogetherValidationError(`${field} 为必填项。`);
  }

  if (value.trim().length > maxLength) {
    throw new RecruitTogetherValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return value.trim();
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
    throw new RecruitTogetherValidationError(`${field} 必须是字符串。`);
  }

  if (value.trim().length > maxLength) {
    throw new RecruitTogetherValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return value.trim();
}

function readStringList(source: Record<string, unknown>, field: string): string[] {
  const value = source[field];

  if (!Array.isArray(value)) {
    throw new RecruitTogetherValidationError(`${field} 必须是字符串数组。`);
  }

  return normalizeStringList(value);
}

function normalizeStringList(value: unknown[]): string[] {
  return value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new RecruitTogetherValidationError("列表字段必须只包含非空字符串。");
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
    throw new RecruitTogetherValidationError(`${field} 必须是非负数字。`);
  }

  return Math.round(value);
}
