import type { Prisma, ResumeParsingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateInitialResumeRevisionInput = {
  resumeId: string;
  contentHash?: string | null;
  source?: string | null;
  sourceFileName?: string | null;
  parserVersion?: string | null;
  parseStatus: ResumeParsingStatus;
  parsedText?: string | null;
  structuredData?: Prisma.InputJsonValue | null;
  chunkCount?: number | null;
};

export const resumeRevisionRepository = {
  async createInitialRevision(input: CreateInitialResumeRevisionInput) {
    return prisma.$transaction(async (tx) =>
      tx.resumeRevision.create({
        data: {
          contentHash: input.contentHash,
          parseStatus: input.parseStatus,
          parsedSnapshot: {
            create: {
              chunkCount: input.chunkCount ?? 0,
              parsedText: input.parsedText ?? null,
              structuredData: (input.structuredData ?? null) as Prisma.InputJsonValue
            }
          },
          parserVersion: input.parserVersion,
          resumeId: input.resumeId,
          revisionNumber: 1,
          source: input.source,
          sourceFileName: input.sourceFileName
        },
        include: {
          parsedSnapshot: true
        }
      })
    );
  }
};
