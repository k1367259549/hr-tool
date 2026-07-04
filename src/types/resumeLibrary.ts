import type { Prisma } from "@prisma/client";

export type ResumeFileType = "PDF" | "DOCX" | "TXT";
export type ResumeParsingStatus = "PARSED" | "FAILED";
export type ResumeLinkStatus = "linked" | "unlinked" | "all";
export type ResumeIntakeSource = string;

export type ResumeListQuery = {
  search?: string;
  fileType?: ResumeFileType;
  parsingStatus?: ResumeParsingStatus;
  intakeSource?: ResumeIntakeSource;
  linkStatus: ResumeLinkStatus;
  page: number;
  pageSize: number;
};

export type ResumeMetadataUpdateInput = {
  candidateSource?: string | null;
  notes?: string | null;
};

export type ResumeLibraryUploadInput = {
  file: File;
  candidateSource?: string | null;
  notes?: string | null;
};

export type ResumeCandidateSummaryDto = {
  id: string;
  fullName: string;
  status: string;
  owner: string | null;
  sourceChannel: string | null;
};

export type ResumeJobProfileSummaryDto = {
  id: string;
  jobTitle: string;
  hiringGoal: string | null;
  reviewedAt: string | null;
};

export type ResumeDuplicateSignalDto = {
  hasDuplicates: boolean;
  duplicateCount: number;
};

export type ResumeDuplicateSummaryDto = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  parsingStatus: string;
  candidateName: string | null;
  createdAt: string;
};

export type ResumeListItemDto = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  parsingStatus: string;
  candidateSource: string | null;
  intakeSource: ResumeIntakeSource | null;
  language: string | null;
  parserVersion: string | null;
  hasContentHash: boolean;
  duplicateCount: number;
  candidateId: string | null;
  candidateName: string | null;
  jobProfileId: string | null;
  jobProfileTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResumeDetailDto = ResumeListItemDto & {
  notes: string | null;
  parsedText: string | null;
  parsingError: string | null;
  structureChunkCount: number;
  semanticChunkCount: number;
  candidate: ResumeCandidateSummaryDto | null;
  jobProfile: ResumeJobProfileSummaryDto | null;
  duplicateSignal: ResumeDuplicateSignalDto;
  possibleDuplicates: ResumeDuplicateSummaryDto[];
};

export type ResumeUploadResultDto = {
  resume: ResumeDetailDto;
  duplicateSignal: ResumeDuplicateSignalDto;
};

export type ResumeListResultDto = {
  items: ResumeListItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ResumeCreateData = {
  workflowId: string;
  jobProfileId?: string | null;
  candidateId?: string | null;
  fileName: string;
  fileType: ResumeFileType;
  fileSize: number;
  originalFile: Uint8Array<ArrayBuffer>;
  parsedText?: string | null;
  parsingStatus: ResumeParsingStatus;
  parsingError?: string | null;
  structureChunks: Prisma.InputJsonValue;
  semanticChunks: Prisma.InputJsonValue;
  resumeVersion: string;
  candidateSource?: string | null;
  notes?: string | null;
  intakeSource?: ResumeIntakeSource | null;
  contentHash?: string | null;
  language?: string | null;
  parserVersion?: string | null;
};

export type ResumeRepositoryListResult = {
  resumes: ResumeListRecord[];
  total: number;
};

export type ResumeListRecord = Prisma.CandidateResumeGetPayload<{
  select: {
    id: true;
    fileName: true;
    fileType: true;
    fileSize: true;
    parsingStatus: true;
    candidateSource: true;
    intakeSource: true;
    language: true;
    parserVersion: true;
    contentHash: true;
    candidateId: true;
    candidate: {
      select: {
        id: true;
        fullName: true;
      };
    };
    jobProfileId: true;
    jobProfile: {
      select: {
        id: true;
        jobTitle: true;
      };
    };
    createdAt: true;
    updatedAt: true;
  };
}>;

export type ResumeDetailRecord = Prisma.CandidateResumeGetPayload<{
  select: {
    id: true;
    fileName: true;
    fileType: true;
    fileSize: true;
    parsedText: true;
    parsingStatus: true;
    parsingError: true;
    structureChunks: true;
    semanticChunks: true;
    candidateSource: true;
    notes: true;
    intakeSource: true;
    language: true;
    parserVersion: true;
    contentHash: true;
    candidateId: true;
    candidate: {
      select: {
        id: true;
        fullName: true;
        status: true;
        owner: true;
        sourceChannel: true;
      };
    };
    jobProfileId: true;
    jobProfile: {
      select: {
        id: true;
        jobTitle: true;
        hiringGoal: true;
        reviewedAt: true;
      };
    };
    createdAt: true;
    updatedAt: true;
  };
}>;

export type ResumeInternalRecord = Prisma.CandidateResumeGetPayload<{
  select: {
    id: true;
    originalFile: true;
    fileName: true;
    fileType: true;
    fileSize: true;
    parsingStatus: true;
  };
}>;

export type ResumeDuplicateRecord = Prisma.CandidateResumeGetPayload<{
  select: {
    id: true;
    fileName: true;
    fileType: true;
    fileSize: true;
    parsingStatus: true;
    createdAt: true;
    candidate: {
      select: {
        fullName: true;
      };
    };
  };
}>;
