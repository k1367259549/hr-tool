import type {
  ApplicationEvent,
  ApplicationEventType,
  ApplicationStage,
  CandidateApplication,
  Prisma
} from "@prisma/client";

export type {
  ApplicationEvent,
  ApplicationEventType,
  ApplicationStage,
  CandidateApplication
};

export type ApplicationCreateInput = {
  candidateId: string;
  jobProfileId: string;
  owner?: string | null;
  sourceChannel?: string | null;
  notes?: string | null;
};

export type ApplicationUpdateInput = {
  owner?: string | null;
  sourceChannel?: string | null;
  notes?: string | null;
};

export type ApplicationTransitionInput = {
  toStage: ApplicationStage;
  note?: string | null;
};

export type ApplicationListQuery = {
  search?: string;
  stage?: ApplicationStage;
  jobProfileId?: string;
  candidateId?: string;
  owner?: string;
  status: "open" | "closed" | "all";
  page: number;
  pageSize: number;
};

export type ApplicationCandidateSummaryDto = {
  id: string;
  fullName: string;
  status: string;
  owner: string | null;
  sourceChannel: string | null;
};

export type ApplicationJobProfileSummaryDto = {
  id: string;
  jobTitle: string;
  hiringGoal: string | null;
  reviewedAt: string | null;
};

export type ApplicationEventDto = {
  id: string;
  applicationId: string;
  eventType: ApplicationEventType;
  actor: string | null;
  fromStage: ApplicationStage | null;
  toStage: ApplicationStage | null;
  note: string | null;
  createdAt: string;
};

export type CandidateApplicationListItemDto = {
  id: string;
  candidateId: string;
  jobProfileId: string;
  currentStage: ApplicationStage;
  owner: string | null;
  sourceChannel: string | null;
  latestActivityAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  candidate: ApplicationCandidateSummaryDto;
  jobProfile: ApplicationJobProfileSummaryDto;
};

export type CandidateApplicationDetailDto = CandidateApplicationListItemDto & {
  notes: string | null;
  events: ApplicationEventDto[];
};

export type ApplicationMetricsDto = Record<ApplicationStage, number>;

export type ApplicationListResultDto = {
  applications: CandidateApplicationListItemDto[];
  metrics: ApplicationMetricsDto;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ApplicationListRecord = Prisma.CandidateApplicationGetPayload<{
  include: {
    candidate: {
      select: {
        id: true;
        fullName: true;
        status: true;
        owner: true;
        sourceChannel: true;
      };
    };
    jobProfile: {
      select: {
        id: true;
        jobTitle: true;
        hiringGoal: true;
        reviewedAt: true;
      };
    };
  };
}>;

export type ApplicationDetailRecord = Prisma.CandidateApplicationGetPayload<{
  include: {
    candidate: {
      select: {
        id: true;
        fullName: true;
        status: true;
        owner: true;
        sourceChannel: true;
      };
    };
    events: {
      orderBy: {
        createdAt: "desc";
      };
    };
    jobProfile: {
      select: {
        id: true;
        jobTitle: true;
        hiringGoal: true;
        reviewedAt: true;
      };
    };
  };
}>;

export type ApplicationRepositoryListResult = {
  applications: ApplicationListRecord[];
  total: number;
};

export type ApplicationEventCreateInput = {
  applicationId: string;
  eventType: ApplicationEventType;
  actor?: string | null;
  fromStage?: ApplicationStage | null;
  toStage?: ApplicationStage | null;
  note?: string | null;
};
