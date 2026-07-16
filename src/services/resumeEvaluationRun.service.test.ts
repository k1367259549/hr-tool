import { beforeEach, describe, expect, it, vi } from "vitest";
import { runEvaluationProvider } from "@/lib/evaluation/provider-runner";
import { RuleBasedEvaluationProvider } from "@/lib/evaluation/rule-based-provider";
import { prisma } from "@/lib/prisma";
import { adaptDetailedScreeningResultToLegacyEvaluationResult } from "@/lib/resume-screening/detailed-screening-contract";
import {
  DetailedScreeningResultV2Schema,
  QuickScreeningResultSchema
} from "@/lib/resume-screening/schema";
import { evaluationTemplateRepository } from "@/repositories/evaluationTemplate.repository";
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
import type {
  EvaluationProvider,
  EvaluationProviderMetadata
} from "@/lib/evaluation/provider-interface";
import type {
  DetailedScreeningResultV2,
  QuickScreeningResult
} from "@/types/resume-screening";

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

vi.mock("@/repositories/evaluationTemplate.repository", () => ({
  evaluationTemplateRepository: {
    findVersionById: vi.fn()
  }
}));

vi.mock("@/repositories/resumeEvaluationRun.repository", () => ({
  resumeEvaluationRunRepository: {
    completeRun: vi.fn(),
    createRun: vi.fn(),
    failRun: vi.fn(),
    findLatestSuccessfulRun: vi.fn(),
    listRunsByEvaluationId: vi.fn()
  }
}));

