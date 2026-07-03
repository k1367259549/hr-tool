import type { Prisma } from "@prisma/client";

export type SafeCandidateResume = {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  parsingStatus: string;
  intakeSource: string;
  createdAt: Date;
  candidateId: string | null;
};

export type SafeCandidateResumeDto = {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  parsingStatus: string;
  intakeSource: string;
  createdAt: string;
  candidateId: string | null;
};

export type AvailableResumeQuery = {
  search?: string;
  fileType?: string;
  page: number;
  pageSize: number;
};

export type AvailableResumeListResult = {
  resumes: SafeCandidateResume[];
  total: number;
};

export type AvailableResumeListDto = {
  resumes: SafeCandidateResumeDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type LinkResumeInput = {
  resumeId: string;
};

export type CandidateResumeLinkAuditValue = Prisma.InputJsonObject & {
  resumeId: string;
  originalName: string;
  fileType: string;
};
