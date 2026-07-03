import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type { CandidateResume, ResumeSemanticChunk, ResumeStructureChunk } from "@/types/candidateUnderstanding";
import type {
  AvailableResumeListResult,
  AvailableResumeQuery,
  SafeCandidateResume
} from "@/types/candidateResumeLink";
import type {
  ResumeCreateData,
  ResumeDetailRecord,
  ResumeDuplicateRecord,
  ResumeInternalRecord,
  ResumeListQuery,
  ResumeRepositoryListResult,
  ResumeMetadataUpdateInput
} from "@/types/resumeLibrary";

type CandidateResumeCreateInput = {
  workflowId: string;
  jobProfileId?: string | null;
  candidateId?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  originalFile: Uint8Array<ArrayBuffer>;
  parsedText?: string;
  parsingStatus: string;
  parsingError?: string;
  structureChunks: ResumeStructureChunk[];
  semanticChunks: ResumeSemanticChunk[];
  resumeVersion: string;
  candidateSource?: string;
  notes?: string;
  intakeSource?: "RESUME_LIBRARY" | "CANDIDATE_UNDERSTANDING";
  contentHash?: string | null;
};

const safeResumeSelect = {
  candidateId: true,
  createdAt: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  id: true,
  intakeSource: true,
  parsingStatus: true
} satisfies Prisma.CandidateResumeSelect;

const resumeListSelect = {
  candidate: {
    select: {
      fullName: true,
      id: true
    }
  },
  candidateId: true,
  candidateSource: true,
  contentHash: true,
  createdAt: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  id: true,
  intakeSource: true,
  jobProfile: {
    select: {
      id: true,
      jobTitle: true
    }
  },
  jobProfileId: true,
  parsingStatus: true,
  updatedAt: true
} satisfies Prisma.CandidateResumeSelect;

const resumeDetailSelect = {
  ...resumeListSelect,
  candidate: {
    select: {
      fullName: true,
      id: true,
      owner: true,
      sourceChannel: true,
      status: true
    }
  },
  jobProfile: {
    select: {
      hiringGoal: true,
      id: true,
      jobTitle: true,
      reviewedAt: true
    }
  },
  notes: true,
  parsedText: true,
  parsingError: true,
  semanticChunks: true,
  structureChunks: true
} satisfies Prisma.CandidateResumeSelect;

const resumeInternalSelect = {
  fileName: true,
  fileSize: true,
  fileType: true,
  id: true,
  originalFile: true,
  parsingStatus: true
} satisfies Prisma.CandidateResumeSelect;

const duplicateResumeSelect = {
  candidate: {
    select: {
      fullName: true
    }
  },
  createdAt: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  id: true,
  parsingStatus: true
} satisfies Prisma.CandidateResumeSelect;

type SafeCandidateResumeRecord = Prisma.CandidateResumeGetPayload<{
  select: typeof safeResumeSelect;
}>;

