import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import type {
  ResumeDetailDto,
  ResumeDetailRecord,
  ResumeDuplicateRecord,
  ResumeListItemDto,
  ResumeListQuery,
  ResumeListRecord,
  ResumeListResultDto,
  ResumeMetadataUpdateInput,
  ResumeUploadResultDto,
  ResumeLibraryUploadInput
} from "@/types/resumeLibrary";
import { createSemanticChunks, createStructureChunks } from "@/utils/resumeChunking";
import { generateResumeContentHash } from "@/utils/resumeContentHash";
import { parseResumeFile, ResumeParserError } from "@/utils/resumeParser";
import { validateResumeFile } from "@/utils/resumeLibraryValidation";

const resumeVersion = "resume-parser-v1";
const parserVersion = "v1";

export class ResumeLibraryServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

  constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND", message: string) {
    super(message);
    this.name = "ResumeLibraryServiceError";
    this.code = code;
  }
}

export const resumeLibraryService = {
  async uploadResume(input: ResumeLibraryUploadInput): Promise<ResumeUploadResultDto> {
    const fileType = validateResumeFile(input.file);
    const originalFile = new Uint8Array(await input.file.arrayBuffer());
    const workflowId = randomUUID();

    try {
      const parsedResume = await parseResumeFile(input.file);
      const contentHash = generateResumeContentHash(parsedResume.parsedText);
      const structureChunks = createStructureChunks(parsedResume.parsedText);
      const semanticChunks = createSemanticChunks(structureChunks);
      const resume = await candidateResumeRepository.createResume({
        candidateId: null,
        candidateSource: input.candidateSource,
        contentHash,
        fileName: parsedResume.fileName,
        fileSize: parsedResume.fileSize,
        fileType,
        intakeSource: "upload",
        jobProfileId: null,
        language: null,
        notes: input.notes,
        originalFile,
        parserVersion,
        parsedText: parsedResume.parsedText,
        parsingError: null,
        parsingStatus: "PARSED",
        resumeVersion,
        semanticChunks: semanticChunks as unknown as Prisma.InputJsonValue,
        structureChunks: structureChunks as unknown as Prisma.InputJsonValue,
        workflowId
      });

      return resumeLibraryService.getUploadResult(resume.id);
    } catch (error) {
      if (error instanceof ResumeParserError && error.code === "RESUME_PARSE_ERROR") {
        const resume = await candidateResumeRepository.createResume({
          candidateId: null,
          candidateSource: input.candidateSource,
          contentHash: null,
          fileName: input.file.name,
          fileSize: input.file.size,
          fileType,
          intakeSource: "upload",
          jobProfileId: null,
          language: null,
          notes: input.notes,
          originalFile,
          parserVersion,
          parsedText: null,
          parsingError: error.message,
          parsingStatus: "FAILED",
          resumeVersion,
          semanticChunks: [],
          structureChunks: [],
          workflowId
        });

        return resumeLibraryService.getUploadResult(resume.id);
      }

      if (error instanceof ResumeParserError) {
        throw new ResumeLibraryServiceError("VALIDATION_ERROR", error.message);
      }

      throw normalizeResumeLibraryError(error, "上传简历失败。");
    }
  },

  async getUploadResult(resumeId: string): Promise<ResumeUploadResultDto> {
    const resume = await this.getResume(resumeId);

    return {
      duplicateSignal: resume.duplicateSignal,
      resume
    };
  },

  async listResumes(query: ResumeListQuery): Promise<ResumeListResultDto> {
    try {
      const result = await candidateResumeRepository.findResumeList(query);
      const items = await Promise.all(result.resumes.map(toResumeListItemDto));

      return {
        items,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / query.pageSize))
        }
      };
    } catch (error) {
      throw normalizeResumeLibraryError(error, "查询简历库失败。");
    }
  },

  async getResume(id: string): Promise<ResumeDetailDto> {
    try {
      const resume = await candidateResumeRepository.findResumeDetailById(id);

      if (!resume) {
        throw new ResumeLibraryServiceError("NOT_FOUND", "简历不存在。");
      }

      return toResumeDetailDto(resume);
    } catch (error) {
      throw normalizeResumeLibraryError(error, "读取简历详情失败。");
    }
  },

  async updateResumeMetadata(
    id: string,
    input: ResumeMetadataUpdateInput
  ): Promise<ResumeDetailDto> {
    try {
      const existing = await candidateResumeRepository.findResumeDetailById(id);

      if (!existing) {
        throw new ResumeLibraryServiceError("NOT_FOUND", "简历不存在。");
      }

      if (!hasMetadataChanges(existing, input)) {
        return toResumeDetailDto(existing);
      }

      const updated = await candidateResumeRepository.updateResumeMetadata(id, input);

      return toResumeDetailDto(updated);
    } catch (error) {
      throw normalizeResumeLibraryError(error, "更新简历元数据失败。");
    }
  }
};

