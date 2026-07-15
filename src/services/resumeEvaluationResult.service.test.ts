import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import { evaluationTemplateRepository } from "@/repositories/evaluationTemplate.repository";
import { jobProfileEvaluationAssignmentRepository } from "@/repositories/jobProfileEvaluationAssignment.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { resumeEvaluationRepository } from "@/repositories/resumeEvaluation.repository";
import { resumeEvaluationRunRepository } from "@/repositories/resumeEvaluationRun.repository";
import { resumeRevisionRepository } from "@/repositories/resumeRevision.repository";
import {
  isResumeEvaluationContextUniqueViolation,
  resumeEvaluationResultService,
  ResumeEvaluationResultServiceError
} from "@/services/resumeEvaluationResult.service";
import type {
  ResumeCriterionResult,
  ResumeEvaluationResultDetailRecord
} from "@/types/resumeEvaluationResult";

const transactionClient = {
  candidateResume: {
    update: vi.fn()
  },
  resumeEvaluationResult: {
    update: vi.fn()
  },
  resumeEvaluationRun: {
    delete: vi.fn(),
    update: vi.fn()
  },
  tx: "resume-evaluation-transaction-client"
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) =>
      callback(transactionClient)
    )
  }
}));

vi.mock("@/repositories/candidateResume.repository", () => ({
  candidateResumeRepository: {
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/evaluationTemplate.repository", () => ({
  evaluationTemplateRepository: {
    findVersionById: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfileEvaluationAssignment.repository", () => ({
  jobProfileEvaluationAssignmentRepository: {
    findActiveAssignment: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/resumeEvaluation.repository", () => ({
  resumeEvaluationRepository: {
    createWithEvent: vi.fn(),
    findDetailById: vi.fn(),
    findEvaluationForReview: vi.fn(),
    findEvaluationForSelectedRunUpdate: vi.fn(),
    list: vi.fn(),
    listEvaluationOptions: vi.fn(),
    reopenWithEvent: vi.fn(),
    recordDetailedAnalysisReview: vi.fn(),
    reviewWithEvent: vi.fn(),
    updateReview: vi.fn(),
    updateSelectedRun: vi.fn(),
    updateDraftWithEvent: vi.fn()
  }
}));

vi.mock("@/repositories/resumeEvaluationRun.repository", () => ({
  resumeEvaluationRunRepository: {
    findRunById: vi.fn(),
    findLatestSuccessfulRun: vi.fn(),
    findRunForSelection: vi.fn()
  }
}));

vi.mock("@/repositories/resumeRevision.repository", () => ({
  resumeRevisionRepository: {
    findLatestRevisionWithSnapshot: vi.fn(),
    findRevisionWithSnapshotById: vi.fn(),
    findSnapshotWithRevisionById: vi.fn()
  }
}));

function makeResume(overrides?: object) {
  return {
    id: "resume-1",
    parsingStatus: "PARSED",
    updatedAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides
  };
}

function makeJobProfile(overrides?: object) {
  return {
    id: "jp-1",
    jobTitle: "Backend Engineer",
    reviewedAt: new Date("2026-07-01T00:00:00Z"),
    updatedAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides
  };
}

function makeAssignment(overrides?: object) {
  return {
    id: "assign-1",
    templateVersionId: "tv-1",
    ...overrides
  };
}

function makeTemplateVersion(overrides?: object) {
  return {
    criteria: [
      {
        description: "Backend API evidence",
        importance: "REQUIRED",
        key: "backend-api",
        label: "Backend API"
      }
    ],
    id: "tv-1",
    status: "PUBLISHED",
    template: { id: "tmpl-1", name: "Backend Eval", status: "ACTIVE" },
    ...overrides
  };
}

function makeEvaluation(overrides?: object): ResumeEvaluationResultDetailRecord {
  return {
    id: "eval-1",
    criterionResults: makeCriterionResults(),
    createdAt: new Date("2026-07-01T00:00:00Z"),
    evaluatedBy: null,
    events: [],
    jobProfileId: "jp-1",
    jobProfileVersion: "2026-07-01T00:00:00.000Z",
    overallNote: "整体评估摘要",
    parsedSnapshotId: null,
    resumeId: "resume-1",
    resumeRevisionId: null,
    reviewedAt: null,
    reviewedBy: null,
    reviewedRunId: null,
    reviewerDecision: null,
    reviewerNotes: null,
    revision: 0,
    selectedRunId: null,
    status: "DRAFT",
    templateVersionId: "tv-1",
    updatedAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides
  } as ResumeEvaluationResultDetailRecord;
}

function makeCriterionResults(
  overrides?: Partial<ResumeCriterionResult>
): ResumeCriterionResult[] {
  return [
    {
      assessment: "SUPPORTED",
      criterionKey: "backend-api",
      evidenceNotes: ["有后端 API 经验"],
      ...overrides
    }
  ];
}

function makeSelectionEvaluation(overrides?: object) {
  return {
    id: "eval-1",
    jobProfileId: "jp-1",
    jobProfileVersion: "2026-07-01T00:00:00.000Z",
    resumeId: "resume-1",
    selectedRunId: null,
    templateVersionId: "tv-1",
    ...overrides
  };
}

function makeReviewEvaluation(overrides?: object) {
  return {
    id: "eval-1",
    jobProfileId: "jp-1",
    jobProfileVersion: "2026-07-01T00:00:00.000Z",
    resumeId: "resume-1",
    reviewedAt: null,
    reviewedBy: null,
    reviewedRunId: null,
    reviewerDecision: null,
    reviewerNotes: null,
    selectedRunId: "run-1",
    templateVersionId: "tv-1",
    ...overrides
  };
}

function makeSelectableRun(overrides?: object) {
  return {
    evaluationId: "eval-1",
    id: "run-1",
    jobProfileId: "jp-1",
    jobProfileVersion: "2026-07-01T00:00:00.000Z",
    parsedOutputJson: makeDetailedScreeningResult(),
    resumeId: "resume-1",
    runType: "AI",
    status: "SUCCEEDED",
    templateVersionId: "tv-1",
    ...overrides
  };
}

function makeDetailedScreeningResult() {
  return {
    dimensions: [
      {
        conclusion: "The resume names TypeScript API work relevant to the role.",
        evidence: [
          {
            id: "ev_api",
            relatedRequirement: "Backend API experience",
            source: "RESUME",
            text: "Built TypeScript API services."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: [],
        name: "JD Match",
        risks: [],
        score: 82
      }
    ],
    evidence: [
      {
        id: "ev_api",
        relatedRequirement: "Backend API experience",
        source: "RESUME",
        text: "Built TypeScript API services."
      }
    ],
    interviewQuestions: ["Please describe your API ownership."],
    missingInformation: [],
    nextStep: "Recruiter should manually confirm the project scope.",
    notes: null,
    overallScore: 82,
    recommendation: "MANUAL_REVIEW",
    risks: [],
    schemaVersion: "m11-a.detailed.v1",
    screeningMode: "DETAILED",
    strengths: ["Relevant TypeScript API experience."],
    summary: "The resume includes relevant TypeScript API experience that should be verified by a recruiter.",
    weaknesses: ["Project scope is not fully specified."]
  };
}

function makeP2002(target: unknown) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    clientVersion: "test",
    code: "P2002",
    meta: { target }
  });
}

describe("isResumeEvaluationContextUniqueViolation", () => {
  it("recognizes field array targets regardless of order", () => {
    expect(
      isResumeEvaluationContextUniqueViolation(
        makeP2002(["resumeId", "jobProfileId", "templateVersionId", "jobProfileVersion"])
      )
    ).toBe(true);
    expect(
      isResumeEvaluationContextUniqueViolation(
        makeP2002(["templateVersionId", "jobProfileVersion", "resumeId", "jobProfileId"])
      )
    ).toBe(true);
  });

  it("rejects incomplete, extra, unrelated, and non-P2002 targets", () => {
    expect(isResumeEvaluationContextUniqueViolation(makeP2002(["resumeId", "jobProfileId"]))).toBe(false);
    expect(
      isResumeEvaluationContextUniqueViolation(
        makeP2002(["resumeId", "jobProfileId", "templateVersionId", "jobProfileVersion", "extra"])
      )
    ).toBe(false);
    expect(isResumeEvaluationContextUniqueViolation(makeP2002("Other_unique_key"))).toBe(false);
    expect(isResumeEvaluationContextUniqueViolation(new Error("not prisma"))).toBe(false);
  });

  it("recognizes database and Prisma compound unique names", () => {
    expect(isResumeEvaluationContextUniqueViolation(makeP2002("ResumeEvaluationResult_context_key"))).toBe(true);
    expect(isResumeEvaluationContextUniqueViolation(makeP2002("resumeEvaluationContext"))).toBe(true);
  });
});

describe("resumeEvaluationResultService.createEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeRevisionRepository.findLatestRevisionWithSnapshot).mockResolvedValue({
      id: "revision-1",
      parsedSnapshot: {
        id: "snapshot-1"
      }
    } as never);
    vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValue({
      id: "explicit-revision",
      parsedSnapshot: {
        id: "explicit-snapshot"
      }
    } as never);
    vi.mocked(resumeRevisionRepository.findSnapshotWithRevisionById).mockResolvedValue({
      id: "explicit-snapshot",
      revisionId: "explicit-revision"
    } as never);
  });

  it("creates evaluation in a transaction", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment() as never
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeEvaluationRepository.createWithEvent).mockResolvedValueOnce(
      makeEvaluation()
    );

    const result = await resumeEvaluationResultService.createEvaluation({
      jobProfileId: "jp-1",
      resumeId: "resume-1",
      templateVersionId: "tv-1"
    });

    expect(result.status).toBe("DRAFT");
    expect(result.revision).toBe(0);
    expect(result.resumeRevisionId).toBeNull();
    expect(result.parsedSnapshotId).toBeNull();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(resumeEvaluationRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        parsedSnapshotId: "snapshot-1",
        resumeRevisionId: "revision-1"
      }),
      "2026-07-01T00:00:00.000Z",
      [
        {
          assessment: "NOT_ASSESSED",
          criterionKey: "backend-api",
          evidenceNotes: []
        }
      ],
      null,
      transactionClient
    );
  });

  it("persists explicit resumeRevisionId and parsedSnapshotId when provided", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment() as never
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeEvaluationRepository.createWithEvent).mockResolvedValueOnce(
      makeEvaluation({
        parsedSnapshotId: "explicit-snapshot",
        resumeRevisionId: "explicit-revision"
      })
    );

    const result = await resumeEvaluationResultService.createEvaluation({
      jobProfileId: "jp-1",
      parsedSnapshotId: "explicit-snapshot",
      resumeId: "resume-1",
      resumeRevisionId: "explicit-revision",
      templateVersionId: "tv-1"
    });

    expect(result.resumeRevisionId).toBe("explicit-revision");
    expect(result.parsedSnapshotId).toBe("explicit-snapshot");
    expect(resumeRevisionRepository.findSnapshotWithRevisionById).toHaveBeenCalledWith(
      "explicit-snapshot",
      transactionClient
    );
    expect(resumeRevisionRepository.findLatestRevisionWithSnapshot).not.toHaveBeenCalled();
    expect(resumeEvaluationRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        parsedSnapshotId: "explicit-snapshot",
        resumeRevisionId: "explicit-revision"
      }),
      expect.any(String),
      expect.any(Array),
      null,
      transactionClient
    );
  });

  it("uses the specified resumeRevisionId and its own parsed snapshot", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment() as never
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeRevisionRepository.findRevisionWithSnapshotById).mockResolvedValueOnce({
      id: "revision-only",
      parsedSnapshot: {
        id: "snapshot-for-revision"
      }
    } as never);
    vi.mocked(resumeEvaluationRepository.createWithEvent).mockResolvedValueOnce(
      makeEvaluation({
        parsedSnapshotId: "snapshot-for-revision",
        resumeRevisionId: "revision-only"
      })
    );

    await resumeEvaluationResultService.createEvaluation({
      jobProfileId: "jp-1",
      resumeId: "resume-1",
      resumeRevisionId: "revision-only",
      templateVersionId: "tv-1"
    });

    expect(resumeEvaluationRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        parsedSnapshotId: "snapshot-for-revision",
        resumeRevisionId: "revision-only"
      }),
      expect.any(String),
      expect.any(Array),
      null,
      transactionClient
    );
    expect(resumeRevisionRepository.findLatestRevisionWithSnapshot).not.toHaveBeenCalled();
  });

  it("uses the specified parsedSnapshotId and its own revision", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment() as never
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeRevisionRepository.findSnapshotWithRevisionById).mockResolvedValueOnce({
      id: "snapshot-only",
      revisionId: "revision-for-snapshot"
    } as never);
    vi.mocked(resumeEvaluationRepository.createWithEvent).mockResolvedValueOnce(
      makeEvaluation({
        parsedSnapshotId: "snapshot-only",
        resumeRevisionId: "revision-for-snapshot"
      })
    );

    await resumeEvaluationResultService.createEvaluation({
      jobProfileId: "jp-1",
      parsedSnapshotId: "snapshot-only",
      resumeId: "resume-1",
      templateVersionId: "tv-1"
    });

    expect(resumeEvaluationRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        parsedSnapshotId: "snapshot-only",
        resumeRevisionId: "revision-for-snapshot"
      }),
      expect.any(String),
      expect.any(Array),
      null,
      transactionClient
    );
    expect(resumeRevisionRepository.findLatestRevisionWithSnapshot).not.toHaveBeenCalled();
  });

  it("rejects mismatched explicit resumeRevisionId and parsedSnapshotId", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment() as never
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeRevisionRepository.findSnapshotWithRevisionById).mockResolvedValueOnce({
      id: "explicit-snapshot",
      revisionId: "other-revision"
    } as never);

    await expect(
      resumeEvaluationResultService.createEvaluation({
        jobProfileId: "jp-1",
        parsedSnapshotId: "explicit-snapshot",
        resumeId: "resume-1",
        resumeRevisionId: "explicit-revision",
        templateVersionId: "tv-1"
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRepository.createWithEvent).not.toHaveBeenCalled();
  });

  it("keeps creation compatible with null refs when no revision or snapshot exists", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment() as never
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeRevisionRepository.findLatestRevisionWithSnapshot).mockResolvedValueOnce(null);
    vi.mocked(resumeEvaluationRepository.createWithEvent).mockResolvedValueOnce(
      makeEvaluation()
    );

    await resumeEvaluationResultService.createEvaluation({
      jobProfileId: "jp-1",
      resumeId: "resume-1",
      templateVersionId: "tv-1"
    });

    expect(resumeEvaluationRepository.createWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        parsedSnapshotId: null,
        resumeRevisionId: null
      }),
      expect.any(String),
      expect.any(Array),
      null,
      transactionClient
    );
  });

  it("throws NOT_FOUND if resume does not exist", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationResultService.createEvaluation({
        jobProfileId: "jp-1",
        resumeId: "missing",
        templateVersionId: "tv-1"
      })
    ).rejects.toThrow(ResumeEvaluationResultServiceError);
  });

  it("throws CONFLICT if resume is not PARSED", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(
      makeResume({ parsingStatus: "PENDING" }) as never
    );

    await expect(
      resumeEvaluationResultService.createEvaluation({
        jobProfileId: "jp-1",
        resumeId: "resume-1",
        templateVersionId: "tv-1"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws CONFLICT if job profile is not reviewed", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(
      makeJobProfile({ reviewedAt: null }) as never
    );

    await expect(
      resumeEvaluationResultService.createEvaluation({
        jobProfileId: "jp-1",
        resumeId: "resume-1",
        templateVersionId: "tv-1"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws CONFLICT if no active assignment", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationResultService.createEvaluation({
        jobProfileId: "jp-1",
        resumeId: "resume-1",
        templateVersionId: "tv-1"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws CONFLICT if templateVersionId does not match active assignment", async () => {
    vi.mocked(candidateResumeRepository.findById).mockResolvedValueOnce(makeResume() as never);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(makeJobProfile() as never);
    vi.mocked(jobProfileEvaluationAssignmentRepository.findActiveAssignment).mockResolvedValueOnce(
      makeAssignment({ templateVersionId: "other-tv" }) as never
    );

    await expect(
      resumeEvaluationResultService.createEvaluation({
        jobProfileId: "jp-1",
        resumeId: "resume-1",
        templateVersionId: "tv-1"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("resumeEvaluationResultService.selectRunForReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeEvaluationRepository.findEvaluationForSelectedRunUpdate).mockResolvedValue(
      makeSelectionEvaluation() as never
    );
    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValue(
      makeSelectableRun() as never
    );
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValue(
      makeEvaluation({ selectedRunId: "run-1" })
    );
    vi.mocked(resumeEvaluationRepository.updateSelectedRun).mockResolvedValue(
      undefined as never
    );
  });

  it("sets selectedRunId to a SUCCEEDED run under the same evaluation", async () => {
    const result = await resumeEvaluationResultService.selectRunForReview("eval-1", "run-1");

    expect(result.selectedRunId).toBe("run-1");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(resumeEvaluationRepository.findEvaluationForSelectedRunUpdate).toHaveBeenCalledWith(
      "eval-1",
      transactionClient
    );
    expect(resumeEvaluationRunRepository.findRunForSelection).toHaveBeenCalledWith(
      "run-1",
      transactionClient
    );
    expect(resumeEvaluationRepository.updateSelectedRun).toHaveBeenCalledWith(
      "eval-1",
      "run-1",
      transactionClient
    );
  });

  it("clears selectedRunId without reading or deleting run history", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ selectedRunId: null })
    );

    const result = await resumeEvaluationResultService.selectRunForReview("eval-1", null);

    expect(result.selectedRunId).toBeNull();
    expect(resumeEvaluationRunRepository.findRunForSelection).not.toHaveBeenCalled();
    expect(resumeEvaluationRepository.updateSelectedRun).toHaveBeenCalledWith(
      "eval-1",
      null,
      transactionClient
    );
    expect(transactionClient.resumeEvaluationRun.delete).not.toHaveBeenCalled();
  });

  it("rejects a missing selected run", async () => {
    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationResultService.selectRunForReview("eval-1", "missing-run")
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(resumeEvaluationRepository.updateSelectedRun).not.toHaveBeenCalled();
  });

  it("rejects a run from a different evaluation", async () => {
    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
      makeSelectableRun({ evaluationId: "other-eval" }) as never
    );

    await expect(
      resumeEvaluationResultService.selectRunForReview("eval-1", "run-1")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects FAILED and PENDING runs", async () => {
    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
      makeSelectableRun({ status: "FAILED" }) as never
    );

    await expect(
      resumeEvaluationResultService.selectRunForReview("eval-1", "failed-run")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
      makeSelectableRun({ status: "PENDING" }) as never
    );

    await expect(
      resumeEvaluationResultService.selectRunForReview("eval-1", "pending-run")
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRepository.updateSelectedRun).not.toHaveBeenCalled();
  });

  it("rejects context mismatches", async () => {
    const mismatchCases = [
      { resumeId: "other-resume" },
      { jobProfileId: "other-job" },
      { templateVersionId: "other-template" },
      { jobProfileVersion: "other-version" }
    ];

    for (const mismatch of mismatchCases) {
      vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
        makeSelectableRun(mismatch) as never
      );

      await expect(
        resumeEvaluationResultService.selectRunForReview("eval-1", "run-1")
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    }

    expect(resumeEvaluationRepository.updateSelectedRun).not.toHaveBeenCalled();
  });

  it("does not write ResumeEvaluationRun, CandidateResume, or latest successful state", async () => {
    await resumeEvaluationResultService.selectRunForReview("eval-1", "run-1");

    expect(transactionClient.resumeEvaluationRun.update).not.toHaveBeenCalled();
    expect(transactionClient.resumeEvaluationRun.delete).not.toHaveBeenCalled();
    expect(transactionClient.candidateResume.update).not.toHaveBeenCalled();
    expect(resumeEvaluationRunRepository.findLatestSuccessfulRun).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when evaluation master does not exist", async () => {
    vi.mocked(resumeEvaluationRepository.findEvaluationForSelectedRunUpdate).mockResolvedValueOnce(
      null
    );

    await expect(
      resumeEvaluationResultService.selectRunForReview("missing-eval", "run-1")
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(resumeEvaluationRepository.updateSelectedRun).not.toHaveBeenCalled();
  });
});

  describe("resumeEvaluationResultService.reviewDetailedAnalysisRun", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValue(
        makeEvaluation() as never
      );
      vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValue(
        makeSelectableRun() as never
      );
      vi.mocked(resumeEvaluationRunRepository.findRunById).mockResolvedValue(
        makeSelectableRun() as never
      );
      vi.mocked(resumeEvaluationRepository.recordDetailedAnalysisReview).mockResolvedValue(
        1 as never
      );
    });

    it("accepts a completed canonical detailed run as a human evaluation reference", async () => {
      const result = await resumeEvaluationResultService.reviewDetailedAnalysisRun(
        "eval-1",
        "run-1",
        {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 0,
          reviewer: "Recruiter A"
        }
      );

      expect(result.criterionResults).toMatchObject(makeCriterionResults());
      expect(result.overallNote).toBe("整体评估摘要");
      expect(result.status).toBe("DRAFT");
      expect(resumeEvaluationRepository.recordDetailedAnalysisReview).toHaveBeenCalledWith(
        "eval-1",
        0,
        expect.objectContaining({
          reviewer: "Recruiter A",
          selectedRunId: "run-1"
        }),
        transactionClient
      );
      expect(resumeEvaluationRepository.updateReview).not.toHaveBeenCalled();
      expect(resumeEvaluationRepository.reviewWithEvent).not.toHaveBeenCalled();
    });

    it("requires a reviewer and notes for revision or rejection", async () => {
      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 0,
          reviewer: " "
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "NEEDS_REVISION",
          expectedRevision: 0,
          reviewer: "Recruiter A"
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "REJECTED",
          expectedRevision: 0,
          note: "Evidence does not support the conclusion.",
          reviewer: "Recruiter A"
        })
      ).resolves.toMatchObject({ id: "eval-1" });
    });

    it("rejects quick, unfinished, foreign, and malformed detailed runs", async () => {
      const invalidRuns = [
        makeSelectableRun({ status: "PENDING" }),
        makeSelectableRun({ status: "FAILED" }),
        makeSelectableRun({ evaluationId: "other-evaluation" })
      ];

      for (const run of invalidRuns) {
        vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
          run as never
        );

        await expect(
          resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
            decision: "ACCEPTED_AS_REFERENCE",
            expectedRevision: 0,
            reviewer: "Recruiter A"
          })
        ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
      }

      expect(resumeEvaluationRepository.recordDetailedAnalysisReview).not.toHaveBeenCalled();

      vi.mocked(resumeEvaluationRunRepository.findRunById).mockResolvedValueOnce(
        makeSelectableRun({ runType: "RULE_BASED" }) as never
      );
      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 0,
          reviewer: "Recruiter A"
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      vi.mocked(resumeEvaluationRunRepository.findRunById).mockResolvedValueOnce(
        makeSelectableRun({ parsedOutputJson: { screeningMode: "DETAILED" } }) as never
      );
      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 0,
          reviewer: "Recruiter A"
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("treats an identical stale request as idempotent but rejects conflicting stale review", async () => {
      const auditFields = [
        "detailed-analysis-review",
        "runId:run-1",
        "decision:ACCEPTED_AS_REFERENCE",
        "reference:selected",
        "selectedRunId"
      ];
      vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
        makeEvaluation({
          events: [
            {
              actor: "Recruiter A",
              changedFields: auditFields,
              createdAt: new Date("2026-07-05T00:00:00.000Z"),
              evaluationId: "eval-1",
              eventType: "UPDATED",
              id: "event-1",
              note: null
            }
          ],
          revision: 1,
          selectedRunId: "run-1"
        })
      );

      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 0,
          reviewer: "Recruiter A"
        })
      ).resolves.toMatchObject({ selectedRunId: "run-1" });

      expect(resumeEvaluationRepository.recordDetailedAnalysisReview).not.toHaveBeenCalled();

      vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
        makeEvaluation({
          events: [
            {
              actor: "Recruiter A",
              changedFields: auditFields,
              createdAt: new Date("2026-07-05T00:00:00.000Z"),
              evaluationId: "eval-1",
              eventType: "UPDATED",
              id: "event-1",
              note: null
            }
          ],
          revision: 1,
          selectedRunId: "run-1"
        })
      );

      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "REJECTED",
          expectedRevision: 0,
          note: "Different action.",
          reviewer: "Recruiter A"
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("does not allow changing a reference after the human evaluation is REVIEWED", async () => {
      vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
        makeEvaluation({ status: "REVIEWED", revision: 1 })
      );

      await expect(
        resumeEvaluationResultService.reviewDetailedAnalysisRun("eval-1", "run-1", {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 1,
          reviewer: "Recruiter A"
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });

      expect(resumeEvaluationRunRepository.findRunForSelection).not.toHaveBeenCalled();
    });
  });

  describe("resumeEvaluationResultService.submitReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionClient.candidateResume.update.mockClear();
    transactionClient.resumeEvaluationResult.update.mockClear();
    transactionClient.resumeEvaluationRun.delete.mockClear();
    transactionClient.resumeEvaluationRun.update.mockClear();
    vi.mocked(resumeEvaluationRepository.findEvaluationForReview).mockResolvedValue(
      makeReviewEvaluation() as never
    );
    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValue(
      makeSelectableRun() as never
    );
    vi.mocked(resumeEvaluationRepository.updateReview).mockResolvedValue(
      undefined as never
    );
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValue(
      makeEvaluation({
        reviewedAt: new Date("2026-07-04T17:00:00.000Z"),
        reviewedBy: "kgj",
        reviewedRunId: "run-1",
        reviewerDecision: "PASS",
        reviewerNotes: "Looks good",
        selectedRunId: "run-1"
      })
    );
  });

  it("writes reviewedRunId from selectedRunId for run-backed review", async () => {
    const result = await resumeEvaluationResultService.submitReview("eval-1", {
      actor: "kgj",
      reviewerDecision: "PASS",
      reviewerNotes: "Looks good"
    });

    expect(result).toMatchObject({
      reviewedBy: "kgj",
      reviewedRunId: "run-1",
      reviewerDecision: "PASS",
      reviewerNotes: "Looks good",
      selectedRunId: "run-1"
    });
    expect(resumeEvaluationRepository.findEvaluationForReview).toHaveBeenCalledWith(
      "eval-1",
      transactionClient
    );
    expect(resumeEvaluationRunRepository.findRunForSelection).toHaveBeenCalledWith(
      "run-1",
      transactionClient
    );
    expect(resumeEvaluationRepository.updateReview).toHaveBeenCalledWith(
      "eval-1",
      expect.objectContaining({
        reviewedBy: "kgj",
        reviewedRunId: "run-1",
        reviewerDecision: "PASS",
        reviewerNotes: "Looks good"
      }),
      transactionClient
    );
  });

  it("defaults manualReviewWithoutRunBasis to false and rejects review without selectedRunId", async () => {
    vi.mocked(resumeEvaluationRepository.findEvaluationForReview).mockResolvedValueOnce(
      makeReviewEvaluation({ selectedRunId: null }) as never
    );

    await expect(
      resumeEvaluationResultService.submitReview("eval-1", {
        reviewerDecision: "HOLD"
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRepository.updateReview).not.toHaveBeenCalled();
  });

  it("allows explicit manual review without run basis when notes are provided", async () => {
    vi.mocked(resumeEvaluationRepository.findEvaluationForReview).mockResolvedValueOnce(
      makeReviewEvaluation({ selectedRunId: null }) as never
    );
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({
        reviewedAt: new Date("2026-07-04T17:00:00.000Z"),
        reviewedBy: "kgj",
        reviewedRunId: null,
        reviewerDecision: "NEEDS_MORE_INFO",
        reviewerNotes: "Manual offline review",
        selectedRunId: null
      })
    );

    const result = await resumeEvaluationResultService.submitReview("eval-1", {
      actor: "kgj",
      manualReviewWithoutRunBasis: true,
      reviewerDecision: "NEEDS_MORE_INFO",
      reviewerNotes: "Manual offline review"
    });

    expect(result.reviewedRunId).toBeNull();
    expect(resumeEvaluationRunRepository.findRunForSelection).not.toHaveBeenCalled();
    expect(resumeEvaluationRepository.updateReview).toHaveBeenCalledWith(
      "eval-1",
      expect.objectContaining({
        reviewedRunId: null,
        reviewerDecision: "NEEDS_MORE_INFO",
        reviewerNotes: "Manual offline review"
      }),
      transactionClient
    );
  });

  it("rejects manual review without notes", async () => {
    vi.mocked(resumeEvaluationRepository.findEvaluationForReview).mockResolvedValueOnce(
      makeReviewEvaluation({ selectedRunId: null }) as never
    );

    await expect(
      resumeEvaluationResultService.submitReview("eval-1", {
        manualReviewWithoutRunBasis: true,
        reviewerDecision: "PASS",
        reviewerNotes: " "
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRepository.updateReview).not.toHaveBeenCalled();
  });

  it("rejects invalid reviewerDecision", async () => {
    await expect(
      resumeEvaluationResultService.submitReview("eval-1", {
        reviewerDecision: "INVALID" as never
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(resumeEvaluationRunRepository.findRunForSelection).not.toHaveBeenCalled();
    expect(resumeEvaluationRepository.updateReview).not.toHaveBeenCalled();
  });

  it("rejects missing, non-succeeded, and mismatched selected runs", async () => {
    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationResultService.submitReview("eval-1", {
        reviewerDecision: "PASS"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
      makeSelectableRun({ status: "FAILED" }) as never
    );

    await expect(
      resumeEvaluationResultService.submitReview("eval-1", {
        reviewerDecision: "PASS"
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
      makeSelectableRun({ status: "PENDING" }) as never
    );

    await expect(
      resumeEvaluationResultService.submitReview("eval-1", {
        reviewerDecision: "PASS"
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const mismatchCases = [
      { evaluationId: "other-eval" },
      { resumeId: "other-resume" },
      { jobProfileId: "other-job" },
      { templateVersionId: "other-template" },
      { jobProfileVersion: "other-version" }
    ];

    for (const mismatch of mismatchCases) {
      vi.mocked(resumeEvaluationRunRepository.findRunForSelection).mockResolvedValueOnce(
        makeSelectableRun(mismatch) as never
      );

      await expect(
        resumeEvaluationResultService.submitReview("eval-1", {
          reviewerDecision: "PASS"
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    }

    expect(resumeEvaluationRepository.updateReview).not.toHaveBeenCalled();
  });

  it("allows overwriting reviewerDecision and updates reviewedAt and reviewedBy", async () => {
    vi.mocked(resumeEvaluationRepository.findEvaluationForReview).mockResolvedValueOnce(
      makeReviewEvaluation({
        reviewedAt: new Date("2026-07-04T16:00:00.000Z"),
        reviewedBy: "old-reviewer",
        reviewedRunId: "old-run",
        reviewerDecision: "HOLD",
        reviewerNotes: "Old notes"
      }) as never
    );

    await resumeEvaluationResultService.submitReview("eval-1", {
      actor: "new-reviewer",
      reviewerDecision: "REJECT",
      reviewerNotes: "Updated notes"
    });

    expect(resumeEvaluationRepository.updateReview).toHaveBeenCalledWith(
      "eval-1",
      expect.objectContaining({
        reviewedAt: expect.any(Date),
        reviewedBy: "new-reviewer",
        reviewedRunId: "run-1",
        reviewerDecision: "REJECT",
        reviewerNotes: "Updated notes"
      }),
      transactionClient
    );
  });

  it("does not update selectedRunId, ResumeEvaluationRun, CandidateResume, or AI/provider state", async () => {
    await resumeEvaluationResultService.submitReview("eval-1", {
      actor: "kgj",
      reviewerDecision: "PASS"
    });

    expect(resumeEvaluationRepository.updateSelectedRun).not.toHaveBeenCalled();
    expect(transactionClient.resumeEvaluationRun.update).not.toHaveBeenCalled();
    expect(transactionClient.resumeEvaluationRun.delete).not.toHaveBeenCalled();
    expect(transactionClient.candidateResume.update).not.toHaveBeenCalled();
    expect(resumeEvaluationRunRepository.findLatestSuccessfulRun).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when evaluation master does not exist", async () => {
    vi.mocked(resumeEvaluationRepository.findEvaluationForReview).mockResolvedValueOnce(null);

    await expect(
      resumeEvaluationResultService.submitReview("missing-eval", {
        reviewerDecision: "PASS"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(resumeEvaluationRepository.updateReview).not.toHaveBeenCalled();
  });
});

describe("resumeEvaluationResultService.reviewEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks DRAFT evaluation as REVIEWED", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(makeEvaluation());
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );
    vi.mocked(resumeEvaluationRepository.reviewWithEvent).mockResolvedValueOnce(1);
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ status: "REVIEWED", revision: 1, reviewedAt: new Date() })
    );

    const result = await resumeEvaluationResultService.reviewEvaluation("eval-1", {
      actor: "招聘官 A",
      expectedRevision: 0
    });

    expect(result.status).toBe("REVIEWED");
  });

  it("rejects review when stored criterion keys are inconsistent or not assessed", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({
        criterionResults: [
          {
            assessment: "SUPPORTED",
            criterionKey: "other-key",
            evidenceNotes: []
          }
        ]
      })
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );

    await expect(
      resumeEvaluationResultService.reviewEvaluation("eval-1", { expectedRevision: 0 })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({
        criterionResults: makeCriterionResults({ assessment: "NOT_ASSESSED" })
      })
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      makeTemplateVersion() as never
    );

    await expect(
      resumeEvaluationResultService.reviewEvaluation("eval-1", { expectedRevision: 0 })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws CONFLICT if evaluation is not DRAFT", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ status: "REVIEWED" })
    );

    await expect(
      resumeEvaluationResultService.reviewEvaluation("eval-1", { expectedRevision: 0 })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws CONFLICT on revision mismatch", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ revision: 5 })
    );

    await expect(
      resumeEvaluationResultService.reviewEvaluation("eval-1", { expectedRevision: 0 })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("resumeEvaluationResultService.reopenEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reopens REVIEWED evaluation to DRAFT", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ status: "REVIEWED", revision: 1 })
    );
    vi.mocked(resumeEvaluationRepository.reopenWithEvent).mockResolvedValueOnce(1);
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ revision: 2 })
    );

    const result = await resumeEvaluationResultService.reopenEvaluation("eval-1", {
      expectedRevision: 1,
      note: "重新开放"
    });

    expect(result.status).toBe("DRAFT");
    expect(resumeEvaluationRepository.reopenWithEvent).toHaveBeenCalledWith(
      "eval-1",
      1,
      null,
      "重新开放",
      transactionClient
    );
  });

  it("throws CONFLICT if evaluation is not REVIEWED", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValueOnce(
      makeEvaluation({ status: "DRAFT" })
    );

    await expect(
      resumeEvaluationResultService.reopenEvaluation("eval-1", {
        expectedRevision: 0,
        note: "重新开放"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("classifies stale reopen revision as conflict without overwriting state", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById)
      .mockResolvedValueOnce(makeEvaluation({ status: "REVIEWED", revision: 3 }))
      .mockResolvedValueOnce(makeEvaluation({ status: "REVIEWED", revision: 3 }));
    vi.mocked(resumeEvaluationRepository.reopenWithEvent).mockResolvedValueOnce(0);

    await expect(
      resumeEvaluationResultService.reopenEvaluation("eval-1", {
        expectedRevision: 1,
        note: "旧客户端重开"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("resumeEvaluationResultService.updateDraftEvaluation criterion alignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts complete shuffled criterionResults and normalizes to template order", async () => {
    const templateVersion = makeTemplateVersion({
      criteria: [
        {
          description: "Education",
          importance: "REQUIRED",
          key: "education",
          label: "Education"
        },
        {
          description: "Experience",
          importance: "PREFERRED",
          key: "experience",
          label: "Experience"
        }
      ]
    });
    vi.mocked(resumeEvaluationRepository.findDetailById)
      .mockResolvedValueOnce(makeEvaluation({ criterionResults: [] }))
      .mockResolvedValueOnce(
        makeEvaluation({
          criterionResults: [
            { assessment: "SUPPORTED", criterionKey: "education", evidenceNotes: [] },
            { assessment: "PARTIALLY_SUPPORTED", criterionKey: "experience", evidenceNotes: [] }
          ],
          revision: 1
        })
      );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValueOnce(
      templateVersion as never
    );
    vi.mocked(resumeEvaluationRepository.updateDraftWithEvent).mockResolvedValueOnce(1);

    await resumeEvaluationResultService.updateDraftEvaluation("eval-1", {
      criterionResults: [
        { assessment: "PARTIALLY_SUPPORTED", criterionKey: "experience", evidenceNotes: [] },
        { assessment: "SUPPORTED", criterionKey: "education", evidenceNotes: [] }
      ],
      expectedRevision: 0
    });

    expect(resumeEvaluationRepository.updateDraftWithEvent).toHaveBeenCalledWith(
      "eval-1",
      0,
      [
        { assessment: "SUPPORTED", criterionKey: "education", evidenceNotes: [] },
        { assessment: "PARTIALLY_SUPPORTED", criterionKey: "experience", evidenceNotes: [] }
      ],
      undefined,
      undefined,
      ["criterionResults"],
      null,
      transactionClient
    );
  });

  it("rejects missing, extra, and valid-but-unconfigured criterion keys", async () => {
    vi.mocked(resumeEvaluationRepository.findDetailById).mockResolvedValue(
      makeEvaluation({ criterionResults: [] })
    );
    vi.mocked(evaluationTemplateRepository.findVersionById).mockResolvedValue(
      makeTemplateVersion() as never
    );

    await expect(
      resumeEvaluationResultService.updateDraftEvaluation("eval-1", {
        criterionResults: [],
        expectedRevision: 0
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      resumeEvaluationResultService.updateDraftEvaluation("eval-1", {
        criterionResults: [
          ...makeCriterionResults(),
          { assessment: "SUPPORTED" as const, criterionKey: "salary", evidenceNotes: [] }
        ],
        expectedRevision: 0
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      resumeEvaluationResultService.updateDraftEvaluation("eval-1", {
        criterionResults: [
          {
            assessment: "SUPPORTED" as const,
            criterionKey: "valid-but-missing",
            evidenceNotes: []
          }
        ],
        expectedRevision: 0
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
