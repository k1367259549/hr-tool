import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    candidateResume: {
      count: vi.fn(),
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
  parsingStatus: "PARSED"
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
