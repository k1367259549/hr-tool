import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import {
  resumeEvaluationRunService,
  ResumeEvaluationRunServiceError
} from "@/services/resumeEvaluationRun.service";
import type { ResumeEvaluationResultDetailRecord } from "@/types/resumeEvaluationResult";
import type { ResumeEvaluationRunSafeRecord } from "@/types/resumeEvaluationRun";

const transactionClient = {
  candidateResume: {
    update: vi.fn()
  },
  resumeEvaluationResult: {
    update: vi.fn()
  }
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient)
    )
  }
}));

vi.mock("@/repositories/resumeEvaluation.repository", () => ({
  resumeEvaluationRepository: {
    findDetailById: vi.fn(),
    updateDraftWithEvent: vi.fn()
  }
}));

vi.mock("@/repositories/resumeEvaluationRun.repository", () => ({
  resumeEvaluationRunRepository: {
    createRun: vi.fn(),
    findLatestSuccessfulRun: vi.fn(),
    listRunsByEvaluationId: vi.fn()
  }
}));

vi.mock("@/repositories/resumeRevision.repository", () => ({
  resumeRevisionRepository: {
    findRevisionWithSnapshotById: vi.fn()
  }
}));

function makeEvaluation(
  overrides?: Partial<ResumeEvaluationResultDetailRecord>
): ResumeEvaluationResultDetailRecord {
  return {
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    criterionResults: [],
    evaluatedBy: null,
    events: [],
    id: "eval-1",
    jobProfileId: "job-1",
    jobProfileVersion: "2026-07-04T00:00:00.000Z",
    overallNote: null,
    parsedSnapshotId: "snapshot-1",
    resumeId: "resume-1",
    resumeRevisionId: "revision-1",
    reviewedAt: null,
    revision: 0,
    status: "DRAFT",
    templateVersionId: "template-version-1",
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
    ...overrides
  } as ResumeEvaluationResultDetailRecord;
}

function makeRun(overrides?: Partial<ResumeEvaluationRunSafeRecord>): ResumeEvaluationRunSafeRecord {
  return {
    completedAt: new Date("2026-07-04T13:01:00.000Z"),
    createdAt: new Date("2026-07-04T13:00:00.000Z"),
    errorCode: null,
    errorMessage: null,
    evaluationId: "eval-1",
    id: "run-1",
    modelName: null,
    modelProvider: null,
    parsedSnapshotId: "snapshot-1",
    promptVersion: null,
    rating: null,
    resumeRevisionId: "revision-1",
    runType: "MOCK",
    score: null,
    status: "SUCCEEDED",
    summary: null,
    ...overrides
  };
}

describe("resumeEvaluationRunService.createMockEvaluationRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionClient.candidateResume.update.mockClear();
    transactionClient.resumeEvaluationResult.update.mockClear();
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValue(
      makeEvaluation()
    );
    vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValue({
      id: "revision-1",
      parsedSnapshot: {
        id: "snapshot-1"
      },
      resumeId: "resume-1"
    } as never);
    vi.mocked(resumeEvaluationRunRepository.createRun).mockResolvedValue(makeRun());
  });

  it("creates a SUCCEEDED MOCK run from persisted evaluation context", async () => {
    const result = await resumeEvaluationRunService.createMockEvaluationRun("eval-1");

    expect(result).toMatchObject({
      evaluationId: "eval-1",
      parsedSnapshotId: "snapshot-1",
      resumeRevisionId: "revision-1",
      runType: "MOCK",
      status: "SUCCEEDED"
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(resumeEvaluationRepository.findDetailById).toHaveBeenCalledWith(
      "eval-1",
      transactionClient
    );
    expect(resumeEvaluationRunRepository.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationId: "eval-1",
        jobProfileId: "job-1",
        jobProfileVersion: "2026-07-04T00:00:00.000Z",
        parsedSnapshotId: "snapshot-1",
        resumeId: "resume-1",
        resumeRevisionId: "revision-1",
        runType: "MOCK",
        status: "SUCCEEDED",
        templateVersionId: "template-version-1"
      }),
      transactionClient
    );
  });

  it("rejects when the master evaluation lacks revision or snapshot refs", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({
        parsedSnapshotId: null,
        resumeRevisionId: null
      })
    );

    await expect(
      resumeEvaluationRunService.createMockEvaluationRun("eval-1")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("validates that the revision belongs to the evaluation resume", async () => {
    vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValueOnce({
      id: "revision-1",
      parsedSnapshot: {
        id: "snapshot-1"
      },
      resumeId: "other-resume"
    } as never);

    await expect(
      resumeEvaluationRunService.createMockEvaluationRun("eval-1")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("validates that the parsed snapshot belongs to the revision", async () => {
    vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValueOnce({
      id: "revision-1",
      parsedSnapshot: {
        id: "other-snapshot"
      },
      resumeId: "resume-1"
    } as never);

    await expect(
      resumeEvaluationRunService.createMockEvaluationRun("eval-1")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when evaluation does not exist", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationRunService.createMockEvaluationRun("missing")
    ).rejects.toBeInstanceOf(ResumeEvaluationRunServiceError);

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("does not update the evaluation master or CandidateResume", async () => {
    await resumeEvaluationRunService.createMockEvaluationRun("eval-1");

    expect(transactionClient.resumeEvaluationResult.update).not.toHaveBeenCalled();
    expect(transactionClient.candidateResume.update).not.toHaveBeenCalled();
    expect(resumeEvaluationRepository.updateDraftWithEvent).not.toHaveBeenCalled();
    expect(resumeEvaluationRunRepository.createRun).toHaveBeenCalledWith(
      expect.not.objectContaining({
        latestRunId: expect.anything(),
        selectedRunId: expect.anything()
      }),
      transactionClient
    );
  });

  it("does not persist real model or prompt metadata for mock runs", async () => {
    await resumeEvaluationRunService.createMockEvaluationRun("eval-1");

    const createInput = vi.mocked(resumeEvaluationRunRepository.createRun).mock.calls[0]?.[0];

    expect(createInput).not.toHaveProperty("inputHash");
    expect(createInput).not.toHaveProperty("modelName");
    expect(createInput).not.toHaveProperty("modelProvider");
    expect(createInput).not.toHaveProperty("outputHash");
    expect(createInput).not.toHaveProperty("promptVersion");
  });
});

describe("resumeEvaluationRunService query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps run list records to safe DTOs", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun()
    ]);

    const result = await resumeEvaluationRunService.listRunsByEvaluationId("eval-1");

    expect(result[0]).toEqual({
      completedAt: "2026-07-04T13:01:00.000Z",
      createdAt: "2026-07-04T13:00:00.000Z",
      errorCode: null,
      errorMessage: null,
      evaluationId: "eval-1",
      id: "run-1",
      modelName: null,
      modelProvider: null,
      parsedSnapshotId: "snapshot-1",
      promptVersion: null,
      rating: null,
      resumeRevisionId: "revision-1",
      runType: "MOCK",
      score: null,
      status: "SUCCEEDED",
      summary: null
    });
  });

  it("returns latest successful run when available", async () => {
    vi.mocked(resumeEvaluationRunRepository.findLatestSuccessfulRun).mockResolvedValueOnce(
      makeRun({ id: "run-latest" })
    );

    await expect(
      resumeEvaluationRunService.getLatestSuccessfulRun("eval-1")
    ).resolves.toMatchObject({
      id: "run-latest",
      status: "SUCCEEDED"
    });
  });
});
