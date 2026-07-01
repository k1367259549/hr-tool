import { candidateInsightRepository } from "@/repositories/candidateInsight.repository";
import { dailyWorkspaceRepository } from "@/repositories/dailyWorkspace.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { recruitmentTaskRepository } from "@/repositories/recruitmentTask.repository";
import { recruiterWorkspaceRepository } from "@/repositories/recruiterWorkspace.repository";
import { recruitTogetherRepository } from "@/repositories/recruitTogether.repository";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { DailyRecruitingWorkspace } from "@/types/dailyWorkspace";
import type { JobProfile } from "@/types/jobProfile";
import type {
  RecruitingContext,
  RecruitingContextInput,
  RecruitingContextPendingActions,
  RecruitingContextToday
} from "@/types/recruitingContext";
import { RECRUITING_CONTEXT_VERSION } from "@/types/recruitingContext";
import type { RecruitTogetherWorkflow } from "@/types/recruitTogether";
import type {
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceScheduleRecord
} from "@/types/recruiterWorkspace";
import type { RecruitmentTask } from "@/types/recruitmentTask";

export class RecruitingContextServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR";

  constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
    super(message);
    this.name = "RecruitingContextServiceError";
    this.code = code;
  }
}

export const recruitingContextService = {
  async getRecruitingContext(input: RecruitingContextInput = {}): Promise<RecruitingContext> {
    const today = normalizeToday(input.date);
    const generatedAt = new Date().toISOString();

    try {
      const [
        jobProfiles,
        candidateInsights,
        recruitTogetherRecords,
        dailyWorkspaces,
        recruitmentTasks,
        recruiterNotes,
        scheduleItems
      ] = await Promise.all([
        jobProfileRepository.findMany(),
        candidateInsightRepository.findMany(),
        recruitTogetherRepository.findMany(),
        dailyWorkspaceRepository.findMany(),
        recruitmentTaskRepository.findMany(),
        recruiterWorkspaceRepository.findRecentNotes(),
        recruiterWorkspaceRepository.findScheduleByDate(new Date(today.startDate))
      ]);

      return {
        analytics: createFuturePlaceholder("Recruitment Analytics is reserved for a reviewed future workflow."),
        audit: createAudit({
          candidateInsights,
          dailyWorkspaces,
          generatedAt,
          jobProfiles,
          recruiterNotes,
          recruitmentTasks,
          recruitTogetherRecords,
          scheduleItems
        }),
        candidates: candidateInsights,
        contextVersion: RECRUITING_CONTEXT_VERSION,
        generatedAt,
        jobs: jobProfiles,
        learningAssets: createFuturePlaceholder("Learning Assets require explicit human review and publication."),
        notes: recruiterNotes,
        pendingActions: createPendingActions({
          candidateInsights,
          jobProfiles,
          recruitmentTasks,
          scheduleItems
        }),
        recruiter: {
          name: input.recruiterName?.trim() || "Recruiter",
          source: input.recruiterName?.trim() ? "input" : "system_default"
        },
        reviewedInsights: {
          candidateInsights,
          dailyWorkspaces,
          jobProfiles,
          recruitTogetherRecords
        },
        schedule: scheduleItems,
        talentMap: createFuturePlaceholder("Talent Map is a future reviewed intelligence output."),
        tasks: recruitmentTasks,
        today,
        workflowHistory: createWorkflowHistory({
          candidateInsights,
          dailyWorkspaces,
          jobProfiles,
          recruitTogetherRecords
        })
      };
    } catch (error) {
      if (error instanceof RecruitingContextServiceError) {
        throw error;
      }

      throw new RecruitingContextServiceError("DATABASE_ERROR", "招聘上下文加载失败。");
    }
  }
};

