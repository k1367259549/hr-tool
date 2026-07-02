import { randomUUID } from "node:crypto";
import {
  validateDailyInsightsOutput,
  validateDailySummaryOutput,
  validateImprovementSuggestionsOutput,
  validateTomorrowPrioritiesOutput
} from "@/ai/schemas/dailyWorkspace.schema";
import { aiService } from "@/ai/ai.service";
import { candidateInsightRepository } from "@/repositories/candidateInsight.repository";
import { dailyWorkspaceRepository } from "@/repositories/dailyWorkspace.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { recruitTogetherRepository } from "@/repositories/recruitTogether.repository";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import type { JsonObject } from "@/types/ai";
import type { RecruitTogetherWorkflow } from "@/types/recruitTogether";
import type {
  DailyInsightsOutput,
  DailyRecruitingWorkspace,
  DailyRecruitingWorkspaceDto,
  DailySummaryOutput,
  DailyWorkspaceActivitySnapshot,
  DailyWorkspaceCreateInput,
  DailyWorkspaceGenerateInput,
  DailyWorkspaceGenerateResult,
  DailyWorkspacePromptVersions,
  ImprovementSuggestionsOutput,
  TomorrowPrioritiesOutput
} from "@/types/dailyWorkspace";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";
import { AppError } from "@/utils/errors";
import {
  normalizeDailyInsights,
  normalizeDailySummary,
  normalizeImprovementSuggestions,
  normalizeTomorrowPriorities
} from "@/utils/dailyWorkspaceValidation";

export class DailyWorkspaceServiceError extends Error {
  readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR";

  constructor(code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
    super(message);
    this.name = "DailyWorkspaceServiceError";
    this.code = code;
  }
}

export const dailyWorkspaceService = {
  async getActivitySnapshot(input: DailyWorkspaceGenerateInput = {}): Promise<DailyWorkspaceActivitySnapshot> {
    const date = normalizeDateInput(input.date);
    const { startDate, endDate } = getDayRange(date);
    const [jobProfiles, candidateInsights, recruitTogetherWorkflows] = await Promise.all([
      jobProfileRepository.findManyCreatedBetween(startDate, endDate),
      candidateInsightRepository.findManyCreatedBetween(startDate, endDate),
      recruitTogetherRepository.findManyCreatedBetween(startDate, endDate)
    ]);

    return createActivitySnapshot(date, jobProfiles, candidateInsights, recruitTogetherWorkflows);
  },

  async generateDailyWorkspace(
    input: DailyWorkspaceGenerateInput = {}
  ): Promise<DailyWorkspaceGenerateResult> {
    const workflowId = randomUUID();
    const date = normalizeDateInput(input.date);
    const activitySnapshot = await this.getActivitySnapshot({ date: toDateString(date) });
    const generationTimes: DailyWorkspaceGenerateResult["generationTimes"] = {};
    const promptVersions: DailyWorkspacePromptVersions = {
      dailyInsights: "",
      dailySummary: "",
      improvementSuggestions: "",
      tomorrowPriorities: ""
    };
    const aiMetadata = {
      model: "",
      provider: ""
    };

    try {
      const dailySummary = await generateDailySummary({
        activitySnapshot,
        date,
        generationTimes,
        aiMetadata,
        manualNotes: input.manualNotes ?? "",
        promptVersions
      });
      const recruitingInsights = await generateDailyInsights({
        activitySnapshot,
        dailySummary,
        date,
        generationTimes,
        aiMetadata,
        manualNotes: input.manualNotes ?? "",
        promptVersions
      });
      const tomorrowPriorities = await generateTomorrowPriorities({
        activitySnapshot,
        dailySummary,
        date,
        generationTimes,
        aiMetadata,
        manualNotes: input.manualNotes ?? "",
        promptVersions,
        recruitingInsights
      });
      const improvementSuggestions = await generateImprovementSuggestions({
        activitySnapshot,
        dailySummary,
        date,
        generationTimes,
        aiMetadata,
        improvementContext: {
          recruitingInsights,
          tomorrowPriorities
        },
        manualNotes: input.manualNotes ?? "",
        promptVersions
      });

      return {
        activitySnapshot,
        aiModel: aiMetadata.model,
        aiProvider: aiMetadata.provider,
        dailySummary,
        date: toDateString(date),
        generatedAt: new Date().toISOString(),
        generationTimes,
        improvementSuggestions,
        promptVersions,
        recruitingInsights,
        tomorrowPriorities,
        workflowId
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw new DailyWorkspaceServiceError(
          "AI_ERROR",
          getSafeAiErrorMessage(error, "每日招聘工作区生成失败。")
        );
      }

      if (error instanceof DailyWorkspaceServiceError) {
        throw error;
      }

      throw new DailyWorkspaceServiceError("AI_ERROR", "AI 每日工作区输出无效。");
    }
  },

  async saveDailyWorkspace(input: DailyWorkspaceCreateInput): Promise<DailyRecruitingWorkspaceDto> {
    try {
      const workspace = await dailyWorkspaceRepository.create(input);

      return toDailyRecruitingWorkspaceDto(workspace);
    } catch {
      throw new DailyWorkspaceServiceError("DATABASE_ERROR", "保存每日招聘工作区失败。");
    }
  }
};

