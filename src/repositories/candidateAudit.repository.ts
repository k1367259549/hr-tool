import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateAudit, CandidateAuditCreateInput } from "@/types/candidate";
import type { CandidateDbClient } from "@/repositories/candidate.repository";

export const candidateAuditRepository = {
  async create(
    input: CandidateAuditCreateInput,
    client: CandidateDbClient = prisma
  ): Promise<CandidateAudit> {
    return client.candidateAudit.create({
      data: {
        action: input.action,
        actor: input.actor,
        afterValue: input.afterValue === null ? Prisma.JsonNull : input.afterValue,
        beforeValue: input.beforeValue === null ? Prisma.JsonNull : input.beforeValue,
        candidateId: input.candidateId,
        note: input.note
      }
    });
  },

  async findMany(candidateId: string): Promise<CandidateAudit[]> {
    return prisma.candidateAudit.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        candidateId
      }
    });
  }
};
