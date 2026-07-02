import type { Candidate, CandidateAudit, CandidateAuditAction, CandidateStatus, Prisma } from "@prisma/client";

export type {
  Candidate,
  CandidateAudit,
  CandidateAuditAction,
  CandidateStatus
};

export type CandidateCreateInput = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  currentCompany?: string | null;
  currentTitle?: string | null;
  targetRoles?: string[];
  sourceChannel?: string | null;
  owner?: string | null;
  tags?: string[];
  notes?: string | null;
  status?: Exclude<CandidateStatus, "ARCHIVED">;
};

export type CandidateUpdateInput = {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  currentCompany?: string | null;
  currentTitle?: string | null;
  targetRoles?: string[];
  sourceChannel?: string | null;
  owner?: string | null;
  tags?: string[];
  notes?: string | null;
  status?: Exclude<CandidateStatus, "ARCHIVED">;
};

export type CandidateListQuery = {
  search?: string;
  status?: CandidateStatus;
  sourceChannel?: string;
  owner?: string;
  page: number;
  pageSize: number;
};

export type CandidateCountsDto = {
  active: number;
  talentPool: number;
  archived: number;
  total: number;
};

export type CandidateListItemDto = {
  id: string;
  fullName: string;
  email: string | null;
  maskedEmail: string | null;
  phone: string | null;
  maskedPhone: string | null;
  currentCompany: string | null;
  currentTitle: string | null;
  targetRoles: string[];
  sourceChannel: string | null;
  owner: string | null;
  tags: string[];
  status: CandidateStatus;
  resumeCount: number;
  latestActivityAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateAuditDto = {
  id: string;
  candidateId: string;
  action: CandidateAuditAction;
  actor: string;
  beforeValue: Prisma.JsonValue | null;
  afterValue: Prisma.JsonValue | null;
  note: string | null;
  createdAt: string;
};

export type CandidateDto = CandidateListItemDto & {
  notes: string | null;
  audits: CandidateAuditDto[];
};

export type CandidateListResultDto = {
  candidates: CandidateListItemDto[];
  counts: CandidateCountsDto;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CandidateRepositoryListResult = {
  candidates: CandidateListRecord[];
  total: number;
};

export type CandidateListRecord = Prisma.CandidateGetPayload<{
  include: {
    _count: {
      select: {
        resumes: true;
      };
    };
  };
}>;

export type CandidateDetailRecord = Prisma.CandidateGetPayload<{
  include: {
    _count: {
      select: {
        resumes: true;
      };
    };
    audits: {
      orderBy: {
        createdAt: "desc";
      };
    };
  };
}>;

export type CandidateAuditCreateInput = {
  candidateId: string;
  action: CandidateAuditAction;
  actor: string;
  beforeValue?: Prisma.InputJsonValue | null;
  afterValue?: Prisma.InputJsonValue | null;
  note?: string | null;
};
