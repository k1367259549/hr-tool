import type { Prisma, ResumeEvaluationEventType, ResumeEvaluationStatus } from "@prisma/client";

export type { ResumeEvaluationStatus, ResumeEvaluationEventType };

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
  jobProfileId: string;
  templateVersionId: string;
  jobProfileVersion: string;
  status: ResumeEvaluationStatus;
  revision: number;
  overallNote: string | null;
  evaluatedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResumeEvaluationCriterionResultDto = {
  criterionKey: string;
  assessment: CriterionEvidenceAssessment;
  evidenceNotes: string[];
  recruiterNote: string | null;
};

export type ResumeEvaluationDetailDto = ResumeEvaluationSummaryDto & {
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
