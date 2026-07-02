import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import type { CandidateResume, ResumeSemanticChunk, ResumeStructureChunk } from "@/types/candidateUnderstanding";
import type {
  AvailableResumeListResult,
  AvailableResumeQuery,
  SafeCandidateResume
} from "@/types/candidateResumeLink";

type CandidateResumeCreateInput = {
  workflowId: string;
  jobProfileId: string;
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
};

const safeResumeSelect = {
  candidateId: true,
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
    return prisma.candidateResume.create({
      data: {
        candidateSource: data.candidateSource,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        jobProfileId: data.jobProfileId,
        notes: data.notes,
        originalFile: data.originalFile,
        parsedText: data.parsedText,
        parsingError: data.parsingError,
        parsingStatus: data.parsingStatus,
        resumeVersion: data.resumeVersion,
        semanticChunks: data.semanticChunks as unknown as Prisma.InputJsonValue,
        structureChunks: data.structureChunks as unknown as Prisma.InputJsonValue,
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

function toSafeCandidateResume(resume: SafeCandidateResumeRecord): SafeCandidateResume {
  return {
    candidateId: resume.candidateId,
    createdAt: resume.createdAt,
    fileSize: resume.fileSize,
    fileType: resume.fileType,
    id: resume.id,
    originalName: resume.fileName,
    parsingStatus: resume.parsingStatus
  };
}
