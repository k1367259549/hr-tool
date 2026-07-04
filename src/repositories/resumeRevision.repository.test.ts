import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient)
    )
  }
}));

const transactionClient = {
  resumeRevision: {
    create: vi.fn()
  }
};

describe("resumeRevisionRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates initial revision with revisionNumber 1 and parsed snapshot", async () => {
    transactionClient.resumeRevision.create.mockResolvedValueOnce({
      id: "revision-id",
      parsedSnapshot: {
        id: "snapshot-id"
      },
      revisionNumber: 1
    });

    await resumeRevisionRepository.createInitialRevision({
      chunkCount: 2,
      contentHash: "hash-value",
      parseStatus: "PARSED",
      parsedText: "parsed resume",
      parserVersion: "v1",
      resumeId: "resume-id",
      source: "upload",
      sourceFileName: "resume.txt",
      structuredData: {
        semanticChunkCount: 1,
        structureChunkCount: 2
      }
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionClient.resumeRevision.create).toHaveBeenCalledWith({
      data: {
        contentHash: "hash-value",
        parseStatus: "PARSED",
        parsedSnapshot: {
          create: {
            chunkCount: 2,
            parsedText: "parsed resume",
            structuredData: {
              semanticChunkCount: 1,
              structureChunkCount: 2
            }
          }
        },
        parserVersion: "v1",
        resumeId: "resume-id",
        revisionNumber: 1,
        source: "upload",
        sourceFileName: "resume.txt"
      },
      include: {
        parsedSnapshot: true
      }
    });
  });

  it("creates failed parse snapshot with null parsedText and chunkCount 0", async () => {
    transactionClient.resumeRevision.create.mockResolvedValueOnce({
      id: "revision-id",
      parsedSnapshot: {
        id: "snapshot-id",
        parsedText: null
      },
      revisionNumber: 1
    });

    await resumeRevisionRepository.createInitialRevision({
      contentHash: null,
      parseStatus: "FAILED",
      parsedText: null,
      parserVersion: "v1",
      resumeId: "resume-id",
      source: "upload",
      sourceFileName: "resume.pdf"
    });

    expect(transactionClient.resumeRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentHash: null,
          parseStatus: "FAILED",
          parsedSnapshot: {
            create: {
              chunkCount: 0,
              parsedText: null,
              structuredData: null
            }
          },
          revisionNumber: 1
        })
      })
    );
  });
});