vi.mock("@/lib/evaluation/provider-runner", () => ({
  runEvaluationProvider: vi.fn()
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
    vi.mocked(resumeEvaluationRunRepository.createRun).mockImplementation(
      async (input) =>
        makeRun({
          completedAt: input.completedAt ?? null,
          modelName: input.modelName ?? null,
          modelProvider: input.modelProvider ?? null,
          parsedOutputJson:
            (input.parsedOutputJson as ResumeEvaluationRunSafeRecord["parsedOutputJson"]) ??
            null,
          rating: input.rating ?? null,
          runType: input.runType,
          score: input.score ?? null,
          status: input.status,
          summary: input.summary ?? null
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
      summary: expect.any(String)
    });
    expect(QuickScreeningResultSchema.safeParse(result.screeningResult).success).toBe(true);
    expect(result.result.recommendation).toBe(result.screeningResult.recommendation);
    expect(result.result.score).toBe(result.screeningResult.overallScore);
    expect(result.result.summary).toBe(result.screeningResult.summary);
    expect(result.result.evidence.length).toBeGreaterThan(0);
    expect(result.result.nextStep).toContain("人工复核");
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
        parsedOutputJson: expect.objectContaining({
          schemaVersion: "m11-a.quick.v1",
          screeningMode: "QUICK"
        }),
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
    expect(result.screeningResult.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
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

describe("resumeEvaluationRunService.createDetailedAnalysisRun", () => {
  beforeEach(() => {
    setupDetailedAnalysisContext();
  });

  it("creates a persisted AI detailed analysis run from the latest allowed quick screening run", async () => {
    const detailedResult = makeValidDetailedScreeningResult();
    const legacyOutput = adaptDetailedScreeningResultToLegacyEvaluationResult(detailedResult);
    const metadata = makeProviderMetadata();

    vi.mocked(runEvaluationProvider).mockResolvedValueOnce({
      detailedScreeningResult: detailedResult,
      metadata,
      output: legacyOutput,
      runId: "detailed-run-1",
      success: true
    });
    vi.mocked(resumeEvaluationRunRepository.completeRun).mockResolvedValueOnce(
      makeRun({
        completedAt: new Date(metadata.completedAt),
        id: "detailed-run-1",
        modelName: "gpt-5.5",
        modelProvider: "OPENAI_COMPATIBLE",
        parsedOutputJson: detailedResult,
        promptVersion: "2.0",
        rating: detailedResult.recommendation,
        runType: "AI",
        score: detailedResult.overallScore,
        status: "SUCCEEDED",
        summary: detailedResult.summary
      })
    );

    const result = await resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
      provider: makeOpenAIProvider()
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.mode).toBe("DETAILED");
      expect(result.runId).toBe("detailed-run-1");
      expect(result.screeningResult).toEqual(detailedResult);
      expect(result.result.overallScore).toBe(detailedResult.overallScore);
      expect(DetailedScreeningResultV2Schema.safeParse(result.screeningResult).success).toBe(
        true
      );
    }

    expect(resumeEvaluationRunRepository.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationId: "eval-1",
        modelProvider: "OPENAI_COMPATIBLE",
        runType: "AI",
        status: "PENDING"
      })
    );
    expect(runEvaluationProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          analysisMode: "DETAILED",
          evaluationCriteria: [
            expect.objectContaining({ key: "backend-api" }),
            expect.objectContaining({ key: "workflow-experience" })
          ],
          jobDescription: expect.stringContaining("Need a backend engineer"),
          jobProfileId: "job-1",
          jobUnderstandingJson: expect.objectContaining({
            mustHaveRequirements: ["typescript", "api", "postgres"]
          }),
          resumeText: expect.stringContaining("Built backend"),
          runId: "detailed-run-1"
        }),
        provider: expect.objectContaining({
          name: "OPENAI_COMPATIBLE"
        })
      })
    );
    expect(resumeEvaluationRunRepository.completeRun).toHaveBeenCalledWith(
      "detailed-run-1",
      expect.objectContaining({
        modelName: "gpt-5.5",
        modelProvider: "OPENAI_COMPATIBLE",
        parsedOutputJson: detailedResult,
        rating: detailedResult.recommendation,
        score: detailedResult.overallScore,
        summary: detailedResult.summary
      })
    );
    expect(resumeEvaluationRunRepository.failRun).not.toHaveBeenCalled();
  });

  it("rejects detailed analysis when quick screening is missing", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([]);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "缺少快速初筛结果，请先完成 Quick Screening。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
    expect(runEvaluationProvider).not.toHaveBeenCalled();
  });

  it("rejects detailed analysis while quick screening is still pending", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun({
        id: "quick-run-1",
        runType: "RULE_BASED",
        status: "PENDING"
      })
    ]);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "快速初筛仍在运行，请完成后再启动详细分析。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("rejects detailed analysis after a failed quick screening run", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun({
        errorCode: "VALIDATION_ERROR",
        errorMessage: "Quick screening failed.",
        id: "quick-run-1",
        runType: "RULE_BASED",
        status: "FAILED"
      })
    ]);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "快速初筛失败，请先重新运行快速初筛。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("rejects damaged quick screening output before calling the provider", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun({
        id: "quick-run-1",
        parsedOutputJson: { recommendation: "UNKNOWN" },
        runType: "RULE_BASED",
        status: "SUCCEEDED"
      })
    ]);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "快速初筛结果格式不完整，请重新运行快速初筛。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("rejects quick recommendations that do not allow detailed analysis", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeQuickRun(
        makeValidQuickScreeningResult({
          recommendation: "NOT_ENOUGH_EVIDENCE",
          shouldEnterDetailedAnalysis: "no"
        })
      )
    ]);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "当前快速初筛建议不允许进入详细分析，请补充信息或重新初筛后再试。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("blocks concurrent pending detailed analysis runs", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun({
        id: "detailed-pending",
        runType: "AI",
        status: "PENDING"
      }),
      makeQuickRun()
    ]);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "当前已有详细分析正在运行，请等待完成后再重试。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("marks the detailed run as FAILED when the provider fails", async () => {
    const metadata = makeProviderMetadata({
      completedAt: "2026-07-04T13:01:30.000Z",
      durationMs: 30_000
    });

    vi.mocked(runEvaluationProvider).mockResolvedValueOnce({
      error: "OpenAI-compatible provider timed out.",
      failureReason: "TIMEOUT",
      metadata,
      runId: "detailed-run-1",
      success: false
    });
    vi.mocked(resumeEvaluationRunRepository.failRun).mockResolvedValueOnce(
      makeRun({
        completedAt: new Date(metadata.completedAt),
        errorCode: "TIMEOUT",
        errorMessage: "OpenAI-compatible provider timed out.",
        id: "detailed-run-1",
        runType: "AI",
        status: "FAILED"
      })
    );

    const result = await resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
      provider: makeOpenAIProvider()
    });

    expect(result).toMatchObject({
      error: "OpenAI-compatible provider timed out.",
      failureReason: "TIMEOUT",
      runId: "detailed-run-1",
      success: false
    });
    expect(resumeEvaluationRunRepository.failRun).toHaveBeenCalledWith(
      "detailed-run-1",
      expect.objectContaining({
        errorCode: "TIMEOUT",
        errorMessage: "OpenAI-compatible provider timed out.",
        modelProvider: "OPENAI_COMPATIBLE"
      })
    );
    expect(resumeEvaluationRunRepository.completeRun).not.toHaveBeenCalled();
  });

  it("marks the detailed run as FAILED when canonical detailed output is invalid", async () => {
    const detailedResult = makeValidDetailedScreeningResult();
    const metadata = makeProviderMetadata();

    vi.mocked(runEvaluationProvider).mockResolvedValueOnce({
      detailedScreeningResult: {
        ...detailedResult,
        recommendation: "AUTO_HIRE"
      } as never,
      metadata,
      output: adaptDetailedScreeningResultToLegacyEvaluationResult(detailedResult),
      runId: "detailed-run-1",
      success: true
    });
    vi.mocked(resumeEvaluationRunRepository.failRun).mockResolvedValueOnce(
      makeRun({
        completedAt: new Date(metadata.completedAt),
        errorCode: "VALIDATION_ERROR",
        errorMessage: "Detailed screening result does not match schema.",
        id: "detailed-run-1",
        runType: "AI",
        status: "FAILED"
      })
    );

    const result = await resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
      provider: makeOpenAIProvider()
    });

    expect(result).toMatchObject({
      failureReason: "VALIDATION_ERROR",
      runId: "detailed-run-1",
      success: false
    });
    expect(resumeEvaluationRunRepository.failRun).toHaveBeenCalledWith(
      "detailed-run-1",
      expect.objectContaining({
        errorCode: "VALIDATION_ERROR"
      })
    );
    expect(resumeEvaluationRunRepository.completeRun).not.toHaveBeenCalled();
  });

  it("requires criteria from the evaluation-bound template version", async () => {
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "评价标准版本不存在。"
    });

    expect(resumeEvaluationRunRepository.createRun).not.toHaveBeenCalled();
    expect(runEvaluationProvider).not.toHaveBeenCalled();
  });

  it.each([
    [
      "missing",
      makeValidDetailedScreeningResult({
        criterionAssessments: [makeValidDetailedScreeningResult().criterionAssessments[0]!]
      }),
      "详细分析遗漏了评价标准 criterionKey。"
    ],
    [
      "unknown",
      makeValidDetailedScreeningResult({
        criterionAssessments: [
          ...makeValidDetailedScreeningResult().criterionAssessments,
          {
            ...makeValidDetailedScreeningResult().criterionAssessments[1]!,
            criterionKey: "unknown-key"
          }
        ]
      }),
      "详细分析返回了未知的 criterionKey。"
    ],
    [
      "duplicate",
      makeValidDetailedScreeningResult({
        criterionAssessments: [
          makeValidDetailedScreeningResult().criterionAssessments[0]!,
          { ...makeValidDetailedScreeningResult().criterionAssessments[0]! }
        ]
      }),
      "详细分析返回了重复的 criterionKey。"
    ],
    [
      "rewritten",
      makeValidDetailedScreeningResult({
        criterionAssessments: [
          {
            ...makeValidDetailedScreeningResult().criterionAssessments[0]!,
            criterionKey: "backend_api"
          },
          makeValidDetailedScreeningResult().criterionAssessments[1]!
        ]
      }) as never,
      "Detailed screening result does not match the current V2 contract."
    ]
  ])("marks the detailed run FAILED for %s criterion output", async (_name, output, error) => {
    const metadata = makeProviderMetadata();

    vi.mocked(runEvaluationProvider).mockResolvedValueOnce({
      detailedScreeningResult: output,
      metadata,
      output: adaptDetailedScreeningResultToLegacyEvaluationResult(
        makeValidDetailedScreeningResult()
      ),
      runId: "detailed-run-1",
      success: true
    });
    vi.mocked(resumeEvaluationRunRepository.failRun).mockResolvedValueOnce(
      makeRun({ id: "detailed-run-1", runType: "AI", status: "FAILED" })
    );

    await expect(
      resumeEvaluationRunService.createDetailedAnalysisRun("eval-1", {
        provider: makeOpenAIProvider()
      })
    ).resolves.toMatchObject({
      error,
      failureReason: "VALIDATION_ERROR",
      success: false
    });
    expect(resumeEvaluationRunRepository.completeRun).not.toHaveBeenCalled();
  });
});