export const candidateResumeRepository = {
  async create(data: CandidateResumeCreateInput): Promise<CandidateResume> {
    return this.createResume({
      candidateId: data.candidateId,
      candidateSource: data.candidateSource,
      contentHash: data.contentHash,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType as ResumeCreateData["fileType"],
      intakeSource: data.intakeSource ?? "CANDIDATE_UNDERSTANDING",
      jobProfileId: data.jobProfileId,
      notes: data.notes,
      originalFile: data.originalFile,
      parsedText: data.parsedText,
      parsingError: data.parsingError,
      parsingStatus: data.parsingStatus as ResumeCreateData["parsingStatus"],
      resumeVersion: data.resumeVersion,
      semanticChunks: data.semanticChunks as unknown as Prisma.InputJsonValue,
      structureChunks: data.structureChunks as unknown as Prisma.InputJsonValue,
      workflowId: data.workflowId
    });
  },

  async createResume(data: ResumeCreateData, client: CandidateDbClient = prisma): Promise<CandidateResume> {
    return client.candidateResume.create({
      data: {
        candidateId: data.candidateId,
        candidateSource: data.candidateSource,
        contentHash: data.contentHash,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        intakeSource: data.intakeSource,
        jobProfileId: data.jobProfileId,
        notes: data.notes,
        originalFile: data.originalFile,
        parsedText: data.parsedText,
        parsingError: data.parsingError,
        parsingStatus: data.parsingStatus,
        resumeVersion: data.resumeVersion,
        semanticChunks: data.semanticChunks,
        structureChunks: data.structureChunks,
        workflowId: data.workflowId
      }
    });
  },

  async findById(id: string): Promise<CandidateResume | null> {
    return prisma.candidateResume.findUnique({
      where: {
        id
      }
    });
  },

  async findResumeById(
    resumeId: string,
    client: CandidateDbClient = prisma
  ): Promise<SafeCandidateResume | null> {
    const resume = await client.candidateResume.findUnique({
      select: safeResumeSelect,
      where: {
        id: resumeId
      }
    });

    return resume ? toSafeCandidateResume(resume) : null;
  },

  async findResumeList(query: ResumeListQuery): Promise<ResumeRepositoryListResult> {
    const where = createResumeLibraryWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [resumes, total] = await prisma.$transaction([
      prisma.candidateResume.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "asc"
          }
        ],
        select: resumeListSelect,
        skip,
        take: query.pageSize,
        where
      }),
      prisma.candidateResume.count({
        where
      })
    ]);

    return {
      resumes,
      total
    };
  },

  async countResumes(query: ResumeListQuery): Promise<number> {
    return prisma.candidateResume.count({
      where: createResumeLibraryWhere(query)
    });
  },

  async findResumeDetailById(id: string): Promise<ResumeDetailRecord | null> {
    return prisma.candidateResume.findUnique({
      select: resumeDetailSelect,
      where: {
        id
      }
    });
  },

  async findInternalResumeById(id: string): Promise<ResumeInternalRecord | null> {
    return prisma.candidateResume.findUnique({
      select: resumeInternalSelect,
      where: {
        id
      }
    });
  },

  async updateResumeMetadata(
    id: string,
    data: ResumeMetadataUpdateInput
  ): Promise<ResumeDetailRecord> {
    return prisma.candidateResume.update({
      data: {
        candidateSource: data.candidateSource,
        notes: data.notes
      },
      select: resumeDetailSelect,
      where: {
        id
      }
    });
  },

  async countOtherResumesByHash(contentHash: string, excludeResumeId?: string): Promise<number> {
    return prisma.candidateResume.count({
      where: {
        contentHash,
        id: excludeResumeId
          ? {
              not: excludeResumeId
            }
          : undefined
      }
    });
  },

  async listPossibleDuplicates(
    contentHash: string,
    excludeResumeId: string,
    take = 5
  ): Promise<ResumeDuplicateRecord[]> {
    return prisma.candidateResume.findMany({
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ],
      select: duplicateResumeSelect,
      take,
      where: {
        contentHash,
        id: {
          not: excludeResumeId
        }
      }
    });
  },

  async listAvailableResumes(query: AvailableResumeQuery): Promise<AvailableResumeListResult> {
    const where = createAvailableResumeWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [resumes, total] = await prisma.$transaction([
      prisma.candidateResume.findMany({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "asc"
          }
        ],
        select: safeResumeSelect,
        skip,
        take: query.pageSize,
        where
      }),
      prisma.candidateResume.count({
        where
      })
    ]);

    return {
      resumes: resumes.map(toSafeCandidateResume),
      total
    };
  },

  async listCandidateResumes(
    candidateId: string,
    client: CandidateDbClient = prisma
  ): Promise<SafeCandidateResume[]> {
    const resumes = await client.candidateResume.findMany({
      orderBy: [
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ],
      select: safeResumeSelect,
      where: {
        candidateId
      }
    });

    return resumes.map(toSafeCandidateResume);
  },

  async linkResumeToCandidate(
    resumeId: string,
    candidateId: string,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.candidateResume.updateMany({
      data: {
        candidateId
      },
      where: {
        candidateId: null,
        id: resumeId
      }
    });

    return result.count;
  },

  async unlinkResumeFromCandidate(
    resumeId: string,
    candidateId: string,
    client: CandidateDbClient = prisma
  ): Promise<number> {
    const result = await client.candidateResume.updateMany({
      data: {
        candidateId: null
      },
      where: {
        candidateId,
        id: resumeId
      }
    });

    return result.count;
  }
};

function createAvailableResumeWhere(query: AvailableResumeQuery): Prisma.CandidateResumeWhereInput {
  const where: Prisma.CandidateResumeWhereInput = {
    candidateId: null
  };

  if (query.fileType) {
    where.fileType = {
      equals: query.fileType,
      mode: "insensitive"
    };
  }

  if (query.search) {
    where.fileName = {
      contains: query.search,
      mode: "insensitive"
    };
  }

  return where;
}

function createResumeLibraryWhere(query: ResumeListQuery): Prisma.CandidateResumeWhereInput {
  const where: Prisma.CandidateResumeWhereInput = {};

  if (query.fileType) {
    where.fileType = query.fileType;
  }

  if (query.parsingStatus) {
    where.parsingStatus = query.parsingStatus;
  }

  if (query.intakeSource) {
    where.intakeSource = query.intakeSource;
  }

  if (query.linkStatus === "linked") {
    where.candidateId = {
      not: null
    };
  }

  if (query.linkStatus === "unlinked") {
    where.candidateId = null;
  }

  if (query.search) {
    const stringFilter = {
      contains: query.search,
      mode: "insensitive"
    } satisfies Prisma.StringFilter<"CandidateResume">;

    where.OR = [
      {
        fileName: stringFilter
      },
      {
        candidateSource: stringFilter
      },
      {
        candidate: {
          fullName: {
            contains: query.search,
            mode: "insensitive"
          }
        }
      },
      {
        jobProfile: {
          jobTitle: {
            contains: query.search,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  return where;
}

function toSafeCandidateResume(resume: SafeCandidateResumeRecord): SafeCandidateResume {
  return {
    candidateId: resume.candidateId,
    createdAt: resume.createdAt,
    fileSize: resume.fileSize,
    fileType: resume.fileType,
    id: resume.id,
    intakeSource: resume.intakeSource,
    originalName: resume.fileName,
    parsingStatus: resume.parsingStatus
  };
}
