import type { Prisma } from "@prisma/client";
import type { JsonObject } from "@/types/ai";

export type DailyWorkspaceUnifiedOutput = {
  summary: string;
  insights: string[];
  evidence: string[];
  attention: string[];
  suggestedActions: string[];
  confidence: string;
  audit: string[];
};

export type DailySummaryOutput = DailyWorkspaceUnifiedOutput & {
  todaysWorkSummary: string;
  jobsWorkedOn: string[];
  candidatesProcessed: string[];
  phoneScreensCompleted: string[];
  interviewsCompleted: string[];
  keyAchievements: string[];
  pendingWork: string[];
};

export type DailyInsightsOutput = DailyWorkspaceUnifiedOutput & {
  todaysRecruitingInsights: string[];
  repeatedCandidateRisks: string[];
  repeatedMissingInformation: string[];
  jobUnderstandingImprovements: string[];
  candidateUnderstandingImprovements: string[];
  recruitingObservations: string[];
  evidenceCoverage: string[];
  attentionPoints: string[];
};

export type TomorrowPrioritiesOutput = DailyWorkspaceUnifiedOutput & {
  highPriorityTasks: string[];
  candidatesToContact: string[];
  candidatesWaitingFollowUp: string[];
  missingInformationToVerify: string[];
  interviewsToPrepare: string[];
  recruiterSuggestions: string[];
};

export type ImprovementSuggestionsOutput = DailyWorkspaceUnifiedOutput & {
  aiSuggestions: string[];
  promptImprovementIdeas: string[];
  workflowImprovementIdeas: string[];
  recruiterEfficiencySuggestions: string[];
  potentialProductImprovementNotes: string[];
};

export type DailyWorkspaceActivitySnapshot = {
  date: string;
  jobProfiles: Array<{
    id: string;
    jobTitle: string;
    jobSummary: string;
    createdAt: string;
  }>;
  candidateInsights: Array<{
    id: string;
    jobProfileId: string;
    summary: string;
    createdAt: string;
  }>;
  recruitTogetherWorkflows: Array<{
    id: string;
    workflowId: string;
    jobProfileId: string;
    candidateInsightId: string;
    phoneNotesSummary: string;
    interviewNotesSummary: string;
    createdAt: string;
  }>;
  workflowHistory: string[];
  counts: {
    jobProfiles: number;
    candidateInsights: number;
    phoneScreens: number;
    interviews: number;
    recruitTogetherWorkflows: number;
  };
};

export type DailyWorkspaceGenerateInput = {
  date?: string;
  manualNotes?: string;
};

export type DailyWorkspaceGenerateResult = {
  workflowId: string;
  date: string;
  activitySnapshot: DailyWorkspaceActivitySnapshot;
  dailySummary: DailySummaryOutput;
  recruitingInsights: DailyInsightsOutput;
  tomorrowPriorities: TomorrowPrioritiesOutput;
  improvementSuggestions: ImprovementSuggestionsOutput;
  aiProvider: string;
  aiModel: string;
  promptVersions: DailyWorkspacePromptVersions;
  generationTimes: DailyWorkspaceGenerationTimes;
  generatedAt: string;
};

export type DailyWorkspacePromptVersions = {
  dailySummary: string;
  dailyInsights: string;
  tomorrowPriorities: string;
  improvementSuggestions: string;
};

export type DailyWorkspaceGenerationTimes = {
  dailySummary?: number;
  dailyInsights?: number;
  tomorrowPriorities?: number;
  improvementSuggestions?: number;
};

export type DailyWorkspaceCreateInput = DailyWorkspaceGenerateResult & {
  manualNotes?: string;
};

export type DailyRecruitingWorkspace = {
  id: string;
  workflowId: string;
  date: Date;
  activitySnapshot: Prisma.JsonValue;
  dailySummary: Prisma.JsonValue;
  recruitingInsights: Prisma.JsonValue;
  tomorrowPriorities: Prisma.JsonValue;
  improvementSuggestions: Prisma.JsonValue;
  manualNotes: string | null;
  aiProvider: string;
  aiModel: string;
  promptVersions: Prisma.JsonValue;
  generationTimes: Prisma.JsonValue;
  humanReview: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export type DailyRecruitingWorkspaceDto = Omit<
  DailyRecruitingWorkspace,
  | "date"
  | "activitySnapshot"
  | "dailySummary"
  | "recruitingInsights"
  | "tomorrowPriorities"
  | "improvementSuggestions"
  | "promptVersions"
  | "generationTimes"
  | "humanReview"
  | "createdAt"
  | "updatedAt"
> & {
  date: string;
  activitySnapshot: DailyWorkspaceActivitySnapshot;
  dailySummary: DailySummaryOutput;
  recruitingInsights: DailyInsightsOutput;
  tomorrowPriorities: TomorrowPrioritiesOutput;
  improvementSuggestions: ImprovementSuggestionsOutput;
  promptVersions: DailyWorkspacePromptVersions;
  generationTimes: DailyWorkspaceGenerationTimes;
  humanReview: {
    required: true;
    completed: true;
    reviewedAt: string;
    reviewType: "daily_workspace_manual_review";
    learningAssetsCreated: false;
  };
  createdAt: string;
  updatedAt: string;
};

export type DailyWorkspacePromptInput = JsonObject & {
  date: string;
  manualNotes: string;
  activitySnapshot: JsonObject;
  priorOutputs?: JsonObject;
};
