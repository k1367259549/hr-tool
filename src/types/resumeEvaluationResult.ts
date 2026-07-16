import type {
  Prisma,
  ResumeEvaluationEventType,
  ResumeEvaluationStatus,
  ResumeReviewerDecision
} from "@prisma/client";
import type { ScreeningEvidence } from "@/types/resume-screening";

export type {
  ResumeEvaluationStatus,
  ResumeEvaluationEventType,
  ResumeReviewerDecision
};

export type CriterionEvidenceAssessment =
  | "NOT_ASSESSED"
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "NOT_SUPPORTED"
  | "NOT_APPLICABLE";

export type ResumeCriterionResult = {
  criterionKey: string;
  assessment: CriterionEvidenceAssessment;
  evidenceNotes: string[];
  recruiterNote?: string;
};

export type ResumeEvaluationCreateInput = {
  resumeId: string;
  resumeRevisionId?: string | null;
  parsedSnapshotId?: string | null;
  jobProfileId: string;
  templateVersionId: string;
  evaluatedBy?: string | null;
};

export type ResumeEvaluationUpdateInput = {
  criterionResults?: ResumeCriterionResult[];
  overallNote?: string | null;
  evaluatedBy?: string | null;
  expectedRevision: number;
};

export type ResumeEvaluationReviewInput = {
  expectedRevision: number;
  actor?: string | null;
};

export type ResumeEvaluationSubmitReviewInput = {
  reviewerDecision: ResumeReviewerDecision;
  reviewerNotes?: string | null;
  manualReviewWithoutRunBasis?: boolean;
  actor?: string | null;
};

export type ResumeEvaluationReopenInput = {
  expectedRevision: number;
  actor?: string | null;
  note: string;
};

export type ResumeEvaluationListQuery = {
  resumeId?: string;
  jobProfileId?: string;
  templateVersionId?: string;
  status?: ResumeEvaluationStatus;
  page: number;
  pageSize: number;
};

export type ResumeEvaluationSummaryDto = {
  id: string;
  resumeId: string;
  resumeRevisionId: string | null;
  parsedSnapshotId: string | null;
  selectedRunId: string | null;
  reviewedRunId: string | null;
  jobProfileId: string;
  templateVersionId: string;
  jobProfileVersion: string;
  status: ResumeEvaluationStatus;
  revision: number;
  overallNote: string | null;
  evaluatedBy: string | null;
  reviewerDecision: ResumeReviewerDecision | null;
  reviewerNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResumeEvaluationCriterionResultDto = {
  criterionKey: string;
  assessment: CriterionEvidenceAssessment;
  evidenceNotes: string[];
  recruiterNote: string | null;
};

export type CriterionAiReferenceStatus = "AVAILABLE" | "UNAVAILABLE" | "INVALID";

export type CriterionAiReferenceDto = {
  criterionKey: string;
  criterionLabel: string;
  status: CriterionAiReferenceStatus;
  score: number;
  conclusion: string;
  evidence: ScreeningEvidence[];
  risks: string[];
  missingInformation: string[];
  interviewQuestions: string[];
};

export type EvaluationAiReferenceStatus =
  | "NO_SELECTED_RUN"
  | "AVAILABLE"
  | "LEGACY_SELECTED_RUN"
  | "INVALID_SELECTED_RUN"
  | "RUN_NOT_FOUND"
  | "RUN_CONTEXT_MISMATCH"
  | "RUN_NOT_DETAILED"
  | "RUN_NOT_COMPLETED";

export type EvaluationAiReferenceDto = {
  status: EvaluationAiReferenceStatus;
  criterionReferences: CriterionAiReferenceDto[];
  warning: string | null;
  selectedRunSummary: {
    provider: string | null;
    model: string | null;
    completedAt: string | null;
    reviewer: string | null;
    reviewedAt: string | null;
    reviewerNote: string | null;
    contractVersion: "detailed-screening.v2" | null;
  } | null;
};

export type ResumeEvaluationDetailDto = ResumeEvaluationSummaryDto & {
  aiReference?: EvaluationAiReferenceDto;
  criterionResults: ResumeEvaluationCriterionResultDto[];
  events: ResumeEvaluationEventDto[];
};

export type ResumeEvaluationEventDto = {
  id: string;
  evaluationId: string;
  eventType: ResumeEvaluationEventType;
  actor: string | null;
  changedFields: string[];
  note: string | null;
  createdAt: string;
};

export type ResumeEvaluationListResultDto = {
  items: ResumeEvaluationSummaryDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ResumeEvaluationOptionJobProfileDto = {
  id: string;
  jobTitle: string;
  reviewedAt: string | null;
};

export type ResumeEvaluationOptionTemplateVersionDto = {
  id: string;
  templateId: string;
  templateName: string;
  versionNumber: number;
  status: string;
};

export type ResumeEvaluationOptionsDto = {
  jobProfiles: ResumeEvaluationOptionJobProfileDto[];
  templateVersions: ResumeEvaluationOptionTemplateVersionDto[];
};

export type ResumeEvaluationResultRecord = Prisma.ResumeEvaluationResultGetPayload<{
  include: Record<string, never>;
}>;

export type ResumeEvaluationResultDetailRecord = Prisma.ResumeEvaluationResultGetPayload<{
  include: {
    events: {
      orderBy: [{ createdAt: "desc" }, { id: "asc" }];
    };
  };
}>;

export type ResumeEvaluationRepositoryListResult = {
  evaluations: ResumeEvaluationResultRecord[];
  total: number;
};
