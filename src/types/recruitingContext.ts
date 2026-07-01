import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { DailyRecruitingWorkspace } from "@/types/dailyWorkspace";
import type { JobProfile } from "@/types/jobProfile";
import type { RecruitTogetherWorkflow } from "@/types/recruitTogether";
import type {
  RecruiterWorkspaceNoteRecord,
  RecruiterWorkspaceScheduleRecord
} from "@/types/recruiterWorkspace";
import type { RecruitmentTask } from "@/types/recruitmentTask";

export const RECRUITING_CONTEXT_VERSION = "recruiting-context-v1";

export type RecruitingContextInput = {
  date?: string;
  recruiterName?: string;
};

export type RecruitingContextRecruiter = {
  name: string;
  source: "system_default" | "input";
};

export type RecruitingContextToday = {
  date: string;
  startDate: string;
  endDate: string;
};

export type RecruitingContextReviewedInsights = {
  jobProfiles: JobProfile[];
  candidateInsights: CandidateInsight[];
  recruitTogetherRecords: RecruitTogetherWorkflow[];
  dailyWorkspaces: DailyRecruitingWorkspace[];
};

export type RecruitingContextPendingActions = {
  openTasks: RecruitmentTask[];
  missingJobInformationCount: number;
  missingCandidateInformationCount: number;
  openScheduleItemsCount: number;
};

export type RecruitingContextFuturePlaceholder = {
  status: "NOT_IMPLEMENTED";
  reason: string;
};

export type RecruitingContextAuditSource = {
  source:
    | "JobProfile"
    | "CandidateInsight"
    | "RecruitTogether"
    | "DailyWorkspace"
    | "RecruitmentTask"
    | "RecruiterNote"
    | "Schedule";
  recordCount: number;
};

export type RecruitingContextAudit = {
  generatedAt: string;
  contextVersion: typeof RECRUITING_CONTEXT_VERSION;
  sources: RecruitingContextAuditSource[];
  constraints: string[];
};

export type RecruitingContext = {
  contextVersion: typeof RECRUITING_CONTEXT_VERSION;
  generatedAt: string;
  recruiter: RecruitingContextRecruiter;
  today: RecruitingContextToday;
  jobs: JobProfile[];
  candidates: CandidateInsight[];
  tasks: RecruitmentTask[];
  schedule: RecruiterWorkspaceScheduleRecord[];
  notes: RecruiterWorkspaceNoteRecord[];
  workflowHistory: string[];
  reviewedInsights: RecruitingContextReviewedInsights;
  pendingActions: RecruitingContextPendingActions;
  audit: RecruitingContextAudit;
  talentMap: RecruitingContextFuturePlaceholder;
  learningAssets: RecruitingContextFuturePlaceholder;
  analytics: RecruitingContextFuturePlaceholder;
};
