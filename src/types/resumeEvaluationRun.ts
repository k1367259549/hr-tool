import type {
  Prisma,
  ResumeEvaluationRunStatus,
  ResumeEvaluationRunType
} from "@prisma/client";

export type { ResumeEvaluationRunStatus, ResumeEvaluationRunType };

export type ResumeEvaluationRunDto = {
  id: string;
  evaluationId: string;
  runType: ResumeEvaluationRunType;
  status: ResumeEvaluationRunStatus;
  score: number | null;
  rating: string | null;
  summary: string | null;
  createdAt: string;
  completedAt: string | null;
  modelProvider: string | null;
  modelName: string | null;
  promptVersion: string | null;
  resumeRevisionId: string;
  parsedSnapshotId: string;
  errorCode: string | null;
  errorMessage: string | null;
};

export type ResumeEvaluationRunSafeRecord = Prisma.ResumeEvaluationRunGetPayload<{
  select: {
    id: true;
    evaluationId: true;
    runType: true;
    status: true;
    score: true;
    rating: true;
    summary: true;
    createdAt: true;
    completedAt: true;
    modelProvider: true;
    modelName: true;
    promptVersion: true;
    resumeRevisionId: true;
    parsedSnapshotId: true;
    errorCode: true;
    errorMessage: true;
  };
}>;

export type CreateResumeEvaluationRunInput = {
  evaluationId: string;
  resumeId: string;
  resumeRevisionId: string;
  parsedSnapshotId: string;
  jobProfileId: string;
  templateVersionId: string;
  jobProfileVersion: string;
  runType: ResumeEvaluationRunType;
  status: ResumeEvaluationRunStatus;
  score?: number | null;
  rating?: string | null;
  summary?: string | null;
  strengthsJson?: Prisma.InputJsonValue | null;
  weaknessesJson?: Prisma.InputJsonValue | null;
  riskFlagsJson?: Prisma.InputJsonValue | null;
  evidenceJson?: Prisma.InputJsonValue | null;
  phoneScreenQuestionsJson?: Prisma.InputJsonValue | null;
  interviewQuestionsJson?: Prisma.InputJsonValue | null;
  modelProvider?: string | null;
  modelName?: string | null;
  promptVersion?: string | null;
  inputHash?: string | null;
  outputHash?: string | null;
  parsedOutputJson?: Prisma.InputJsonValue | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  latencyMs?: number | null;
  completedAt?: Date | null;
};
