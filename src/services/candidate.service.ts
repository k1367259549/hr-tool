import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { candidateAuditRepository } from "@/repositories/candidateAudit.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import type {
  Candidate,
  CandidateAudit,
  CandidateCreateInput,
  CandidateDetailRecord,
  CandidateDto,
  CandidateListItemDto,
  CandidateListQuery,
  CandidateListRecord,
  CandidateListResultDto,
  CandidateUpdateInput
} from "@/types/candidate";

const recruiterActor = "RECRUITER";
const updateAuditFields = [
  "fullName",
  "email",
  "phone",
  "currentCompany",
  "currentTitle",
  "targetRoles",
  "sourceChannel",
  "owner",
  "tags",
  "notes",
  "status"
] as const;

type CandidateAuditField = (typeof updateAuditFields)[number];
type CandidateAuditValue = string | string[] | null;

export class CandidateServiceError extends Error {
  readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

  constructor(
    code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
    this.name = "CandidateServiceError";
    this.code = code;
  }
}

export const candidateService = {
  async createCandidate(input: CandidateCreateInput): Promise<CandidateDto> {
    if ((input as { status?: string }).status === "ARCHIVED") {
      throw new CandidateServiceError("VALIDATION_ERROR", "请使用归档操作归档候选人。");
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const candidate = await candidateRepository.create(input, tx);

        await candidateAuditRepository.create(
          {
            action: "CREATED",
            actor: recruiterActor,
            afterValue: createCandidateSnapshot(candidate),
            candidateId: candidate.id
          },
          tx
        );

        const createdCandidate = await candidateRepository.findById(candidate.id, tx);

        if (!createdCandidate) {
          throw new CandidateServiceError("DATABASE_ERROR", "创建候选人后读取失败。");
        }

        return toCandidateDto(createdCandidate);
      });
    } catch (error) {
      throw normalizeCandidateServiceError(error, "创建候选人失败。");
    }
  },

  async listCandidates(query: CandidateListQuery): Promise<CandidateListResultDto> {
    try {
      const [listResult, counts] = await Promise.all([
        candidateRepository.findMany(query),
        candidateRepository.countByStatus()
      ]);

      return {
        candidates: listResult.candidates.map(toCandidateListItemDto),
        counts,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: listResult.total,
          totalPages: Math.max(1, Math.ceil(listResult.total / query.pageSize))
        }
      };
    } catch (error) {
      throw normalizeCandidateServiceError(error, "查询候选人失败。");
    }
  },

  async getCandidate(id: string): Promise<CandidateDto> {
    const candidate = await candidateRepository.findById(id);

    if (!candidate) {
      throw new CandidateServiceError("NOT_FOUND", "候选人不存在。");
    }

    return toCandidateDto(candidate);
  },

  async updateCandidate(id: string, input: CandidateUpdateInput): Promise<CandidateDto> {
    if ((input as { status?: string }).status === "ARCHIVED") {
      throw new CandidateServiceError("VALIDATION_ERROR", "请使用归档操作归档候选人。");
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const existingCandidate = await candidateRepository.findById(id, tx);

        if (!existingCandidate) {
          throw new CandidateServiceError("NOT_FOUND", "候选人不存在。");
        }

        const changedFields = createChangedFields(existingCandidate, input);

        if (!changedFields) {
          return toCandidateDto(existingCandidate);
        }

        const updatedCandidate = await candidateRepository.update(id, input, tx);

        await candidateAuditRepository.create(
          {
            action: "UPDATED",
            actor: recruiterActor,
            afterValue: changedFields.afterValue,
            beforeValue: changedFields.beforeValue,
            candidateId: updatedCandidate.id
          },
          tx
        );

        const detailedCandidate = await candidateRepository.findById(id, tx);

        if (!detailedCandidate) {
          throw new CandidateServiceError("DATABASE_ERROR", "更新候选人后读取失败。");
        }

        return toCandidateDto(detailedCandidate);
      });
    } catch (error) {
      throw normalizeCandidateServiceError(error, "更新候选人失败。");
    }
  },

  async archiveCandidate(id: string): Promise<CandidateDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingCandidate = await candidateRepository.findById(id, tx);

        if (!existingCandidate) {
          throw new CandidateServiceError("NOT_FOUND", "候选人不存在。");
        }

        if (existingCandidate.status === "ARCHIVED") {
          return toCandidateDto(existingCandidate);
        }

        const archivedCandidate = await candidateRepository.archive(id, tx);

        await candidateAuditRepository.create(
          {
            action: "ARCHIVED",
            actor: recruiterActor,
            afterValue: createStatusSnapshot(archivedCandidate),
            beforeValue: createStatusSnapshot(existingCandidate),
            candidateId: archivedCandidate.id
          },
          tx
        );

        const detailedCandidate = await candidateRepository.findById(id, tx);

        if (!detailedCandidate) {
          throw new CandidateServiceError("DATABASE_ERROR", "归档候选人后读取失败。");
        }

        return toCandidateDto(detailedCandidate);
      });
    } catch (error) {
      throw normalizeCandidateServiceError(error, "归档候选人失败。");
    }
  },

  async restoreCandidate(id: string): Promise<CandidateDto> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingCandidate = await candidateRepository.findById(id, tx);

        if (!existingCandidate) {
          throw new CandidateServiceError("NOT_FOUND", "候选人不存在。");
        }

        if (existingCandidate.status !== "ARCHIVED") {
          return toCandidateDto(existingCandidate);
        }

        const restoredCandidate = await candidateRepository.restore(id, tx);

        await candidateAuditRepository.create(
          {
            action: "RESTORED",
            actor: recruiterActor,
            afterValue: createStatusSnapshot(restoredCandidate),
            beforeValue: createStatusSnapshot(existingCandidate),
            candidateId: restoredCandidate.id
          },
          tx
        );

        const detailedCandidate = await candidateRepository.findById(id, tx);

        if (!detailedCandidate) {
          throw new CandidateServiceError("DATABASE_ERROR", "恢复候选人后读取失败。");
        }

        return toCandidateDto(detailedCandidate);
      });
    } catch (error) {
      throw normalizeCandidateServiceError(error, "恢复候选人失败。");
    }
  }
};

