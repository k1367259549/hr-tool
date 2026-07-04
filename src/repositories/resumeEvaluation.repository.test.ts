import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeEvaluationResult: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

describe("resumeEvaluationRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates evaluation with revision and snapshot references without AI run fields", async () => {
    vi.mocked(prisma.resumeEvaluationResult.create).mockResolvedValueOnce({
      id: "eval-1",
      events: []
    } as never);

    await resumeEvaluationRepository.createWithEvent(
      {
        evaluatedBy: "招聘官 A",
        jobProfileId: "job-profile-id",
        parsedSnapshotId: "snapshot-id",
        resumeId: "resume-id",
        resumeRevisionId: "revision-id",
        templateVersionId: "template-version-id"
      },
      "2026-07-04T00:00:00.000Z",
      [
        {
          assessment: "NOT_ASSESSED",
          criterionKey: "backend-api",
          evidenceNotes: []
        }
      ],
      "招聘官 A"
    );

    expect(prisma.resumeEvaluationResult.create).toHaveBeenCalledWith({
      data: {
        criterionResults: [
          {
            assessment: "NOT_ASSESSED",
            criterionKey: "backend-api",
            evidenceNotes: []
          }
        ],
        evaluatedBy: "招聘官 A",
        events: {
          create: {
            actor: "招聘官 A",
            changedFields: [],
            eventType: "CREATED"
          }
        },
        jobProfileId: "job-profile-id",
        jobProfileVersion: "2026-07-04T00:00:00.000Z",
        parsedSnapshotId: "snapshot-id",
        resumeId: "resume-id",
        resumeRevisionId: "revision-id",
        templateVersionId: "template-version-id"
      },
      include: {
        events: {
          orderBy: [
            {
              createdAt: "desc"
            },
            {
              id: "asc"
            }
          ]
        }
      }
    });

    const createCall = vi.mocked(prisma.resumeEvaluationResult.create).mock.calls[0]?.[0];

    expect(createCall?.data).not.toHaveProperty("score");
    expect(createCall?.data).not.toHaveProperty("rating");
    expect(createCall?.data).not.toHaveProperty("modelProvider");
    expect(createCall?.data).not.toHaveProperty("promptVersion");
  });

  it("preserves null revision and snapshot references for compatibility fallback", async () => {
    vi.mocked(prisma.resumeEvaluationResult.create).mockResolvedValueOnce({
      id: "eval-1",
      events: []
    } as never);

    await resumeEvaluationRepository.createWithEvent(
      {
        evaluatedBy: null,
        jobProfileId: "job-profile-id",
        parsedSnapshotId: null,
        resumeId: "resume-id",
        resumeRevisionId: null,
        templateVersionId: "template-version-id"
      },
      "2026-07-04T00:00:00.000Z",
      [],
      null
    );

    expect(prisma.resumeEvaluationResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parsedSnapshotId: null,
          resumeRevisionId: null
        })
      })
    );
  });

  it("finds evaluation context for selected-run updates", async () => {
    vi.mocked(prisma.resumeEvaluationResult.findUnique).mockResolvedValueOnce({
      id: "eval-1",
      jobProfileId: "job-1",
      jobProfileVersion: "2026-07-04T00:00:00.000Z",
      resumeId: "resume-1",
      selectedRunId: null,
      templateVersionId: "template-version-1"
    } as never);

    await resumeEvaluationRepository.findEvaluationForSelectedRunUpdate("eval-1");

    expect(prisma.resumeEvaluationResult.findUnique).toHaveBeenCalledWith({
      select: {
        id: true,
        jobProfileId: true,
        jobProfileVersion: true,
        resumeId: true,
        selectedRunId: true,
        templateVersionId: true
      },
      where: { id: "eval-1" }
    });
  });

  it("updates only selectedRunId on the evaluation master", async () => {
    vi.mocked(prisma.resumeEvaluationResult.update).mockResolvedValueOnce({
      id: "eval-1",
      selectedRunId: "run-1"
    } as never);

    await resumeEvaluationRepository.updateSelectedRun("eval-1", "run-1");

    expect(prisma.resumeEvaluationResult.update).toHaveBeenCalledWith({
      data: {
        selectedRunId: "run-1"
      },
      where: { id: "eval-1" }
    });
  });
});
