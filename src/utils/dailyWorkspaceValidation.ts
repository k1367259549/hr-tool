import type {
  DailyInsightsOutput,
  DailySummaryOutput,
  DailyWorkspaceCreateInput,
  DailyWorkspaceGenerateInput,
  ImprovementSuggestionsOutput,
  TomorrowPrioritiesOutput
} from "@/types/dailyWorkspace";

const maxTextLength = 20000;

export class DailyWorkspaceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyWorkspaceValidationError";
  }
}

export function parseDailyWorkspaceGeneratePayload(payload: unknown): DailyWorkspaceGenerateInput {
  const body = assertRecord(payload);

  return {
    date: readOptionalText(body, "date", 20),
    manualNotes: readOptionalText(body, "manualNotes", maxTextLength)
  };
}

export function parseDailyWorkspaceSavePayload(payload: unknown): DailyWorkspaceCreateInput {
  const body = assertRecord(payload);

  return {
    activitySnapshot: readRequiredObject(body.activitySnapshot, "activitySnapshot"),
    aiModel: readRequiredText(body, "aiModel", 200),
    aiProvider: readRequiredText(body, "aiProvider", 100),
    dailySummary: readDailySummary(body.dailySummary),
    date: readRequiredText(body, "date", 20),
    generatedAt: readRequiredText(body, "generatedAt", 100),
    generationTimes: readRequiredObject(body.generationTimes, "generationTimes"),
    improvementSuggestions: readImprovementSuggestions(body.improvementSuggestions),
    manualNotes: readOptionalText(body, "manualNotes", maxTextLength),
    promptVersions: readRequiredObject(body.promptVersions, "promptVersions"),
    recruitingInsights: readDailyInsights(body.recruitingInsights),
    tomorrowPriorities: readTomorrowPriorities(body.tomorrowPriorities),
    workflowId: readRequiredText(body, "workflowId", 100)
  } as DailyWorkspaceCreateInput;
}

export function normalizeDailySummary(output: DailySummaryOutput): DailySummaryOutput {
  return {
    ...normalizeUnifiedOutput(output),
    candidatesProcessed: normalizeStringList(output.candidatesProcessed),
    interviewsCompleted: normalizeStringList(output.interviewsCompleted),
    jobsWorkedOn: normalizeStringList(output.jobsWorkedOn),
    keyAchievements: normalizeStringList(output.keyAchievements),
    pendingWork: normalizeStringList(output.pendingWork),
    phoneScreensCompleted: normalizeStringList(output.phoneScreensCompleted),
    todaysWorkSummary: output.todaysWorkSummary.trim()
  };
}

export function normalizeDailyInsights(output: DailyInsightsOutput): DailyInsightsOutput {
  return {
    ...normalizeUnifiedOutput(output),
    attentionPoints: normalizeStringList(output.attentionPoints),
    candidateUnderstandingImprovements: normalizeStringList(
      output.candidateUnderstandingImprovements
    ),
    evidenceCoverage: normalizeStringList(output.evidenceCoverage),
    jobUnderstandingImprovements: normalizeStringList(output.jobUnderstandingImprovements),
    recruitingObservations: normalizeStringList(output.recruitingObservations),
    repeatedCandidateRisks: normalizeStringList(output.repeatedCandidateRisks),
    repeatedMissingInformation: normalizeStringList(output.repeatedMissingInformation),
    todaysRecruitingInsights: normalizeStringList(output.todaysRecruitingInsights)
  };
}

export function normalizeTomorrowPriorities(
  output: TomorrowPrioritiesOutput
): TomorrowPrioritiesOutput {
  return {
    ...normalizeUnifiedOutput(output),
    candidatesToContact: normalizeStringList(output.candidatesToContact),
    candidatesWaitingFollowUp: normalizeStringList(output.candidatesWaitingFollowUp),
    highPriorityTasks: normalizeStringList(output.highPriorityTasks),
    interviewsToPrepare: normalizeStringList(output.interviewsToPrepare),
    missingInformationToVerify: normalizeStringList(output.missingInformationToVerify),
    recruiterSuggestions: normalizeStringList(output.recruiterSuggestions)
  };
}

export function normalizeImprovementSuggestions(
  output: ImprovementSuggestionsOutput
): ImprovementSuggestionsOutput {
  return {
    ...normalizeUnifiedOutput(output),
    aiSuggestions: normalizeStringList(output.aiSuggestions),
    potentialProductImprovementNotes: normalizeStringList(output.potentialProductImprovementNotes),
    promptImprovementIdeas: normalizeStringList(output.promptImprovementIdeas),
    recruiterEfficiencySuggestions: normalizeStringList(output.recruiterEfficiencySuggestions),
    workflowImprovementIdeas: normalizeStringList(output.workflowImprovementIdeas)
  };
}

