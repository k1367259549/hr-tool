import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { applicationEventRepository } from "@/repositories/applicationEvent.repository";
import { candidateApplicationRepository } from "@/repositories/candidateApplication.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import {
  candidateApplicationService,
  CandidateApplicationServiceError
} from "@/services/candidateApplication.service";
import type {
  ApplicationDetailRecord,
  ApplicationListRecord,
  ApplicationStage
} from "@/types/candidateApplication";
import type { CandidateDetailRecord } from "@/types/candidate";
import type { JobProfile } from "@/types/jobProfile";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) => callback(transactionClient))
  }
}));

vi.mock("@/repositories/candidate.repository", () => ({
  candidateRepository: {
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/candidateApplication.repository", () => ({
  candidateApplicationRepository: {
    countByStage: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findDetailedById: vi.fn(),
    list: vi.fn(),
    transitionStage: vi.fn(),
    updateMetadata: vi.fn()
  }
}));

vi.mock("@/repositories/applicationEvent.repository", () => ({
  applicationEventRepository: {
    create: vi.fn(),
    listEvents: vi.fn()
  }
}));

const transactionClient = {
  tx: "candidate-application-transaction-client"
};

describe("candidateApplicationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates application and CREATED event in one transaction", async () => {
    const candidate = createCandidate();
    const jobProfile = createJobProfile();
    const application = createApplicationDetail();

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(candidate);
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(jobProfile);
    vi.mocked(candidateApplicationRepository.create).mockResolvedValueOnce(application);
    vi.mocked(applicationEventRepository.create).mockResolvedValueOnce(createEvent());
    vi.mocked(candidateApplicationRepository.findDetailedById).mockResolvedValueOnce(application);

    const result = await candidateApplicationService.createApplication({
      candidateId: candidate.id,
      jobProfileId: jobProfile.id,
      owner: "招聘负责人"
    });

    expect(result.currentStage).toBe("NEW");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(candidateRepository.findById).toHaveBeenCalledWith(candidate.id, transactionClient);
    expect(jobProfileRepository.findById).toHaveBeenCalledWith(jobProfile.id, transactionClient);
    expect(applicationEventRepository.create).toHaveBeenCalledWith(
      {
        actor: "RECRUITER",
        applicationId: application.id,
        eventType: "CREATED",
        toStage: "NEW"
      },
      transactionClient
    );
  });

  it("rejects missing candidate, archived candidate, missing job, and unreviewed job", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(null);
    await expect(
      candidateApplicationService.createApplication({
        candidateId: "missing",
        jobProfileId: "job-id"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<CandidateApplicationServiceError>);

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate({ status: "ARCHIVED" }));
    await expect(
      candidateApplicationService.createApplication({
        candidateId: "candidate-id",
        jobProfileId: "job-id"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<CandidateApplicationServiceError>);

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(null);
    await expect(
      candidateApplicationService.createApplication({
        candidateId: "candidate-id",
        jobProfileId: "missing-job"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<CandidateApplicationServiceError>);

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(jobProfileRepository.findById).mockResolvedValueOnce(createJobProfile({ reviewedAt: null }));
    await expect(
      candidateApplicationService.createApplication({
        candidateId: "candidate-id",
        jobProfileId: "job-id"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<CandidateApplicationServiceError>);
  });

  it("no-op metadata update skips database write and event creation", async () => {
    const application = createApplicationDetail({
      notes: "note",
      owner: "owner",
      sourceChannel: "referral"
    });

    vi.mocked(candidateApplicationRepository.findDetailedById).mockResolvedValueOnce(application);

    const result = await candidateApplicationService.updateApplicationMetadata("application-id", {
      notes: "note",
      owner: "owner",
      sourceChannel: "referral"
    });

    expect(result.id).toBe("application-id");
    expect(candidateApplicationRepository.updateMetadata).not.toHaveBeenCalled();
    expect(applicationEventRepository.create).not.toHaveBeenCalled();
  });

  it("transitions stage atomically and writes STAGE_CHANGED event", async () => {
    const existing = createApplicationList({
      currentStage: "RESUME_SCREEN"
    });
    const transitioned = createApplicationDetail({
      currentStage: "PHONE_SCREEN"
    });

    vi.mocked(candidateApplicationRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(candidateApplicationRepository.transitionStage).mockResolvedValueOnce(1);
    vi.mocked(applicationEventRepository.create).mockResolvedValueOnce(createEvent());
    vi.mocked(candidateApplicationRepository.findDetailedById).mockResolvedValueOnce(transitioned);

    const result = await candidateApplicationService.transitionApplicationStage("application-id", {
      note: "电话沟通通过",
      toStage: "PHONE_SCREEN"
    });

    expect(result.currentStage).toBe("PHONE_SCREEN");
    expect(candidateApplicationRepository.transitionStage).toHaveBeenCalledWith(
      "application-id",
      "RESUME_SCREEN",
      "PHONE_SCREEN",
      expect.any(Date),
      transactionClient
    );
    expect(applicationEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "STAGE_CHANGED",
        fromStage: "RESUME_SCREEN",
        toStage: "PHONE_SCREEN"
      }),
      transactionClient
    );
  });

  it("rejects illegal and terminal transitions", async () => {
    vi.mocked(candidateApplicationRepository.findById).mockResolvedValueOnce(createApplicationList());
    await expect(
      candidateApplicationService.transitionApplicationStage("application-id", {
        toStage: "HIRED"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<CandidateApplicationServiceError>);

    vi.mocked(candidateApplicationRepository.findById).mockResolvedValueOnce(
      createApplicationList({ currentStage: "HIRED" })
    );
    await expect(
      candidateApplicationService.transitionApplicationStage("application-id", {
        toStage: "OFFER"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<CandidateApplicationServiceError>);
  });

  it("classifies stale transition count zero as conflict without event", async () => {
    vi.mocked(candidateApplicationRepository.findById)
      .mockResolvedValueOnce(createApplicationList({ currentStage: "RESUME_SCREEN" }))
      .mockResolvedValueOnce(createApplicationList({ currentStage: "INTERVIEW" }));
    vi.mocked(candidateApplicationRepository.transitionStage).mockResolvedValueOnce(0);

    await expect(
      candidateApplicationService.transitionApplicationStage("application-id", {
        toStage: "PHONE_SCREEN"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<CandidateApplicationServiceError>);

    expect(applicationEventRepository.create).not.toHaveBeenCalled();
  });

  it("propagates event failure as database error so transaction can rollback", async () => {
    vi.mocked(candidateApplicationRepository.findById).mockResolvedValueOnce(
      createApplicationList({ currentStage: "RESUME_SCREEN" })
    );
    vi.mocked(candidateApplicationRepository.transitionStage).mockResolvedValueOnce(1);
    vi.mocked(applicationEventRepository.create).mockRejectedValueOnce(new Error("event failed"));

    await expect(
      candidateApplicationService.transitionApplicationStage("application-id", {
        toStage: "PHONE_SCREEN"
      })
    ).rejects.toMatchObject({ code: "DATABASE_ERROR" } satisfies Partial<CandidateApplicationServiceError>);
  });
});

function createCandidate(overrides: Partial<CandidateDetailRecord> = {}): CandidateDetailRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    _count: {
      resumes: 0
    },
    archivedAt: null,
    audits: [],
    createdAt: now,
    currentCompany: "示例科技",
    currentTitle: "工程师",
    email: "candidate@example.com",
    fullName: "候选人甲",
    id: "candidate-id",
    latestActivityAt: now,
    notes: null,
    owner: "招聘负责人",
    phone: "13800001234",
    sourceChannel: "内推",
    status: "ACTIVE",
    tags: [],
    targetRoles: [],
    updatedAt: now,
    ...overrides
  };
}

function createJobProfile(overrides: Partial<JobProfile> = {}): JobProfile {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    aiModel: "test-model",
    aiProvider: "test-provider",
    coreResponsibilities: [],
    createdAt: now,
    generationTimeMs: null,
    hiringFocus: [],
    hiringGoal: "招 1 人",
    id: "job-id",
    interviewFocus: [],
    jd: "Synthetic JD.",
    jobSummary: "Synthetic role.",
    jobTitle: "Synthetic Role",
    leaderRequirements: null,
    missingInformation: [],
    notes: null,
    potentialRisks: [],
    preferredCompetencies: [],
    promptFile: "test.md",
    promptVersion: "test",
    requiredCompetencies: [],
    reviewedAt: now,
    suggestedFollowUpQuestions: [],
    teamBackground: null,
    updatedAt: now,
    workflowId: "workflow-id",
    ...overrides
  };
}

function createApplicationList(overrides: Partial<ApplicationListRecord> = {}): ApplicationListRecord {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    candidate: {
      fullName: "候选人甲",
      id: "candidate-id",
      owner: "招聘负责人",
      sourceChannel: "内推",
      status: "ACTIVE"
    },
    candidateId: "candidate-id",
    closedAt: null,
    createdAt: now,
    currentStage: "NEW",
    id: "application-id",
    jobProfile: {
      hiringGoal: "招 1 人",
      id: "job-id",
      jobTitle: "Synthetic Role",
      reviewedAt: now
    },
    jobProfileId: "job-id",
    latestActivityAt: now,
    notes: null,
    owner: "招聘负责人",
    sourceChannel: "内推",
    updatedAt: now,
    ...overrides
  };
}

function createApplicationDetail(overrides: Partial<ApplicationDetailRecord> = {}): ApplicationDetailRecord {
  return {
    ...createApplicationList(overrides),
    events: overrides.events ?? [createEvent()]
  };
}

function createEvent(overrides: Partial<ApplicationDetailRecord["events"][number]> = {}) {
  return {
    actor: "RECRUITER",
    applicationId: "application-id",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    eventType: "CREATED" as const,
    fromStage: null,
    id: "event-id",
    note: null,
    toStage: "NEW" as ApplicationStage,
    ...overrides
  };
}
