import type { Prisma } from "@prisma/client";

export type RecruitmentTaskCategory =
  | "PHONE_SCREEN"
  | "INTERVIEW_PREPARATION"
  | "LEADER_CONFIRMATION"
  | "FOLLOW_UP"
  | "MISSING_INFORMATION"
  | "CANDIDATE_REVIEW"
  | "JOB_CLARIFICATION"
  | "RECRUITER_REMINDER";

export type RecruitmentTaskPriority = "HIGH" | "MEDIUM" | "LOW";

export type RecruitmentTaskConfidence = "HIGH" | "MEDIUM" | "LOW";

export type RecruitmentTaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "DEFERRED" | "CANCELLED";

export type RecruitmentTaskSourceType =
  | "JOB_UNDERSTANDING"
  | "CANDIDATE_UNDERSTANDING"
  | "RECRUIT_TOGETHER"
  | "DAILY_WORKSPACE"
  | "RECRUITER_NOTE";

export type RecruitmentTaskCreateInput = {
  sourceKey: string;
  sourceType: RecruitmentTaskSourceType;
  category: RecruitmentTaskCategory;
  title: string;
  priority: RecruitmentTaskPriority;
  priorityReason: string;
  reason: string;
  evidence: string[];
  relatedWorkflow?: string;
  relatedCandidate?: string;
  relatedJob?: string;
  dueTime?: Date;
  confidence?: RecruitmentTaskConfidence;
  recommendedNextAction: string;
  quickStartHref?: string;
};

export type RecruitmentTaskUpdateInput = {
  title?: string;
  priority?: RecruitmentTaskPriority;
  priorityReason?: string;
  reason?: string;
  evidence?: string[];
  relatedCandidate?: string;
  relatedJob?: string;
  dueTime?: Date | null;
  confidence?: RecruitmentTaskConfidence;
  recommendedNextAction?: string;
  status?: RecruitmentTaskStatus;
  quickStartHref?: string;
  reviewedByRecruiter?: boolean;
};

export type RecruitmentTask = {
  id: string;
  sourceKey: string;
  sourceType: string;
  category: string;
  title: string;
  priority: string;
  priorityReason: string;
  reason: string;
  evidence: string[];
  relatedWorkflow: string | null;
  relatedCandidate: string | null;
  relatedJob: string | null;
  dueTime: Date | null;
  confidence: string;
  recommendedNextAction: string;
  status: string;
  quickStartHref: string | null;
  createdBy: string;
  reviewedByRecruiter: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruitmentTaskDto = Omit<
  RecruitmentTask,
  "dueTime" | "createdAt" | "updatedAt"
> & {
  sourceType: RecruitmentTaskSourceType;
  category: RecruitmentTaskCategory;
  priority: RecruitmentTaskPriority;
  confidence: RecruitmentTaskConfidence;
  status: RecruitmentTaskStatus;
  dueTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecruitmentTaskAudit = {
  id: string;
  taskId: string;
  action: string;
  actor: string;
  beforeStatus: string | null;
  afterStatus: string | null;
  beforeValue: Prisma.JsonValue | null;
  afterValue: Prisma.JsonValue | null;
  note: string | null;
  createdAt: Date;
};

export type RecruitmentTaskAuditDto = Omit<
  RecruitmentTaskAudit,
  "beforeValue" | "afterValue" | "createdAt"
> & {
  beforeValue: unknown;
  afterValue: unknown;
  createdAt: string;
};

export type RecruitmentTaskCenterData = {
  generatedAt: string;
  tasks: RecruitmentTaskDto[];
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    deferred: number;
    cancelled: number;
  };
  quickStarts: Array<{
    title: string;
    href: string;
    description: string;
  }>;
};

export type RecruitmentTaskActionInput = {
  taskId: string;
  action: "ACCEPT" | "MODIFY" | "DISMISS" | "RESCHEDULE" | "COMPLETE" | "START" | "DEFER";
  patch?: RecruitmentTaskUpdateInput;
  note?: string;
};