describe("resumeEvaluationRunService.getLatestDetailedAnalysisRunByEvaluationId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest successful detailed analysis run from canonical parsed output", async () => {
    const detailedResult = makeValidDetailedScreeningResult({
      overallScore: 86,
      recommendation: "MANUAL_REVIEW"
    });

    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun({
        completedAt: new Date("2026-07-04T14:01:00.000Z"),
        id: "detailed-run-latest",
        modelName: "gpt-5.5",
        modelProvider: "OPENAI_COMPATIBLE",
        parsedOutputJson: detailedResult,
        promptVersion: "1.0",
        rating: "MANUAL_REVIEW",
        runType: "AI",
        score: 86,
        status: "SUCCEEDED",
        summary: detailedResult.summary
      }),
      makeQuickRun()
    ]);

    const result =
      await resumeEvaluationRunService.getLatestDetailedAnalysisRunByEvaluationId(
        "eval-1"
      );

    expect(result?.success).toBe(true);

    if (result?.success) {
      expect(result.runId).toBe("detailed-run-latest");
      expect(result.screeningResult).toEqual(detailedResult);
      expect(result.result.overallScore).toBe(86);
      expect(result.metadata.providerName).toBe("OPENAI_COMPATIBLE");
      expect(result.metadata.model).toBe("gpt-5.5");
    }
  });

  it("returns null when there is no successful detailed analysis run", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeQuickRun()
    ]);

    await expect(
      resumeEvaluationRunService.getLatestDetailedAnalysisRunByEvaluationId("eval-1")
    ).resolves.toBeNull();
  });

  it("rejects damaged historical detailed output with a controlled validation error", async () => {
    vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValueOnce([
      makeRun({
        id: "detailed-run-damaged",
        parsedOutputJson: { schemaVersion: "unknown" },
        runType: "AI",
        status: "SUCCEEDED"
      })
    ]);

    await expect(
      resumeEvaluationRunService.getLatestDetailedAnalysisRunByEvaluationId("eval-1")
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "历史详细分析结果格式不完整，请重新运行详细分析。"
    });
  });
});

