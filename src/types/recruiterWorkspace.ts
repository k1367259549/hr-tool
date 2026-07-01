import type { Prisma } from "@prisma/client";
import type {
  RecruitmentTaskCategory,
  RecruitmentTaskConfidence,
  RecruitmentTaskPriority,
  RecruitmentTaskSourceType,
  RecruitmentTaskStatus
} from "@/types/recruitmentTask";

export type RecruiterWorkspaceJobCard = {
  id: string;
  jobTitle: string;
  hiringGoal: string;
  currentStage: string;
  candidatesToday: number;
  pendingActions: string[];
  href: string;
};

export type RecruiterWorkspaceCandidateCard = {
  id: string;
  candidateName: string;
  relatedJob: string;
  currentWorkflow: string;
  attention: string[];
  nextAction: string;
  href: string;
};

export type RecruiterWorkspaceCandidateGroup = {
  group: "Need Phone Screen" | "Need Interview" | "Need Follow-up" | "Waiting Information" | "Recently Updated";
  title: string;
  candidates: RecruiterWorkspaceCandidateCard[];
};

export type RecruiterWorkspaceAiSuggestions = {
  priorities: string[];
  potentialRisks: string[];
  candidatesRequiringAttention: string[];
  jobsRequiringClarification: string[];
  missingInformation: string[];
  evidence: string[];
};

export type RecruiterWorkspaceActionCard = {
  sourceKey: string;
  sourceType: RecruitmentTaskSourceType;
  category: RecruitmentTaskCategory;
  title: string;
  priority: RecruitmentTaskPriority;
  reason: string;
  evidence: string[];
  recommendedNextAction: string;
  relatedWorkflow?: string;
  relatedCandidate?: string;
  relatedJob?: string;
  dueTime?: string;
  confidence: RecruitmentTaskConfidence;
  status: RecruitmentTaskStatus;
  priorityReason: string;
  quickStartHref?: string;
};

export type RecruiterWorkspaceScheduleItemInput = {
  id?: string;
  itemType: "PHONE_SCREEN" | "INTERVIEW" | "LEADER_MEETING" | "RECRUITING_TASK";
  title: string;
  startTime?: string;
  relatedName?: string;
  notes?: string;
  completed?: boolean;
  order?: number;
};

export type RecruiterWorkspaceScheduleItem = RecruiterWorkspaceScheduleItemInput & {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterWorkspaceScheduleItemDto = Omit<
  RecruiterWorkspaceScheduleItem,
  "date" | "createdAt" | "updatedAt"
> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type RecruiterWorkspaceActivity = {
  id: string;
  time: string;
  title: string;
  description: string;
  status: string;
  source:
    | "Job Profile"
    | "Candidate Insight"
    | "Recruit Together"
    | "Daily Workspace"
    | "Recruiter Note";
  href?: string;
};

export type RecruiterWorkspaceNoteInput = {
  content: string;
  category?: string;
};

export type RecruiterWorkspaceNote = {
  id: string;
  date: Date;
  content: string;
  category: string | null;
  source: string;
  searchableText: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterWorkspaceNoteDto = Omit<
  RecruiterWorkspaceNote,
  "date" | "createdAt" | "updatedAt"
> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type RecruiterWorkspaceOverview = {
  recruiterName: string;
  date: string;
  greeting: string;
  overview: string;
};

export type RecruiterWorkspaceWorkflowStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_REVIEW";

export type RecruiterWorkspaceWorkflowProgressItem = {
  workflow:
    | "JOB_UNDERSTANDING"
    | "CANDIDATE_UNDERSTANDING"
    | "RECRUIT_TOGETHER"
    | "DAILY_WORKSPACE"
    | "TASK_CENTER";
  title: string;
  status: RecruiterWorkspaceWorkflowStatus;
  href: string;
  nextAction: string;
};

export type RecruiterWorkspaceData = {
  overview: RecruiterWorkspaceOverview;
  workflowProgress: RecruiterWorkspaceWorkflowProgressItem[];
  focusItems: RecruiterWorkspaceActionCard[];
  todaysJobs: RecruiterWorkspaceJobCard[];
  candidateGroups: RecruiterWorkspaceCandidateGroup[];
  aiSuggestions: RecruiterWorkspaceAiSuggestions;
  actionCards: RecruiterWorkspaceActionCard[];
  schedule: RecruiterWorkspaceScheduleItemDto[];
  quickActions: Array<{
    title: string;
    description: string;
    href: string;
  }>;
  recentActivity: RecruiterWorkspaceActivity[];
  notes: RecruiterWorkspaceNoteDto[];
  futurePlaceholders: Array<{
    title: string;
    description: string;
  }>;
};

export type RecruiterWorkspaceNoteRecord = {
  id: string;
  date: Date;
  content: string;
  category: string | null;
  source: string;
  searchableText: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterWorkspaceScheduleRecord = {
  id: string;
  date: Date;
  itemType: string;
  title: string;
  startTime: string | null;
  relatedName: string | null;
  notes: string | null;
  completed: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterWorkspaceJsonValue = Prisma.JsonValue;
