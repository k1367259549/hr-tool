import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    candidateResume: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

const safeRecord = {
  candidateId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  fileName: "resume.pdf",
  fileSize: 1024,
  fileType: "PDF",
  id: "resume-id",
  intakeSource: "RESUME_LIBRARY",
  language: null,
  parserVersion: "v1",
  parsingStatus: "PARSED"
};

const resumeListRecord = {
  ...safeRecord,
  candidate: {
    fullName: "候选人甲",
    id: "candidate-id"
  },
  candidateId: "candidate-id",
  candidateSource: "内推",
  contentHash: "hash-value",
  jobProfile: {
    id: "job-id",
    jobTitle: "招聘专员"
  },
  jobProfileId: "job-id",
  updatedAt: new Date("2026-01-02T00:00:00.000Z")
};

describe("candidateResumeRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists only available resumes with stable ordering and safe select", async () => {
    vi.mocked(prisma.candidateResume.findMany).mockReturnValueOnce("findManyQuery" as never);
    vi.mocked(prisma.candidateResume.count).mockReturnValueOnce("countQuery" as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([[safeRecord], 1] as never);

    const result = await candidateResumeRepository.listAvailableResumes({
      fileType: "PDF",
      page: 2,
      pageSize: 5,
      search: "resume"
    });

    expect(result.total).toBe(1);
    expect(result.resumes[0]).toMatchObject({
      candidateId: null,
      originalName: "resume.pdf"
    });
    expect(prisma.candidateResume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "asc"
          }
        ],
        select: expect.not.objectContaining({
          originalFile: expect.anything(),
          parsedText: expect.anything()
        }),
        skip: 5,
        take: 5,
        where: {
          candidateId: null,
          fileName: {
            contains: "resume",
            mode: "insensitive"
          },
          fileType: {
            equals: "PDF",
            mode: "insensitive"
          }
        }
      })
    );
    expect(prisma.candidateResume.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          candidateId: null
        })
      })
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(["findManyQuery", "countQuery"]);
  });

  it("finds candidate resumes without selecting binary or parsed text", async () => {
    vi.mocked(prisma.candidateResume.findMany).mockResolvedValueOnce([
      {
        ...safeRecord,
        candidateId: "candidate-id"
      }
    ] as never);

    await candidateResumeRepository.listCandidateResumes("candidate-id");

    expect(prisma.candidateResume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({
          originalFile: expect.anything(),
          parsedText: expect.anything()
        }),
        where: {
          candidateId: "candidate-id"
        }
      })
    );
  });

  it("creates independent Resume Library records without job or candidate", async () => {
    vi.mocked(prisma.candidateResume.create).mockResolvedValueOnce({
      ...safeRecord,
      candidateSource: null,
      contentHash: "hash-value",
      language: null,
      jobProfileId: null,
      notes: null,
      originalFile: new Uint8Array([1]),
      parserVersion: "v1",
      parsedText: "hello",
      parsingError: null,
      resumeVersion: "resume-parser-v1",
      semanticChunks: [],
      structureChunks: [],
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      workflowId: "workflow-id"
    } as never);

    await candidateResumeRepository.createResume({
      candidateId: null,
      candidateSource: null,
      contentHash: "hash-value",
      fileName: "resume.txt",
      fileSize: 5,
      fileType: "TXT",
      intakeSource: "RESUME_LIBRARY",
      jobProfileId: null,
      language: null,
      notes: null,
      originalFile: new Uint8Array([1]) as Uint8Array<ArrayBuffer>,
      parserVersion: "v1",
      parsedText: "hello",
      parsingError: null,
      parsingStatus: "PARSED",
      resumeVersion: "resume-parser-v1",
      semanticChunks: [],
      structureChunks: [],
      workflowId: "workflow-id"
    });

    expect(prisma.candidateResume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateId: null,
          language: null,
          intakeSource: "RESUME_LIBRARY",
          jobProfileId: null,
          parserVersion: "v1"
        })
      })
    );
  });

  it("lists Resume Library records with safe select, filters, and stable ordering", async () => {
    vi.mocked(prisma.candidateResume.findMany).mockReturnValueOnce("findManyQuery" as never);
    vi.mocked(prisma.candidateResume.count).mockReturnValueOnce("countQuery" as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([[resumeListRecord], 1] as never);

    const result = await candidateResumeRepository.findResumeList({
      fileType: "PDF",
      intakeSource: "RESUME_LIBRARY",
      linkStatus: "linked",
      page: 2,
      pageSize: 5,
      parsingStatus: "PARSED",
      search: "候选人"
    });

    expect(result.total).toBe(1);
    expect(prisma.candidateResume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "asc"
          }
        ],
        select: expect.not.objectContaining({
          originalFile: expect.anything(),
          parsedText: expect.anything()
        }),
        skip: 5,
        take: 5,
        where: expect.objectContaining({
          candidateId: {
            not: null
          },
          fileType: "PDF",
          intakeSource: "RESUME_LIBRARY",
          parsingStatus: "PARSED"
        })
      })
    );
  });

  it("reads detail without original binary and updates only metadata", async () => {
    vi.mocked(prisma.candidateResume.findUnique).mockResolvedValueOnce(resumeListRecord as never);
    vi.mocked(prisma.candidateResume.update).mockResolvedValueOnce(resumeListRecord as never);

    await candidateResumeRepository.findResumeDetailById("resume-id");
    await candidateResumeRepository.updateResumeMetadata("resume-id", {
      candidateSource: "Boss",
      notes: "人工备注"
    });

    expect(prisma.candidateResume.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({
          originalFile: expect.anything()
        })
      })
    );
    expect(prisma.candidateResume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          candidateSource: "Boss",
          notes: "人工备注"
        }
      })
    );
  });

  it("counts and lists duplicate records by non-unique content hash", async () => {
    vi.mocked(prisma.candidateResume.count).mockResolvedValueOnce(2 as never);
    vi.mocked(prisma.candidateResume.findMany).mockResolvedValueOnce([resumeListRecord] as never);

    await expect(
      candidateResumeRepository.countOtherResumesByHash("hash-value", "resume-id")
    ).resolves.toBe(2);
    await candidateResumeRepository.listPossibleDuplicates("hash-value", "resume-id", 5);

    expect(prisma.candidateResume.count).toHaveBeenCalledWith({
      where: {
        contentHash: "hash-value",
        id: {
          not: "resume-id"
        }
      }
    });
    expect(prisma.candidateResume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        where: {
          contentHash: "hash-value",
          id: {
            not: "resume-id"
          }
        }
      })
    );
  });

  it("links resume using candidateId null condition", async () => {
    vi.mocked(prisma.candidateResume.updateMany).mockResolvedValueOnce({
      count: 1
    } as never);

    const count = await candidateResumeRepository.linkResumeToCandidate(
      "resume-id",
      "candidate-id"
    );

    expect(count).toBe(1);
    expect(prisma.candidateResume.updateMany).toHaveBeenCalledWith({
      data: {
        candidateId: "candidate-id"
      },
      where: {
        candidateId: null,
        id: "resume-id"
      }
    });
    expect(prisma.candidateResume.update).not.toHaveBeenCalled();
  });

  it("unlinks resume using current candidateId condition", async () => {
    vi.mocked(prisma.candidateResume.updateMany).mockResolvedValueOnce({
      count: 1
    } as never);

    const count = await candidateResumeRepository.unlinkResumeFromCandidate(
      "resume-id",
      "candidate-id"
    );

    expect(count).toBe(1);
    expect(prisma.candidateResume.updateMany).toHaveBeenCalledWith({
      data: {
        candidateId: null
      },
      where: {
        candidateId: "candidate-id",
        id: "resume-id"
      }
    });
    expect(prisma.candidateResume.update).not.toHaveBeenCalled();
  });
});