async function toResumeListItemDto(resume: ResumeListRecord): Promise<ResumeListItemDto> {
  const duplicateCount = resume.contentHash
    ? await candidateResumeRepository.countOtherResumesByHash(resume.contentHash, resume.id)
    : 0;

  return {
    candidateId: resume.candidateId,
    candidateName: resume.candidate?.fullName ?? null,
    candidateSource: resume.candidateSource,
    createdAt: resume.createdAt.toISOString(),
    duplicateCount,
    fileName: resume.fileName,
    fileSize: resume.fileSize,
    fileType: resume.fileType,
    hasContentHash: Boolean(resume.contentHash),
    id: resume.id,
    intakeSource: resume.intakeSource,
    language: resume.language,
    jobProfileId: resume.jobProfileId,
    jobProfileTitle: resume.jobProfile?.jobTitle ?? null,
    parserVersion: resume.parserVersion,
    parsingStatus: resume.parsingStatus,
    updatedAt: resume.updatedAt.toISOString()
  };
}

async function toResumeDetailDto(resume: ResumeDetailRecord): Promise<ResumeDetailDto> {
  const duplicateCount = resume.contentHash
    ? await candidateResumeRepository.countOtherResumesByHash(resume.contentHash, resume.id)
    : 0;
  const possibleDuplicates = resume.contentHash
    ? await candidateResumeRepository.listPossibleDuplicates(resume.contentHash, resume.id, 5)
    : [];
  const listItem = await toResumeListItemDto(resume);

  return {
    ...listItem,
    candidate: resume.candidate
      ? {
          fullName: resume.candidate.fullName,
          id: resume.candidate.id,
          owner: resume.candidate.owner,
          sourceChannel: resume.candidate.sourceChannel,
          status: resume.candidate.status
        }
      : null,
    duplicateSignal: {
      duplicateCount,
      hasDuplicates: duplicateCount > 0
    },
    jobProfile: resume.jobProfile
      ? {
          hiringGoal: resume.jobProfile.hiringGoal,
          id: resume.jobProfile.id,
          jobTitle: resume.jobProfile.jobTitle,
          reviewedAt: resume.jobProfile.reviewedAt?.toISOString() ?? null
        }
      : null,
    notes: resume.notes,
    parsedText: resume.parsedText,
    parsingError: sanitizeParsingError(resume.parsingError),
    possibleDuplicates: possibleDuplicates.map(toDuplicateSummaryDto),
    semanticChunkCount: countJsonArrayItems(resume.semanticChunks),
    structureChunkCount: countJsonArrayItems(resume.structureChunks)
  };
}

function toDuplicateSummaryDto(resume: ResumeDuplicateRecord) {
  return {
    candidateName: resume.candidate?.fullName ?? null,
    createdAt: resume.createdAt.toISOString(),
    fileName: resume.fileName,
    fileSize: resume.fileSize,
    fileType: resume.fileType,
    id: resume.id,
    parsingStatus: resume.parsingStatus
  };
}

function countJsonArrayItems(value: Prisma.JsonValue): number {
  return Array.isArray(value) ? value.length : 0;
}

function sanitizeParsingError(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.replace(/\s+at\s[\s\S]+/g, "").trim();
}

function hasMetadataChanges(
  existing: ResumeDetailRecord,
  input: ResumeMetadataUpdateInput
): boolean {
  return (["candidateSource", "notes"] as const).some((field) => {
    if (!(field in input)) {
      return false;
    }

    return existing[field] !== input[field];
  });
}

function normalizeResumeLibraryError(
  error: unknown,
  fallbackMessage: string
): ResumeLibraryServiceError {
  if (error instanceof ResumeLibraryServiceError) {
    return error;
  }

  return new ResumeLibraryServiceError("DATABASE_ERROR", fallbackMessage);
}
