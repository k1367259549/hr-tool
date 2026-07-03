import type {
  EvaluationTemplateStatus,
  EvaluationTemplateVersionStatus,
  Prisma
} from "@prisma/client";

export type {
  EvaluationTemplateStatus,
  EvaluationTemplateVersionStatus
};

export type EvaluationCriterionImportance = "REQUIRED" | "PREFERRED" | "CONTEXTUAL";

export type EvaluationCriterion = {
  key: string;
  label: string;
  description: string;
  importance: EvaluationCriterionImportance;
  evidenceGuidance?: string;
};

export type EvaluationTemplateCreateInput = {
  name: string;
  description?: string | null;
};

export type EvaluationTemplateUpdateInput = {
  name?: string;
  description?: string | null;
};

export type EvaluationTemplateListQuery = {
  search?: string;
  status?: EvaluationTemplateStatus;
  page: number;
  pageSize: number;
};

export type EvaluationTemplateVersionUpdateInput = {
  criteria?: EvaluationCriterion[];
  instructions?: string | null;
  changeNote?: string | null;
  createdBy?: string | null;
};

export type EvaluationTemplateAssignmentInput = {
  templateVersionId: string;
  assignedBy?: string | null;
};

export type EvaluationTemplateSummaryDto = {
  id: string;
  name: string;
  description: string | null;
  status: EvaluationTemplateStatus;
  latestVersionNumber: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeAssignmentCount: number;
  currentDraftVersion: EvaluationTemplateVersionSummaryDto | null;
  latestPublishedVersion: EvaluationTemplateVersionSummaryDto | null;
};

export type EvaluationTemplateVersionSummaryDto = {
  id: string;
  templateId: string;
  versionNumber: number;
  status: EvaluationTemplateVersionStatus;
  criteria: EvaluationCriterion[];
  instructions: string | null;
  changeNote: string | null;
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EvaluationTemplateDetailDto = EvaluationTemplateSummaryDto & {
  versions: EvaluationTemplateVersionSummaryDto[];
};

export type EvaluationTemplateListResultDto = {
  items: EvaluationTemplateSummaryDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type JobProfileEvaluationAssignmentDto = {
  id: string;
  jobProfileId: string;
  templateVersionId: string;
  assignedBy: string | null;
  assignedAt: string;
  endedAt: string | null;
  templateVersion: EvaluationTemplateVersionSummaryDto;
  template: {
    id: string;
    name: string;
    status: EvaluationTemplateStatus;
  };
};

export type JobProfileEvaluationAssignmentResultDto = {
  activeAssignment: JobProfileEvaluationAssignmentDto | null;
  history: JobProfileEvaluationAssignmentDto[];
};

export type EvaluationTemplateListRecord = Prisma.EvaluationTemplateGetPayload<{
  include: {
    versions: {
      orderBy: [
        {
          versionNumber: "desc";
        }
      ];
    };
    _count: {
      select: {
        versions: true;
      };
    };
  };
}>;

export type EvaluationTemplateDetailRecord = Prisma.EvaluationTemplateGetPayload<{
  include: {
    versions: {
      orderBy: [
        {
          versionNumber: "desc";
        }
      ];
    };
  };
}>;

export type EvaluationTemplateVersionRecord = Prisma.EvaluationTemplateVersionGetPayload<{
  include: {
    template: true;
  };
}>;

export type JobProfileEvaluationAssignmentRecord =
  Prisma.JobProfileEvaluationAssignmentGetPayload<{
    include: {
      templateVersion: {
        include: {
          template: true;
        };
      };
    };
  }>;

export type EvaluationTemplateRepositoryListResult = {
  templates: EvaluationTemplateListRecord[];
  total: number;
};