function normalizeCandidateServiceError(error: unknown, fallbackMessage: string): CandidateServiceError {
  if (error instanceof CandidateServiceError) {
    return error;
  }

  return new CandidateServiceError("DATABASE_ERROR", fallbackMessage);
}

function toCandidateDto(candidate: CandidateDetailRecord): CandidateDto {
  return {
    ...toCandidateListItemDto(candidate),
    audits: candidate.audits.map(toCandidateAuditDto),
    notes: candidate.notes
  };
}

function toCandidateListItemDto(candidate: CandidateListRecord): CandidateListItemDto {
  return {
    archivedAt: candidate.archivedAt?.toISOString() ?? null,
    createdAt: candidate.createdAt.toISOString(),
    currentCompany: candidate.currentCompany,
    currentTitle: candidate.currentTitle,
    email: candidate.email,
    fullName: candidate.fullName,
    id: candidate.id,
    latestActivityAt: candidate.latestActivityAt.toISOString(),
    maskedEmail: maskEmail(candidate.email),
    maskedPhone: maskPhone(candidate.phone),
    owner: candidate.owner,
    phone: candidate.phone,
    resumeCount: candidate._count.resumes,
    sourceChannel: candidate.sourceChannel,
    status: candidate.status,
    tags: candidate.tags,
    targetRoles: candidate.targetRoles,
    updatedAt: candidate.updatedAt.toISOString()
  };
}

function toCandidateAuditDto(audit: CandidateAudit): CandidateDto["audits"][number] {
  return {
    action: audit.action,
    actor: audit.actor,
    afterValue: audit.afterValue,
    beforeValue: audit.beforeValue,
    candidateId: audit.candidateId,
    createdAt: audit.createdAt.toISOString(),
    id: audit.id,
    note: audit.note
  };
}

function createCandidateSnapshot(candidate: Candidate): Prisma.InputJsonObject {
  return {
    archivedAt: candidate.archivedAt?.toISOString() ?? null,
    currentCompany: candidate.currentCompany,
    currentTitle: candidate.currentTitle,
    email: candidate.email,
    fullName: candidate.fullName,
    id: candidate.id,
    notes: candidate.notes,
    owner: candidate.owner,
    phone: candidate.phone,
    sourceChannel: candidate.sourceChannel,
    status: candidate.status,
    tags: candidate.tags,
    targetRoles: candidate.targetRoles
  };
}

function createStatusSnapshot(candidate: Candidate): Prisma.InputJsonObject {
  return {
    archivedAt: candidate.archivedAt?.toISOString() ?? null,
    latestActivityAt: candidate.latestActivityAt.toISOString(),
    status: candidate.status
  };
}

function createChangedFields(
  existingCandidate: Candidate,
  input: CandidateUpdateInput
): { beforeValue: Prisma.InputJsonObject; afterValue: Prisma.InputJsonObject } | null {
  const beforeValue: Record<string, CandidateAuditValue> = {};
  const afterValue: Record<string, CandidateAuditValue> = {};

  updateAuditFields.forEach((field) => {
    if (!(field in input)) {
      return;
    }

    const nextValue = input[field];

    if (nextValue === undefined) {
      return;
    }

    const previousValue = readCandidateAuditValue(existingCandidate, field);
    const normalizedNextValue = normalizeAuditValue(nextValue);

    if (candidateAuditValuesEqual(previousValue, normalizedNextValue)) {
      return;
    }

    beforeValue[field] = previousValue;
    afterValue[field] = normalizedNextValue;
  });

  return Object.keys(beforeValue).length === 0
    ? null
    : {
        afterValue: afterValue as Prisma.InputJsonObject,
        beforeValue: beforeValue as Prisma.InputJsonObject
      };
}

function readCandidateAuditValue(candidate: Candidate, field: CandidateAuditField): CandidateAuditValue {
  const value = candidate[field];

  if (Array.isArray(value)) {
    return [...value];
  }

  return value;
}

function normalizeAuditValue(value: string | string[] | null): CandidateAuditValue {
  if (Array.isArray(value)) {
    return [...value];
  }

  return value;
}

function candidateAuditValuesEqual(first: CandidateAuditValue, second: CandidateAuditValue): boolean {
  if (Array.isArray(first) || Array.isArray(second)) {
    if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length) {
      return false;
    }

    return first.every((item, index) => item === second[index]);
  }

  return first === second;
}

function maskEmail(email: string | null): string | null {
  if (!email) {
    return null;
  }

  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  const firstCharacter = name[0] ?? "";

  return `${firstCharacter}***@${domain}`;
}

function maskPhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const trimmed = phone.trim();

  if (trimmed.length <= 7) {
    return trimmed;
  }

  return `${trimmed.slice(0, 3)}****${trimmed.slice(-4)}`;
}
