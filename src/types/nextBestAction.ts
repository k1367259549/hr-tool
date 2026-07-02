import type {
  RecruitmentTaskCategory,
  RecruitmentTaskConfidence,
  RecruitmentTaskPriority,
  RecruitmentTaskSourceType,
  RecruitmentTaskStatus
} from "@/types/recruitmentTask";

export type NextBestActionCard = {
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
  dueTime?: Date;
  confidence: RecruitmentTaskConfidence;
  status: RecruitmentTaskStatus;
  priorityReason: string;
  quickStartHref?: string;
};

export type NextBestActionResult = {
  generatedAt: string;
  actionCards: NextBestActionCard[];
  contextSummary: {
    jobProfiles: number;
    candidateInsights: number;
    recruitTogetherRecords: number;
    dailyWorkspaces: number;
    recruitmentTasks: number;
    recruiterNotes: number;
    scheduleItems: number;
    workflowHistory: number;
  };
};

export type NextBestActionInput = {
  date?: string;
};