async function generateDailySummary({
  activitySnapshot,
  aiMetadata,
  date,
  generationTimes,
  manualNotes,
  promptVersions
}: {
  activitySnapshot: DailyWorkspaceActivitySnapshot;
  aiMetadata: DailyWorkspaceAiMetadata;
  date: Date;
  generationTimes: DailyWorkspaceGenerateResult["generationTimes"];
  manualNotes: string;
  promptVersions: DailyWorkspacePromptVersions;
}): Promise<DailySummaryOutput> {
  const result = await aiService.generateValidatedJsonFromPrompt({
    feature: "daily-workspace-summary",
    promptFile: "daily-summary.md",
    validate: (value) => normalizeDailySummary(validateDailySummaryOutput(value)),
    variables: {
      INPUT: createPromptInput(date, activitySnapshot, manualNotes)
    },
    workflow: "Workflow-04 Daily Workspace"
  });
  generationTimes.dailySummary = result.generationTimeMs;
  aiMetadata.model = result.model;
  aiMetadata.provider = result.provider;
  promptVersions.dailySummary = result.prompt.version;

  return result.output;
}

async function generateDailyInsights({
  activitySnapshot,
  aiMetadata,
  dailySummary,
  date,
  generationTimes,
  manualNotes,
  promptVersions
}: {
  activitySnapshot: DailyWorkspaceActivitySnapshot;
  aiMetadata: DailyWorkspaceAiMetadata;
  dailySummary: DailySummaryOutput;
  date: Date;
  generationTimes: DailyWorkspaceGenerateResult["generationTimes"];
  manualNotes: string;
  promptVersions: DailyWorkspacePromptVersions;
}): Promise<DailyInsightsOutput> {
  const result = await aiService.generateValidatedJsonFromPrompt({
    feature: "daily-workspace-insights",
    promptFile: "daily-insights.md",
    validate: (value) => normalizeDailyInsights(validateDailyInsightsOutput(value)),
    variables: {
      INPUT: createPromptInput(date, activitySnapshot, manualNotes, {
        dailySummary: dailySummary as unknown as JsonObject
      })
    },
    workflow: "Workflow-04 Daily Workspace"
  });
  generationTimes.dailyInsights = result.generationTimeMs;
  aiMetadata.model = result.model;
  aiMetadata.provider = result.provider;
  promptVersions.dailyInsights = result.prompt.version;

  return result.output;
}

async function generateTomorrowPriorities({
  activitySnapshot,
  aiMetadata,
  dailySummary,
  date,
  generationTimes,
  manualNotes,
  promptVersions,
  recruitingInsights
}: {
  activitySnapshot: DailyWorkspaceActivitySnapshot;
  aiMetadata: DailyWorkspaceAiMetadata;
  dailySummary: DailySummaryOutput;
  date: Date;
  generationTimes: DailyWorkspaceGenerateResult["generationTimes"];
  manualNotes: string;
  promptVersions: DailyWorkspacePromptVersions;
  recruitingInsights: DailyInsightsOutput;
}): Promise<TomorrowPrioritiesOutput> {
  const result = await aiService.generateValidatedJsonFromPrompt({
    feature: "daily-workspace-tomorrow-priorities",
    promptFile: "tomorrow-priorities.md",
    validate: (value) => normalizeTomorrowPriorities(validateTomorrowPrioritiesOutput(value)),
    variables: {
      INPUT: createPromptInput(date, activitySnapshot, manualNotes, {
        dailySummary: dailySummary as unknown as JsonObject,
        recruitingInsights: recruitingInsights as unknown as JsonObject
      })
    },
    workflow: "Workflow-04 Daily Workspace"
  });
  generationTimes.tomorrowPriorities = result.generationTimeMs;
  aiMetadata.model = result.model;
  aiMetadata.provider = result.provider;
  promptVersions.tomorrowPriorities = result.prompt.version;

  return result.output;
}

async function generateImprovementSuggestions({
  activitySnapshot,
  aiMetadata,
  dailySummary,
  date,
  generationTimes,
  improvementContext,
  manualNotes,
  promptVersions
}: {
  activitySnapshot: DailyWorkspaceActivitySnapshot;
  aiMetadata: DailyWorkspaceAiMetadata;
  dailySummary: DailySummaryOutput;
  date: Date;
  generationTimes: DailyWorkspaceGenerateResult["generationTimes"];
  improvementContext: JsonObject;
  manualNotes: string;
  promptVersions: DailyWorkspacePromptVersions;
}): Promise<ImprovementSuggestionsOutput> {
  const result = await aiService.generateValidatedJsonFromPrompt({
    feature: "daily-workspace-improvement-suggestions",
    promptFile: "improvement-suggestions.md",
    validate: (value) =>
      normalizeImprovementSuggestions(validateImprovementSuggestionsOutput(value)),
    variables: {
      INPUT: createPromptInput(date, activitySnapshot, manualNotes, {
        dailySummary: dailySummary as unknown as JsonObject,
        ...improvementContext
      })
    },
    workflow: "Workflow-04 Daily Workspace"
  });
  generationTimes.improvementSuggestions = result.generationTimeMs;
  aiMetadata.model = result.model;
  aiMetadata.provider = result.provider;
  promptVersions.improvementSuggestions = result.prompt.version;

  return result.output;
}

