import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { candidateAuditRepository } from "@/repositories/candidateAudit.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import { candidateResumeRepository } from "@/repositories/candidateResume.repository";
import {
  candidateResumeLinkService,
  CandidateResumeLinkServiceError
} from "@/services/candidateResumeLink.service";
import type { CandidateDetailRecord } from "@/types/candidate";
import type { SafeCandidateResume } from "@/types/candidateResumeLink";

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

vi.mock("@/repositories/candidateResume.repository", () => ({
  candidateResumeRepository: {
    findResumeById: vi.fn(),
    linkResumeToCandidate: vi.fn(),
    listAvailableResumes: vi.fn(),
    listCandidateResumes: vi.fn(),
    unlinkResumeFromCandidate: vi.fn()
  }
}));

vi.mock("@/repositories/candidateAudit.repository", () => ({
  candidateAuditRepository: {
    create: vi.fn()
  }
}));

const transactionClient = {
  tx: "candidate-resume-link-transaction-client"
};

describe("candidateResumeLinkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links resume and writes minimal RESUME_LINKED audit in one transaction", async () => {
    const candidate = createCandidate();
    const unlinkedResume = createResume({ candidateId: null });
    const linkedResume = createResume({ candidateId: candidate.id });

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(candidate);
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(unlinkedResume)
      .mockResolvedValueOnce(linkedResume);
    vi.mocked(candidateResumeRepository.linkResumeToCandidate).mockResolvedValueOnce(1);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit());

    const result = await candidateResumeLinkService.linkResume(candidate.id, {
      resumeId: unlinkedResume.id
    });

    expect(result).toMatchObject({
      candidateId: candidate.id,
      id: unlinkedResume.id,
      originalName: "resume.pdf"
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(candidateRepository.findById).toHaveBeenCalledWith(candidate.id, transactionClient);
    expect(candidateResumeRepository.linkResumeToCandidate).toHaveBeenCalledWith(
      unlinkedResume.id,
      candidate.id,
      transactionClient
    );
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      {
        action: "RESUME_LINKED",
        actor: "RECRUITER",
        afterValue: {
          fileType: "PDF",
          originalName: "resume.pdf",
          resumeId: "resume-id"
        },
        candidateId: candidate.id
      },
      transactionClient
    );
    expect(candidateAuditRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        afterValue: expect.objectContaining({
          email: expect.anything(),
          originalFile: expect.anything(),
          parsedText: expect.anything(),
          phone: expect.anything()
        })
      }),
      expect.anything()
    );
  });

  it("returns idempotently without audit when atomic link count is zero but resume is linked to same candidate", async () => {
    const candidate = createCandidate();

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(candidate);
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(createResume({ candidateId: null }))
      .mockResolvedValueOnce(createResume({ candidateId: candidate.id }));
    vi.mocked(candidateResumeRepository.linkResumeToCandidate).mockResolvedValueOnce(0);

    const result = await candidateResumeLinkService.linkResume(candidate.id, {
      resumeId: "resume-id"
    });

    expect(result.candidateId).toBe(candidate.id);
    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("returns CONFLICT without audit when atomic link count is zero and resume belongs to another candidate", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(createResume({ candidateId: null }))
      .mockResolvedValueOnce(createResume({ candidateId: "other-candidate-id" }));
    vi.mocked(candidateResumeRepository.linkResumeToCandidate).mockResolvedValueOnce(0);

    await expect(
      candidateResumeLinkService.linkResume("candidate-id", {
        resumeId: "resume-id"
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when atomic link count is zero and resume disappeared", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(createResume({ candidateId: null }))
      .mockResolvedValueOnce(null);
    vi.mocked(candidateResumeRepository.linkResumeToCandidate).mockResolvedValueOnce(0);

    await expect(
      candidateResumeLinkService.linkResume("candidate-id", {
        resumeId: "resume-id"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("returns idempotently when resume is already linked to same candidate without audit", async () => {
    const candidate = createCandidate();
    const linkedResume = createResume({ candidateId: candidate.id });

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(candidate);
    vi.mocked(candidateResumeRepository.findResumeById).mockResolvedValueOnce(linkedResume);

    const result = await candidateResumeLinkService.linkResume(candidate.id, {
      resumeId: linkedResume.id
    });

    expect(result.candidateId).toBe(candidate.id);
    expect(candidateResumeRepository.linkResumeToCandidate).not.toHaveBeenCalled();
    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("rejects linking a resume that belongs to another candidate", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById).mockResolvedValueOnce(
      createResume({ candidateId: "other-candidate-id" })
    );

    await expect(
      candidateResumeLinkService.linkResume("candidate-id", {
        resumeId: "resume-id"
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    expect(candidateResumeRepository.linkResumeToCandidate).not.toHaveBeenCalled();
    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("rejects archived candidate linking", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(
      createCandidate({ status: "ARCHIVED" })
    );

    await expect(
      candidateResumeLinkService.linkResume("candidate-id", {
        resumeId: "resume-id"
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<CandidateResumeLinkServiceError>);
  });

  it("returns NOT_FOUND for missing candidate or resume", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(null);

    await expect(
      candidateResumeLinkService.linkResume("missing-candidate-id", {
        resumeId: "resume-id"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById).mockResolvedValueOnce(null);

    await expect(
      candidateResumeLinkService.linkResume("candidate-id", {
        resumeId: "missing-resume-id"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    } satisfies Partial<CandidateResumeLinkServiceError>);
  });

  it("unlinks resume and writes minimal RESUME_UNLINKED audit", async () => {
    const linkedResume = createResume({ candidateId: "candidate-id" });
    const unlinkedResume = createResume({ candidateId: null });

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(linkedResume)
      .mockResolvedValueOnce(unlinkedResume);
    vi.mocked(candidateResumeRepository.unlinkResumeFromCandidate).mockResolvedValueOnce(1);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit());

    const result = await candidateResumeLinkService.unlinkResume("candidate-id", "resume-id");

    expect(result.candidateId).toBeNull();
    expect(candidateResumeRepository.unlinkResumeFromCandidate).toHaveBeenCalledWith(
      "resume-id",
      "candidate-id",
      transactionClient
    );
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      {
        action: "RESUME_UNLINKED",
        actor: "RECRUITER",
        beforeValue: {
          fileType: "PDF",
          originalName: "resume.pdf",
          resumeId: "resume-id"
        },
        candidateId: "candidate-id"
      },
      transactionClient
    );
  });

  it("returns CONFLICT without audit when atomic unlink count is zero and resume is now unlinked", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(createResume({ candidateId: "candidate-id" }))
      .mockResolvedValueOnce(createResume({ candidateId: null }));
    vi.mocked(candidateResumeRepository.unlinkResumeFromCandidate).mockResolvedValueOnce(0);

    await expect(
      candidateResumeLinkService.unlinkResume("candidate-id", "resume-id")
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("returns CONFLICT without audit when atomic unlink count is zero and resume belongs to another candidate", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(createResume({ candidateId: "candidate-id" }))
      .mockResolvedValueOnce(createResume({ candidateId: "other-candidate-id" }));
    vi.mocked(candidateResumeRepository.unlinkResumeFromCandidate).mockResolvedValueOnce(0);

    await expect(
      candidateResumeLinkService.unlinkResume("candidate-id", "resume-id")
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("rejects unlink when resume is not linked to candidate", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById).mockResolvedValueOnce(
      createResume({ candidateId: null })
    );

    await expect(
      candidateResumeLinkService.unlinkResume("candidate-id", "resume-id")
    ).rejects.toMatchObject({
      code: "CONFLICT"
    } satisfies Partial<CandidateResumeLinkServiceError>);

    expect(candidateResumeRepository.unlinkResumeFromCandidate).not.toHaveBeenCalled();
    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });

  it("propagates audit failure as database error so transaction can rollback", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById).mockResolvedValueOnce(
      createResume({ candidateId: null })
    );
    vi.mocked(candidateResumeRepository.findResumeById).mockResolvedValueOnce(
      createResume({ candidateId: "candidate-id" })
    );
    vi.mocked(candidateResumeRepository.linkResumeToCandidate).mockResolvedValueOnce(1);
    vi.mocked(candidateAuditRepository.create).mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      candidateResumeLinkService.linkResume("candidate-id", {
        resumeId: "resume-id"
      })
    ).rejects.toMatchObject({
      code: "DATABASE_ERROR"
    } satisfies Partial<CandidateResumeLinkServiceError>);
  });

  it("propagates audit failure during unlink as database error so transaction can rollback", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidate());
    vi.mocked(candidateResumeRepository.findResumeById)
      .mockResolvedValueOnce(createResume({ candidateId: "candidate-id" }))
      .mockResolvedValueOnce(createResume({ candidateId: null }));
    vi.mocked(candidateResumeRepository.unlinkResumeFromCandidate).mockResolvedValueOnce(1);
    vi.mocked(candidateAuditRepository.create).mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      candidateResumeLinkService.unlinkResume("candidate-id", "resume-id")
    ).rejects.toMatchObject({
      code: "DATABASE_ERROR"
    } satisfies Partial<CandidateResumeLinkServiceError>);
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
    notes: "内部备注",
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

function createResume(overrides: Partial<SafeCandidateResume> = {}): SafeCandidateResume {
  return {
    candidateId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    fileSize: 1024,
    fileType: "PDF",
    id: "resume-id",
    intakeSource: "RESUME_LIBRARY",
    language: null,
    originalName: "resume.pdf",
    parserVersion: "v1",
    parsingStatus: "PARSED",
    ...overrides
  };
}

function createAudit() {
  return {
    action: "RESUME_LINKED" as const,
    actor: "RECRUITER",
    afterValue: null,
    beforeValue: null,
    candidateId: "candidate-id",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    id: "audit-id",
    note: null
  };
}
