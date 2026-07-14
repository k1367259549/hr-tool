import { beforeEach, describe, expect, it, vi } from "vitest";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";
import { prisma } from "@/lib/prisma";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
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

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findById: vi.fn()
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
    reviewedBy: null,
    reviewedRunId: null,
    reviewerDecision: null,
    reviewerNotes: null,
    revision: 0,
    selectedRunId: null,
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

function makeJobProfile() {
  return {
    coreResponsibilities: ["Build backend API services"],
    hiringFocus: ["typescript", "api", "postgres"],
    id: "job-1",
    interviewFocus: ["API ownership"],
    jd: "Need a backend engineer with typescript api postgres docker workflow experience.",
    jobSummary: "Backend internship for HR workflow tools.",
    jobTitle: "Backend Intern",
    missingInformation: ["Internship duration"],
    potentialRisks: ["Availability may be unclear"],
    preferredCompetencies: ["docker"],
    requiredCompetencies: ["typescript", "api", "postgres"],
    suggestedFollowUpQuestions: ["When can you start?"]
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
      resumeEvaluationRunService.getLatestSuccessfulRunByEvaluationId("eval-1")
    ).resolves.toMatchObject({
      id: "run-latest",
      status: "SUCCEEDED"
    });
    expect(resumeEvaluationRunRepository.findLatestSuccessfulRun).toHaveBeenCalledWith("eval-1");
  });

  it("returns null when no successful run exists", async () => {
    vi.mocked(resumeEvaluationRunRepository.findLatestSuccessfulRun).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationRunService.getLatestSuccessfulRunByEvaluationId("eval-1")
    ).resolves.toBeNull();
  });

  it("uses repository successful-run query even when a newer FAILED run may exist", async () => {
    vi.mocked(resumeEvaluationRunRepository.findLatestSuccessfulRun).mockResolvedValueOnce(
      makeRun({
        createdAt: new Date("2026-07-04T13:00:00.000Z"),
        id: "older-success",
        status: "SUCCEEDED"
      })
    );

    const result = await resumeEvaluationRunService.getLatestSuccessfulRunByEvaluationId("eval-1");

    expect(result).toMatchObject({
      id: "older-success",
      status: "SUCCEEDED"
    });
    expect(resumeEvaluationRunRepository.findLatestSuccessfulRun).toHaveBeenCalledWith("eval-1");
  });

  it("does not write evaluation master or CandidateResume when reading latest successful run", async () => {
    vi.mocked(resumeEvaluationRunRepository.findLatestSuccessfulRun).mockResolvedValueOnce(
      makeRun({ id: "run-latest" })
    );

    await resumeEvaluationRunService.getLatestSuccessfulRunByEvaluationId("eval-1");

    expect(resumeEvaluationRepository.updateDraftWithEvent).not.toHaveBeenCalled();
    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
    expect(transactionClient.resumeEvaluationResult.update).not.toHaveBeenCalled();
    expect(transactionClient.candidateResume.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("keeps the previous latest successful helper as a compatibility alias", async () => {
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

describe("resumeEvaluationRunService.createQuickScreeningRun", () => {
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
        id: "snapshot-1",
        parsedText:
          "Built backend typescript api services with postgres, docker, and workflow automation for HR tools."
      },
      resumeId: "resume-1"
    } as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValue(makeJobProfile() as never);
    vi.mocked(resumeEvaluationRunRepository.createRun).mockResolvedValue(
      makeRun({
        modelName: "0.1.0",
        modelProvider: "RULE_BASED",
        rating: "POTENTIAL_FIT",
        runType: "RULE_BASED",
        score: 67,
        summary: "Rule-based signal only: matched keywords."
      })
    );
  });

  it("creates a persisted RULE_BASED quick screening run", async () => {
    const providerSpy = vi.spyOn(RuleBasedEvaluationProvider.prototype, "evaluate");

    const result = await resumeEvaluationRunService.createQuickScreeningRun("eval-1");

    expect(result.run).toMatchObject({
      evaluationId: "eval-1",
      modelProvider: "RULE_BASED",
      runType: "RULE_BASED",
      status: "SUCCEEDED"
    });
    expect(result.result).toMatchObject({
      recommendation: expect.any(String),
      score: expect.any(Number),
      summary: expect.stringContaining("Rule-based signal only")
    });
    expect(result.result.evidence.length).toBeGreaterThan(0);
    expect(result.result.nextStep).toContain("招聘者人工确认");
    expect(resumeEvaluationRepository.findDetailById).toHaveBeenCalledWith(
      "eval-1",
      transactionClient
    );
    expect(jobProfileRepository.findById).toHaveBeenCalledWith("job-1", transactionClient);
    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationTemplateVersionId: "template-version-1",
        jobProfileId: "job-1",
        jobTitle: "Backend Intern",
        jobUnderstandingJson: expect.objectContaining({
          coreResponsibilities: ["Build backend API services"],
          interviewFocus: ["API ownership"],
          jobSummary: "Backend internship for HR workflow tools.",
          mustHaveRequirements: ["typescript", "api", "postgres"],
          niceToHaveRequirements: ["docker"],
          risks: ["Availability may be unclear"],
          screeningFocus: ["typescript", "api", "postgres"]
        }),
        jobUnderstandingSummary: "Backend internship for HR workflow tools.",
        templateVersionId: "template-version-1"
      })
    );
    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        jobDescription: expect.stringContaining("Internship duration")
      })
    );
    expect(resumeEvaluationRunRepository.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationId: "eval-1",
        jobProfileId: "job-1",
        jobProfileVersion: "2026-07-04T00:00:00.000Z",
        modelName: "0.1.0",
        modelProvider: "RULE_BASED",
        parsedSnapshotId: "snapshot-1",
        resumeId: "resume-1",
        resumeRevisionId: "revision-1",
        runType: "RULE_BASED",
        status: "SUCCEEDED",
        templateVersionId: "template-version-1"
      })
    );
  });

  it("persists a low-confidence run when rule-based input is insufficient", async () => {
    vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValueOnce({
      id: "revision-1",
      parsedSnapshot: {
        id: "snapshot-1",
        parsedText: "too short"
      },
      resumeId: "resume-1"
    } as never);

    const result = await resumeEvaluationRunService.createQuickScreeningRun("eval-1");

    expect(resumeEvaluationRunRepository.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: "NOT_ENOUGH_EVIDENCE",
        runType: "RULE_BASED",
        status: "SUCCEEDED"
      })
    );
    expect(result.result.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
    expect(result.result.score).toBeLessThan(35);
    expect(result.result.summary).toContain("Rule-based signal only");
  });

  it("does not update selected/latest, CandidateResume, or pipeline state", async () => {
    await resumeEvaluationRunService.createQuickScreeningRun("eval-1");

    expect(transactionClient.resumeEvaluationResult.update).not.toHaveBeenCalled();
    expect(transactionClient.candidateResume.update).not.toHaveBeenCalled();
    expect(resumeEvaluationRepository.updateDraftWithEvent).not.toHaveBeenCalled();
    const createInput = vi.mocked(resumeEvaluationRunRepository.createRun).mock.calls[0]?.[0];

    expect(createInput).not.toHaveProperty("selectedRunId");
    expect(createInput).not.toHaveProperty("latestRunId");
    expect(createInput).not.toHaveProperty("pipeline");
    expect(createInput).not.toHaveProperty("autoReject");
    expect(createInput).not.toHaveProperty("autoHire");
  });
});