type DailyWorkspaceAiMetadata = {
  model: string;
  provider: string;
};

function createPromptInput(
  date: Date,
  activitySnapshot: DailyWorkspaceActivitySnapshot,
  manualNotes: string,
  priorOutputs?: JsonObject
): JsonObject {
  return {
    activitySnapshot: activitySnapshot as unknown as JsonObject,
    date: toDateString(date),
    manualNotes,
    priorOutputs: priorOutputs ?? {}
  };
}

function createActivitySnapshot(
  date: Date,
  jobProfiles: JobProfile[],
  candidateInsights: CandidateInsight[],
  recruitTogetherWorkflows: RecruitTogetherWorkflow[]
): DailyWorkspaceActivitySnapshot {
  return {
    candidateInsights: candidateInsights.map((insight) => ({
      createdAt: insight.createdAt.toISOString(),
      id: insight.id,
      jobProfileId: insight.jobProfileId,
      summary: readCandidateOverview(insight.summary)
    })),
    counts: {
      candidateInsights: candidateInsights.length,
      interviews: recruitTogetherWorkflows.filter((workflow) => hasJsonContent(workflow.interviewNotes))
        .length,
      jobProfiles: jobProfiles.length,
      phoneScreens: recruitTogetherWorkflows.filter((workflow) => hasJsonContent(workflow.phoneNotes))
        .length,
      recruitTogetherWorkflows: recruitTogetherWorkflows.length
    },
    date: toDateString(date),
    jobProfiles: jobProfiles.map((profile) => ({
      createdAt: profile.createdAt.toISOString(),
      id: profile.id,
      jobSummary: profile.jobSummary,
      jobTitle: profile.jobTitle
    })),
    recruitTogetherWorkflows: recruitTogetherWorkflows.map((workflow) => ({
      candidateInsightId: workflow.candidateInsightId,
      createdAt: workflow.createdAt.toISOString(),
      id: workflow.id,
      interviewNotesSummary: summarizeJson(workflow.interviewNotes),
      jobProfileId: workflow.jobProfileId,
      phoneNotesSummary: summarizeJson(workflow.phoneNotes),
      workflowId: workflow.workflowId
    })),
    workflowHistory: [
      ...jobProfiles.map((profile) => `Job Profile reviewed: ${profile.jobTitle}`),
      ...candidateInsights.map((insight) => `Candidate Insight reviewed: ${readCandidateOverview(insight.summary)}`),
      ...recruitTogetherWorkflows.map((workflow) => `Recruit Together completed: ${workflow.workflowId}`)
    ]
  };
}

function normalizeDateInput(value: string | undefined): Date {
  if (!value) {
    return new Date();
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new DailyWorkspaceServiceError("VALIDATION_ERROR", "日期格式无效。");
  }

  return parsedDate;
}

function getDayRange(date: Date): { startDate: Date; endDate: Date } {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return { endDate, startDate };
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readCandidateOverview(value: unknown): string {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const candidate = value as { candidateOverview?: unknown };

    if (typeof candidate.candidateOverview === "string") {
      return candidate.candidateOverview;
    }
  }

  return "Candidate Insight";
}

function hasJsonContent(value: unknown): boolean {
  return summarizeJson(value).length > 0;
}

function summarizeJson(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return "";
  }

  return JSON.stringify(value).slice(0, 300);
}

function toDailyRecruitingWorkspaceDto(
  workspace: DailyRecruitingWorkspace
): DailyRecruitingWorkspaceDto {
  return {
    ...workspace,
    activitySnapshot: workspace.activitySnapshot as unknown as DailyWorkspaceActivitySnapshot,
    createdAt: workspace.createdAt.toISOString(),
    dailySummary: workspace.dailySummary as unknown as DailySummaryOutput,
    date: toDateString(workspace.date),
    generationTimes: workspace.generationTimes as DailyRecruitingWorkspaceDto["generationTimes"],
    humanReview: workspace.humanReview as DailyRecruitingWorkspaceDto["humanReview"],
    improvementSuggestions:
      workspace.improvementSuggestions as unknown as ImprovementSuggestionsOutput,
    promptVersions: workspace.promptVersions as DailyRecruitingWorkspaceDto["promptVersions"],
    recruitingInsights: workspace.recruitingInsights as unknown as DailyInsightsOutput,
    tomorrowPriorities: workspace.tomorrowPriorities as unknown as TomorrowPrioritiesOutput,
    updatedAt: workspace.updatedAt.toISOString()
  };
}
