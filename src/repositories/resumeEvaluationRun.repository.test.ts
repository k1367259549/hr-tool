import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import type { ResumeEvaluationRunSafeRecord } from "@/types/resumeEvaluationRun";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeEvaluationRun: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

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
    parsedOutputJson: null,
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

describe("resumeEvaluationRunRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an immutable run without returning rawOutputJson", async () => {
    vi.mocked(prisma.resumeEvaluationRun.create).mockResolvedValueOnce(makeRun() as never);

    await resumeEvaluationRunRepository.createRun({
      evaluationId: "eval-1",
      jobProfileId: "job-1",
      jobProfileVersion: "2026-07-04T00:00:00.000Z",
      parsedOutputJson: { status: "MOCK_EVALUATION_RUN_CREATED" },
      parsedSnapshotId: "snapshot-1",
      resumeId: "resume-1",
      resumeRevisionId: "revision-1",
      runType: "MOCK",
      status: "SUCCEEDED",
      templateVersionId: "template-version-1"
    });

    expect(prisma.resumeEvaluationRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        evaluationId: "eval-1",
        parsedOutputJson: { status: "MOCK_EVALUATION_RUN_CREATED" },
        rawOutputJson: Prisma.DbNull,
        runType: "MOCK",
        status: "SUCCEEDED"
      }),
      select: expect.not.objectContaining({
        rawOutputJson: true
      })
    });
    expect(prisma.resumeEvaluationRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          selectedRunId: expect.anything(),
          latestRunId: expect.anything()
        })
      })
    );
  });

  it("allows multiple runs under the same evaluation", async () => {
    vi.mocked(prisma.resumeEvaluationRun.create)
      .mockResolvedValueOnce(makeRun({ id: "run-1" }) as never)
      .mockResolvedValueOnce(makeRun({ id: "run-2" }) as never);

    const input = {
      evaluationId: "eval-1",
      jobProfileId: "job-1",
      jobProfileVersion: "2026-07-04T00:00:00.000Z",
      parsedSnapshotId: "snapshot-1",
      resumeId: "resume-1",
      resumeRevisionId: "revision-1",
      runType: "MOCK" as const,
      status: "SUCCEEDED" as const,
      templateVersionId: "template-version-1"
    };

    await resumeEvaluationRunRepository.createRun(input);
    await resumeEvaluationRunRepository.createRun(input);

    expect(prisma.resumeEvaluationRun.create).toHaveBeenCalledTimes(2);
  });

  it("lists runs newest first with safe fields", async () => {
    vi.mocked(prisma.resumeEvaluationRun.findMany).mockResolvedValueOnce([
      makeRun({ createdAt: new Date("2026-07-04T13:02:00.000Z"), id: "run-2" }),
      makeRun({ createdAt: new Date("2026-07-04T13:00:00.000Z"), id: "run-1" })
    ] as never);

    await resumeEvaluationRunRepository.listRunsByEvaluationId("eval-1");

    expect(prisma.resumeEvaluationRun.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: expect.not.objectContaining({
        rawOutputJson: true
      }),
      where: { evaluationId: "eval-1" }
    });
  });

  it("finds the latest successful run and ignores failed runs", async () => {
    vi.mocked(prisma.resumeEvaluationRun.findFirst).mockResolvedValueOnce(
      makeRun({ id: "run-success", status: "SUCCEEDED" }) as never
    );

    await resumeEvaluationRunRepository.findLatestSuccessfulRun("eval-1");

    expect(prisma.resumeEvaluationRun.findFirst).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: expect.not.objectContaining({
        rawOutputJson: true
      }),
      where: {
        evaluationId: "eval-1",
        status: "SUCCEEDED"
      }
    });
  });

  it("finds one run by id without unsafe raw output", async () => {
    vi.mocked(prisma.resumeEvaluationRun.findUnique).mockResolvedValueOnce(makeRun() as never);

    await resumeEvaluationRunRepository.findRunById("run-1");

    expect(prisma.resumeEvaluationRun.findUnique).toHaveBeenCalledWith({
      select: expect.not.objectContaining({
        rawOutputJson: true
      }),
      where: { id: "run-1" }
    });
  });

  it("finds a run with only fields needed for selected-run validation", async () => {
    vi.mocked(prisma.resumeEvaluationRun.findUnique).mockResolvedValueOnce({
      evaluationId: "eval-1",
      id: "run-1",
      jobProfileId: "job-1",
      jobProfileVersion: "2026-07-04T00:00:00.000Z",
      resumeId: "resume-1",
      status: "SUCCEEDED",
      templateVersionId: "template-version-1"
    } as never);

    await resumeEvaluationRunRepository.findRunForSelection("run-1");

    expect(prisma.resumeEvaluationRun.findUnique).toHaveBeenCalledWith({
      select: {
        evaluationId: true,
        id: true,
        jobProfileId: true,
        jobProfileVersion: true,
        resumeId: true,
        status: true,
        templateVersionId: true
      },
      where: { id: "run-1" }
    });
  });

  it("marks a run as SUCCEEDED with canonical parsed output and provider metadata", async () => {
    const completedAt = new Date("2026-07-04T13:05:00.000Z");
    const detailedOutput = {
      schemaVersion: "m11-a.detailed.v1",
      screeningMode: "DETAILED",
      summary: "Detailed result persisted as canonical output."
    };

    vi.mocked(prisma.resumeEvaluationRun.update).mockResolvedValueOnce(
      makeRun({
        completedAt,
        modelName: "gpt-5.5",
        modelProvider: "OPENAI_COMPATIBLE",
        parsedOutputJson: detailedOutput,
        promptVersion: "1.0",
        runType: "AI",
        status: "SUCCEEDED"
      }) as never
    );

    await resumeEvaluationRunRepository.completeRun("run-1", {
      completedAt,
      latencyMs: 1200,
      modelName: "gpt-5.5",
      modelProvider: "OPENAI_COMPATIBLE",
      parsedOutputJson: detailedOutput,
      promptVersion: "1.0",
      rating: "PROCEED_TO_NEXT_STEP",
      score: 82,
      summary: "Detailed result persisted as canonical output."
    });

    expect(prisma.resumeEvaluationRun.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completedAt,
        errorCode: null,
        errorMessage: null,
        modelName: "gpt-5.5",
        modelProvider: "OPENAI_COMPATIBLE",
        parsedOutputJson: detailedOutput,
        promptVersion: "1.0",
        rating: "PROCEED_TO_NEXT_STEP",
        score: 82,
        status: "SUCCEEDED",
        summary: "Detailed result persisted as canonical output."
      }),
      select: expect.not.objectContaining({
        rawOutputJson: true
      }),
      where: { id: "run-1" }
    });
  });

  it("marks a run as FAILED with safe error metadata", async () => {
    const completedAt = new Date("2026-07-04T13:05:00.000Z");

    vi.mocked(prisma.resumeEvaluationRun.update).mockResolvedValueOnce(
      makeRun({
        completedAt,
        errorCode: "TIMEOUT",
        errorMessage: "Provider timed out.",
        status: "FAILED"
      }) as never
    );

    await resumeEvaluationRunRepository.failRun("run-1", {
      completedAt,
      errorCode: "TIMEOUT",
      errorMessage: "Provider timed out.",
      latencyMs: 30000,
      modelName: "gpt-5.5",
      modelProvider: "OPENAI_COMPATIBLE",
      promptVersion: "1.0"
    });

    expect(prisma.resumeEvaluationRun.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        completedAt,
        errorCode: "TIMEOUT",
        errorMessage: "Provider timed out.",
        latencyMs: 30000,
        modelName: "gpt-5.5",
        modelProvider: "OPENAI_COMPATIBLE",
        parsedOutputJson: Prisma.DbNull,
        promptVersion: "1.0",
        status: "FAILED"
      }),
      select: expect.not.objectContaining({
        rawOutputJson: true
      }),
      where: { id: "run-1" }
    });
  });
});
