export type JobUnderstandingInput = {
  jobTitle: string;
  jd: string;
  leaderRequirements?: string;
  teamBackground?: string;
  hiringGoal?: string;
  notes?: string;
};

export type JobUnderstandingOutput = {
  jobSummary: string;
  coreResponsibilities: string[];
  requiredCompetencies: string[];
  preferredCompetencies: string[];
  potentialRisks: string[];
  hiringFocus: string[];
  interviewFocus: string[];
  missingInformation: string[];
  suggestedFollowUpQuestions: string[];
};

export type JobUnderstandingResult = JobUnderstandingOutput & {
  workflowId: string;
  aiProvider: string;
  aiModel: string;
  promptFile: string;
  promptVersion: string;
  generationTimeMs?: number;
  generatedAt: string;
};

export type JobProfileCreateInput = JobUnderstandingInput &
  JobUnderstandingOutput & {
    workflowId: string;
    aiProvider: string;
    aiModel: string;
    promptFile: string;
    promptVersion: string;
    generationTimeMs?: number;
  };

export type JobProfile = JobUnderstandingOutput & {
  id: string;
  workflowId: string;
  jobTitle: string;
  jd: string;
  leaderRequirements: string | null;
  teamBackground: string | null;
  hiringGoal: string | null;
  notes: string | null;
  aiProvider: string;
  aiModel: string;
  promptFile: string;
  promptVersion: string;
  generationTimeMs: number | null;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type JobProfileDto = Omit<JobProfile, "reviewedAt" | "createdAt" | "updatedAt"> & {
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type JobUnderstandingFormValues = {
  jobTitle: string;
  jd: string;
  leaderRequirements: string;
  teamBackground: string;
  hiringGoal: string;
  notes: string;
};
