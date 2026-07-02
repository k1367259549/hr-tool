import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateResume, ResumeSemanticChunk, ResumeStructureChunk } from "@/types/candidateUnderstanding";

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
  }
};