function normalizeToday(value: string | undefined): RecruitingContextToday {
  const startDate = value ? new Date(`${value}T00:00:00`) : new Date();
  startDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(startDate.getTime())) {
    throw new RecruitingContextServiceError("VALIDATION_ERROR", "日期格式无效。");
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    date: formatDate(startDate),
    endDate: endDate.toISOString(),
    startDate: startDate.toISOString()
  };
}

function createPendingActions({
  candidateInsights,
  jobProfiles,
  recruitmentTasks,
  scheduleItems
}: {
  jobProfiles: JobProfile[];
  candidateInsights: CandidateInsight[];
  recruitmentTasks: RecruitmentTask[];
  scheduleItems: RecruiterWorkspaceScheduleRecord[];
}): RecruitingContextPendingActions {
  return {
    missingCandidateInformationCount: candidateInsights.reduce(
      (total, insight) => total + insight.missingInformation.length,
      0
    ),
    missingJobInformationCount: jobProfiles.reduce((total, job) => total + job.missingInformation.length, 0),
    openScheduleItemsCount: scheduleItems.filter((item) => !item.completed).length,
    openTasks: recruitmentTasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED")
  };
}

function createWorkflowHistory({
  candidateInsights,
  dailyWorkspaces,
  jobProfiles,
  recruitTogetherRecords
}: {
  jobProfiles: JobProfile[];
  candidateInsights: CandidateInsight[];
  recruitTogetherRecords: RecruitTogetherWorkflow[];
  dailyWorkspaces: DailyRecruitingWorkspace[];
}): string[] {
  return [
    ...jobProfiles.map((job) => `Job Profile reviewed: ${job.jobTitle}`),
    ...candidateInsights.map((insight) => `Candidate Insight reviewed: ${readCandidateOverview(insight.summary)}`),
    ...recruitTogetherRecords.map((record) => `Recruit Together saved: ${record.workflowId}`),
    ...dailyWorkspaces.map((workspace) => `Daily Workspace saved: ${workspace.workflowId}`)
  ];
}

function createAudit({
  candidateInsights,
  dailyWorkspaces,
  generatedAt,
  jobProfiles,
  recruiterNotes,
  recruitmentTasks,
  recruitTogetherRecords,
  scheduleItems
}: {
  generatedAt: string;
  jobProfiles: JobProfile[];
  candidateInsights: CandidateInsight[];
  recruitTogetherRecords: RecruitTogetherWorkflow[];
  dailyWorkspaces: DailyRecruitingWorkspace[];
  recruitmentTasks: RecruitmentTask[];
  recruiterNotes: RecruiterWorkspaceNoteRecord[];
  scheduleItems: RecruiterWorkspaceScheduleRecord[];
}): RecruitingContext["audit"] {
  return {
    constraints: [
      "No AI calls.",
      "No scoring or ranking.",
      "No autonomous actions.",
      "No Learning Assets are created."
    ],
    contextVersion: RECRUITING_CONTEXT_VERSION,
    generatedAt,
    sources: [
      { recordCount: jobProfiles.length, source: "JobProfile" },
      { recordCount: candidateInsights.length, source: "CandidateInsight" },
      { recordCount: recruitTogetherRecords.length, source: "RecruitTogether" },
      { recordCount: dailyWorkspaces.length, source: "DailyWorkspace" },
      { recordCount: recruitmentTasks.length, source: "RecruitmentTask" },
      { recordCount: recruiterNotes.length, source: "RecruiterNote" },
      { recordCount: scheduleItems.length, source: "Schedule" }
    ]
  };
}

function createFuturePlaceholder(reason: string): RecruitingContext["talentMap"] {
  return {
    reason,
    status: "NOT_IMPLEMENTED"
  };
}

function readCandidateOverview(value: unknown): string {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const candidate = value as { candidateOverview?: unknown };

    if (typeof candidate.candidateOverview === "string" && candidate.candidateOverview.trim()) {
      return candidate.candidateOverview.trim().slice(0, 80);
    }
  }

  return "Candidate Insight";
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
