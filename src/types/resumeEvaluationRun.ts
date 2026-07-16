import type {
  Prisma,
  ResumeEvaluationRunStatus,
  ResumeEvaluationRunType
} from "@prisma/client";
import type { EvaluationProviderMetadata } from "@/lib/evaluation/provider-interface";
import type { DetailedScreeningCompatibilityStatus } from "@/lib/resume-screening/detailed-screening-contract";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { EvaluationRunFailureReason } from "@/types/evaluation-run-lifecycle";
import type {
  AnyDetailedScreeningResult,
  QuickScreeningResult,
  ScreeningRecommendation
} from "@/types/resume-screening";

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

export type QuickScreeningResultDto = {
  recommendation: ScreeningRecommendation;
  score: number;
  summary: string;
  reasons: string[];
  risks: string[];
  evidence: string[];
  nextStep: string;
};

export type QuickScreeningRunDto = {
  run: ResumeEvaluationRunDto;
  screeningResult: QuickScreeningResult;
  result: QuickScreeningResultDto;
};

export type DetailedAnalysisRunFailureReason =
  | EvaluationRunFailureReason
  | "CONFIG_ERROR"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "NOT_FOUND";

export type DetailedAnalysisRunSuccessDto = {
  success: true;
  evaluationId: string;
  runId: string;
  mode: "DETAILED";
  status: ResumeEvaluationRunStatus;
  provider: string | null;
  model: string | null;
  createdAt: string;
  completedAt: string | null;
  run: ResumeEvaluationRunDto;
  screeningResult: AnyDetailedScreeningResult;
  compatibilityStatus?: Exclude<DetailedScreeningCompatibilityStatus, "INVALID">;
  result: ResumeEvaluationResult;
  metadata: EvaluationProviderMetadata;
};

export type DetailedAnalysisRunFailureDto = {
  success: false;
  evaluationId?: string;
  runId?: string;
  failureReason: DetailedAnalysisRunFailureReason;
  error: string;
  metadata?: EvaluationProviderMetadata;
};

export type DetailedAnalysisRunDto =
  | DetailedAnalysisRunSuccessDto
  | DetailedAnalysisRunFailureDto;

/**
 * Actions taken on immutable Detailed Analysis output. These are deliberately
 * separate from ResumeReviewerDecision, which remains the final human
 * evaluation decision on the evaluation master.
 */
export type DetailedAnalysisReviewAction =
  | "ACCEPTED_AS_REFERENCE"
  | "NEEDS_REVISION"
  | "REJECTED";

export type DetailedAnalysisReviewInput = {
  decision: DetailedAnalysisReviewAction;
  expectedRevision: number;
  note?: string | null;
  reviewer: string;
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
    parsedOutputJson: true;
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