function readDailySummary(value: unknown): DailySummaryOutput {
  const body = assertRecord(value);

  return {
    ...readUnifiedOutput(body),
    candidatesProcessed: readStringList(body, "candidatesProcessed"),
    interviewsCompleted: readStringList(body, "interviewsCompleted"),
    jobsWorkedOn: readStringList(body, "jobsWorkedOn"),
    keyAchievements: readStringList(body, "keyAchievements"),
    pendingWork: readStringList(body, "pendingWork"),
    phoneScreensCompleted: readStringList(body, "phoneScreensCompleted"),
    todaysWorkSummary: readRequiredText(body, "todaysWorkSummary", maxTextLength)
  };
}

function readDailyInsights(value: unknown): DailyInsightsOutput {
  const body = assertRecord(value);

  return {
    ...readUnifiedOutput(body),
    attentionPoints: readStringList(body, "attentionPoints"),
    candidateUnderstandingImprovements: readStringList(body, "candidateUnderstandingImprovements"),
    evidenceCoverage: readStringList(body, "evidenceCoverage"),
    jobUnderstandingImprovements: readStringList(body, "jobUnderstandingImprovements"),
    recruitingObservations: readStringList(body, "recruitingObservations"),
    repeatedCandidateRisks: readStringList(body, "repeatedCandidateRisks"),
    repeatedMissingInformation: readStringList(body, "repeatedMissingInformation"),
    todaysRecruitingInsights: readStringList(body, "todaysRecruitingInsights")
  };
}

function readTomorrowPriorities(value: unknown): TomorrowPrioritiesOutput {
  const body = assertRecord(value);

  return {
    ...readUnifiedOutput(body),
    candidatesToContact: readStringList(body, "candidatesToContact"),
    candidatesWaitingFollowUp: readStringList(body, "candidatesWaitingFollowUp"),
    highPriorityTasks: readStringList(body, "highPriorityTasks"),
    interviewsToPrepare: readStringList(body, "interviewsToPrepare"),
    missingInformationToVerify: readStringList(body, "missingInformationToVerify"),
    recruiterSuggestions: readStringList(body, "recruiterSuggestions")
  };
}

function readImprovementSuggestions(value: unknown): ImprovementSuggestionsOutput {
  const body = assertRecord(value);

  return {
    ...readUnifiedOutput(body),
    aiSuggestions: readStringList(body, "aiSuggestions"),
    potentialProductImprovementNotes: readStringList(body, "potentialProductImprovementNotes"),
    promptImprovementIdeas: readStringList(body, "promptImprovementIdeas"),
    recruiterEfficiencySuggestions: readStringList(body, "recruiterEfficiencySuggestions"),
    workflowImprovementIdeas: readStringList(body, "workflowImprovementIdeas")
  };
}

function readUnifiedOutput(source: Record<string, unknown>) {
  return {
    attention: readStringList(source, "attention"),
    audit: readStringList(source, "audit"),
    confidence: readRequiredText(source, "confidence", 200),
    evidence: readStringList(source, "evidence"),
    insights: readStringList(source, "insights"),
    suggestedActions: readStringList(source, "suggestedActions"),
    summary: readRequiredText(source, "summary", maxTextLength)
  };
}

function normalizeUnifiedOutput<TOutput extends ReturnType<typeof readUnifiedOutput>>(
  output: TOutput
): TOutput {
  return {
    ...output,
    attention: normalizeStringList(output.attention),
    audit: normalizeStringList(output.audit),
    confidence: output.confidence.trim(),
    evidence: normalizeStringList(output.evidence),
    insights: normalizeStringList(output.insights),
    suggestedActions: normalizeStringList(output.suggestedActions),
    summary: output.summary.trim()
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DailyWorkspaceValidationError("请求体必须是 JSON 对象。");
  }

  return value as Record<string, unknown>;
}

function readRequiredObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DailyWorkspaceValidationError(`${field} 必须是 JSON 对象。`);
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
    throw new DailyWorkspaceValidationError(`${field} 为必填项。`);
  }

  if (value.trim().length > maxLength) {
    throw new DailyWorkspaceValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
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
    throw new DailyWorkspaceValidationError(`${field} 必须是字符串。`);
  }

  if (value.trim().length > maxLength) {
    throw new DailyWorkspaceValidationError(`${field} 不能超过 ${maxLength} 个字符。`);
  }

  return value.trim();
}

function readStringList(source: Record<string, unknown>, field: string): string[] {
  const value = source[field];

  if (!Array.isArray(value)) {
    throw new DailyWorkspaceValidationError(`${field} 必须是字符串数组。`);
  }

  return normalizeStringList(value);
}

function normalizeStringList(value: unknown[]): string[] {
  return value.map((item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new DailyWorkspaceValidationError("列表字段必须只包含非空字符串。");
    }

    return item.trim();
  });
}
