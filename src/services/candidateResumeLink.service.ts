import { prisma } from "@/lib/prisma";
import { candidateAuditRepository } from "@/repositories/candidateAudit.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import type { CandidateDbClient } from "@/repositories/candidate.repository";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import type {
  AvailableResumeListDto,
  AvailableResumeQuery,
  CandidateResumeLinkAuditValue,
  LinkResumeInput,
  SafeCandidateResume,
  SafeCandidateResumeDto
} from "@/types/candidateResumeLink";

const recruiterActor = "RECRUITER";

export class CandidateResumeLinkServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "CandidateResumeLinkServiceError";
    this.code = code;
  }
}

export const candidateResumeLinkService = {
  async listAvailableResumes(query: AvailableResumeQuery): Promise<AvailableResumeListDto> {
    try {
      const result = await candidateResumeRepository.listAvailableResumes(query);

      return {
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / query.pageSize))
        },
        resumes: result.resumes.map(toSafeCandidateResumeDto)
      };
    } catch (error) {
      throw normalizeCandidateResumeLinkError(error, "查询可关联简历失败。");
    }
  },

  async listCandidateResumes(candidateId: string): Promise<SafeCandidateResumeDto[]> {
    try {
      const candidate = await candidateRepository.findById(candidateId);

      if (!candidate) {
        throw new CandidateResumeLinkServiceError("NOT_FOUND", "候选人不存在。");
      }

      const resumes = await candidateResumeRepository.listCandidateResumes(candidateId);

      return resumes.map(toSafeCandidateResumeDto);
    } catch (error) {
      throw normalizeCandidateResumeLinkError(error, "查询候选人关联简历失败。");
    }
  },

  async linkResume(
    candidateId: string,
    input: LinkResumeInput
  ): Promise<SafeCandidateResumeDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const candidate = await candidateRepository.findById(candidateId, tx);

        if (!candidate) {
          throw new CandidateResumeLinkServiceError("NOT_FOUND", "候选人不存在。");
        }

        if (candidate.status === "ARCHIVED") {
          throw new CandidateResumeLinkServiceError("CONFLICT", "归档候选人不能新增简历关联。");
        }

        const resume = await candidateResumeRepository.findResumeById(input.resumeId, tx);

        if (!resume) {
          throw new CandidateResumeLinkServiceError("NOT_FOUND", "简历不存在。");
        }

        if (resume.candidateId === candidateId) {
          return toSafeCandidateResumeDto(resume);
        }

        if (resume.candidateId) {
          throw new CandidateResumeLinkServiceError(
            "CONFLICT",
            "该简历已关联其他候选人，请先人工解除旧关联。"
          );
        }

        const linkCount = await candidateResumeRepository.linkResumeToCandidate(
          resume.id,
          candidateId,
          tx
        );

        if (linkCount === 0) {
          return handleLinkRace(candidateId, resume.id, tx);
        }

        const refreshedResume = await candidateResumeRepository.findResumeById(resume.id, tx);

        if (!refreshedResume) {
          throw new CandidateResumeLinkServiceError("NOT_FOUND", "简历不存在。");
        }

        await candidateAuditRepository.create(
          {
            action: "RESUME_LINKED",
            actor: recruiterActor,
            afterValue: createResumeAuditValue(refreshedResume),
            candidateId
          },
          tx
        );

        return toSafeCandidateResumeDto(refreshedResume);
      });
    } catch (error) {
      throw normalizeCandidateResumeLinkError(error, "关联简历失败。");
    }
  },

  async unlinkResume(candidateId: string, resumeId: string): Promise<SafeCandidateResumeDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const candidate = await candidateRepository.findById(candidateId, tx);

        if (!candidate) {
          throw new CandidateResumeLinkServiceError("NOT_FOUND", "候选人不存在。");
        }

        const resume = await candidateResumeRepository.findResumeById(resumeId, tx);

        if (!resume) {
          throw new CandidateResumeLinkServiceError("NOT_FOUND", "简历不存在。");
        }

        if (resume.candidateId !== candidateId) {
          throw new CandidateResumeLinkServiceError(
            "CONFLICT",
            "该简历当前未关联到此候选人，无法解除。"
          );
        }

        const unlinkCount = await candidateResumeRepository.unlinkResumeFromCandidate(
          resume.id,
          candidateId,
          tx
        );

        if (unlinkCount === 0) {
          return handleUnlinkRace(candidateId, resume.id, tx);
        }

        const refreshedResume = await candidateResumeRepository.findResumeById(resume.id, tx);

        if (!refreshedResume) {
          throw new CandidateResumeLinkServiceError("NOT_FOUND", "简历不存在。");
        }

        await candidateAuditRepository.create(
          {
            action: "RESUME_UNLINKED",
            actor: recruiterActor,
            beforeValue: createResumeAuditValue(resume),
            candidateId
          },
          tx
        );

        return toSafeCandidateResumeDto(refreshedResume);
      });
    } catch (error) {
      throw normalizeCandidateResumeLinkError(error, "解除简历关联失败。");
    }
  }
};

async function handleLinkRace(
  candidateId: string,
  resumeId: string,
  tx: CandidateDbClient
): Promise<SafeCandidateResumeDto> {
  const refreshedResume = await candidateResumeRepository.findResumeById(resumeId, tx);

  if (!refreshedResume) {
    throw new CandidateResumeLinkServiceError("NOT_FOUND", "简历不存在。");
  }

  if (refreshedResume.candidateId === candidateId) {
    return toSafeCandidateResumeDto(refreshedResume);
  }

  if (refreshedResume.candidateId) {
    throw new CandidateResumeLinkServiceError(
      "CONFLICT",
      "该简历已被其他候选人关联，请刷新后重试。"
    );
  }

  throw new CandidateResumeLinkServiceError(
    "CONFLICT",
    "该简历的关联状态已经变化，请刷新后重试。"
  );
}

async function handleUnlinkRace(
  candidateId: string,
  resumeId: string,
  tx: CandidateDbClient
): Promise<SafeCandidateResumeDto> {
  const refreshedResume = await candidateResumeRepository.findResumeById(resumeId, tx);

  if (!refreshedResume) {
    throw new CandidateResumeLinkServiceError("NOT_FOUND", "简历不存在。");
  }

  if (refreshedResume.candidateId === candidateId) {
    throw new CandidateResumeLinkServiceError(
      "CONFLICT",
      "该简历的关联状态已经变化，请刷新后重试。"
    );
  }

  throw new CandidateResumeLinkServiceError(
    "CONFLICT",
    "该简历当前未关联到此候选人，无法解除。"
  );
}

function normalizeCandidateResumeLinkError(
  error: unknown,
  fallbackMessage: string
): CandidateResumeLinkServiceError {
  if (error instanceof CandidateResumeLinkServiceError) {
    return error;
  }

  return new CandidateResumeLinkServiceError("DATABASE_ERROR", fallbackMessage);
}

function toSafeCandidateResumeDto(resume: SafeCandidateResume): SafeCandidateResumeDto {
  return {
    candidateId: resume.candidateId,
    createdAt: resume.createdAt.toISOString(),
    fileSize: resume.fileSize,
    fileType: resume.fileType,
    id: resume.id,
    intakeSource: resume.intakeSource,
    language: resume.language,
    originalName: resume.originalName,
    parserVersion: resume.parserVersion,
    parsingStatus: resume.parsingStatus
  };
}

function createResumeAuditValue(resume: SafeCandidateResume): CandidateResumeLinkAuditValue {
  return {
    fileType: resume.fileType,
    originalName: resume.originalName,
    resumeId: resume.id
  };
}