function setupDetailedAnalysisContext(
  runs: ResumeEvaluationRunSafeRecord[] = [makeQuickRun()]
): void {
  vi.clearAllMocks();
  transactionClient.candidateResume.update.mockClear();
  transactionClient.resumeEvaluationResult.update.mockClear();
  vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValue(makeEvaluation());
  vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValue({
    id: "revision-1",
    parsedSnapshot: {
      id: "snapshot-1",
      parsedText:
        "Built backend TypeScript API services with postgres and workflow automation for HR tools."
    },
    resumeId: "resume-1"
  } as never);
  vi.mocked(jobProfileRepository.findById).mockResolvedValue(makeJobProfile() as never);
  vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValue({
    criteria: [
      {
        description: "Build and maintain TypeScript backend APIs.",
        evidenceGuidance: "Use direct resume evidence about API ownership.",
        importance: "REQUIRED",
        key: "backend-api",
        label: "Backend API"
      },
      {
        description: "Explain workflow service experience relevant to the role.",
        importance: "PREFERRED",
        key: "workflow-experience",
        label: "Workflow Experience"
      }
    ]
  } as never);
  vi.mocked(resumeEvaluationRunRepository.listRunsByEvaluationId).mockResolvedValue(runs);
  vi.mocked(resumeEvaluationRunRepository.createRun).mockResolvedValue(
    makeRun({
      id: "detailed-run-1",
      modelProvider: "OPENAI_COMPATIBLE",
      runType: "AI",
      status: "PENDING"
    })
  );
}

function makeOpenAIProvider(): EvaluationProvider {
  return {
    name: "OPENAI_COMPATIBLE",
    version: "openai-compatible-test-v1",
    async evaluate() {
      throw new Error("Provider should be called through runEvaluationProvider mock.");
    }
  };
}

function makeProviderMetadata(
  overrides: Partial<EvaluationProviderMetadata> = {}
): EvaluationProviderMetadata {
  return {
    completedAt: "2026-07-04T13:01:00.000Z",
    durationMs: 1000,
    model: "gpt-5.5",
    promptFile: "prompts/detailed-analysis.md",
    promptVersion: "2.0",
    providerName: "OPENAI_COMPATIBLE" as const,
    providerVersion: "openai-compatible-test-v1",
    startedAt: "2026-07-04T13:00:59.000Z",
    ...overrides
  };
}

function makeQuickRun(
  quickResult: QuickScreeningResult = makeValidQuickScreeningResult()
): ResumeEvaluationRunSafeRecord {
  return makeRun({
    id: "quick-run-1",
    parsedOutputJson: quickResult,
    rating: quickResult.recommendation,
    runType: "RULE_BASED",
    score: quickResult.overallScore,
    status: "SUCCEEDED",
    summary: quickResult.summary
  });
}

