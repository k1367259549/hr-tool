import type { Prisma, ResumeParsingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CandidateDbClient } from "@/repositories/candidate.repository";

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

export type LatestResumeRevisionRecord = Prisma.ResumeRevisionGetPayload<{
  include: {
    parsedSnapshot: true;
  };
}>;

export type ParsedSnapshotWithRevisionRecord = Prisma.ParsedSnapshotGetPayload<{
  include: {
    revision: true;
  };
}>;

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
  },

  async findLatestRevisionWithSnapshot(
    resumeId: string,
    client: CandidateDbClient = prisma
  ): Promise<LatestResumeRevisionRecord | null> {
    return client.resumeRevision.findFirst({
      include: {
        parsedSnapshot: true
      },
      orderBy: [
        {
          revisionNumber: "desc"
        },
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ],
      where: {
        resumeId
      }
    });
  },

  async findRevisionWithSnapshotById(
    revisionId: string,
    client: CandidateDbClient = prisma
  ): Promise<LatestResumeRevisionRecord | null> {
    return client.resumeRevision.findUnique({
      include: {
        parsedSnapshot: true
      },
      where: {
        id: revisionId
      }
    });
  },

  async findSnapshotWithRevisionById(
    snapshotId: string,
    client: CandidateDbClient = prisma
  ): Promise<ParsedSnapshotWithRevisionRecord | null> {
    return client.parsedSnapshot.findUnique({
      include: {
        revision: true
      },
      where: {
        id: snapshotId
      }
    });
  }
};