function makeValidQuickScreeningResult(
  overrides: Partial<QuickScreeningResult> = {}
): QuickScreeningResult {
  return {
    dimensions: [
      {
        conclusion: "Backend API experience maps to the role.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Backend API experience",
            source: "RESUME",
            text: "Built backend TypeScript API services."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: [],
        name: "JD Match",
        risks: [],
        score: 78
      }
    ],
    educationPass: "unclear",
    evidence: [
      {
        id: "ev_backend_api",
        relatedRequirement: "Backend API experience",
        source: "RESUME",
        text: "Built backend TypeScript API services."
      }
    ],
    fullTimeBachelor: "unclear",
    interviewQuestions: ["Please describe your backend API ownership."],
    mainRisk: "Availability still needs confirmation.",
    missingInformation: ["Availability is not visible."],
    nextStep: "Proceed to detailed analysis and recruiter review.",
    notes: null,
    overallScore: 78,
    priority: "A",
    reasons: ["Backend API evidence is present."],
    recommendation: "PROCEED_TO_NEXT_STEP",
    risks: [
      {
        description: "Availability still needs confirmation.",
        severity: "medium",
        title: "Availability missing"
      }
    ],
    robotArmRelevance: "unclear",
    schemaVersion: "m11-a.quick.v1",
    screeningMode: "QUICK",
    shouldEnterDetailedAnalysis: "yes",
    strengths: ["Backend API evidence is present."],
    summary: "Quick screening found enough backend evidence to enter detailed analysis.",
    ...overrides
  };
}

function makeValidDetailedScreeningResult(
  overrides: Partial<DetailedScreeningResultV2> = {}
): DetailedScreeningResultV2 {
  return {
    dimensions: [
      {
        conclusion:
          "The resume explicitly names TypeScript API service work that maps to the backend JD.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "TypeScript backend API experience",
            source: "RESUME",
            text: "Built backend TypeScript API services."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: [],
        name: "JD Match",
        risks: [],
        score: 86
      },
      {
        conclusion:
          "The HR workflow project context is relevant to the recruiting tooling role.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Backend workflow services",
            source: "RESUME",
            text: "Built backend TypeScript API services."
          }
        ],
        key: "experience_quality",
        matchLevel: "high",
        missingInformation: ["Availability is not visible."],
        name: "Experience Quality",
        risks: ["Ownership depth needs interview confirmation."],
        score: 82
      }
    ],
    contractVersion: "detailed-screening.v2",
    criterionAssessments: [
      {
        conclusion:
          "The resume explicitly names TypeScript API service work that maps to the backend API criterion.",
        criterionKey: "backend-api",
        criterionLabel: "Backend API",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "TypeScript backend API experience",
            source: "RESUME",
            text: "Built backend TypeScript API services."
          }
        ],
        interviewQuestions: ["Which API design responsibilities did you own?"],
        missingInformation: [],
        risks: [],
        score: 86
      },
      {
        conclusion:
          "The workflow automation experience is relevant to the workflow experience criterion.",
        criterionKey: "workflow-experience",
        criterionLabel: "Workflow Experience",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Workflow service experience",
            source: "RESUME",
            text: "Built backend TypeScript API services."
          }
        ],
        interviewQuestions: [],
        missingInformation: [],
        risks: [],
        score: 82
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relatedRequirement: "TypeScript backend API experience",
        source: "RESUME",
        text: "Built backend TypeScript API services."
      },
      {
        id: "ev_missing_availability",
        relatedRequirement: "Internship availability",
        source: "MISSING_INFORMATION",
        text: "Availability and weekly attendance are not visible in the resume."
      }
    ],
    interviewQuestions: [
      "Please walk through the backend API project and your direct responsibilities.",
      "What is your availability, internship duration, and weekly attendance?"
    ],
    missingInformation: ["Availability and weekly attendance are not visible."],
    nextStep: "Recruiter should manually confirm ownership depth and availability.",
    notes: null,
    overallScore: 84,
    recommendation: "PROCEED_TO_NEXT_STEP",
    risks: [
      {
        description: "Availability is missing and must be confirmed before proceeding.",
        severity: "medium",
        title: "Availability missing"
      }
    ],
    schemaVersion: "m11-a.detailed.v2",
    screeningMode: "DETAILED",
    strengths: ["Backend TypeScript API experience maps to the JD."],
    summary:
      "The candidate has relevant backend TypeScript API evidence for the role, while availability and ownership depth still need recruiter confirmation.",
    weaknesses: ["Availability and exact ownership depth are not explicit."],
    ...overrides
  };
}
