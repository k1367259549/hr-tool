import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { candidateAuditRepository } from "@/repositories/candidateAudit.repository";
import { candidateRepository } from "@/repositories/candidate.repository";
import { candidateService, CandidateServiceError } from "@/services/candidate.service";
import type { Candidate, CandidateAudit, CandidateDetailRecord, CandidateListRecord } from "@/types/candidate";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: object) => Promise<unknown>) => callback(transactionClient))
  }
}));

vi.mock("@/repositories/candidate.repository", () => ({
  candidateRepository: {
    archive: vi.fn(),
    countByStatus: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    restore: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock("@/repositories/candidateAudit.repository", () => ({
  candidateAuditRepository: {
    create: vi.fn(),
    findMany: vi.fn()
  }
}));

const transactionClient = {
  tx: "candidate-transaction-client"
};
const baseCandidate = createCandidate();

describe("candidateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates Candidate and writes CREATED audit", async () => {
    const detail = createCandidateDetail();

    vi.mocked(candidateRepository.create).mockResolvedValueOnce(baseCandidate);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("CREATED"));
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(detail);

    const result = await candidateService.createCandidate({
      fullName: "候选人甲"
    });

    expect(result.fullName).toBe("候选人甲");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(candidateRepository.create).toHaveBeenCalledWith(
      {
        fullName: "候选人甲"
      },
      transactionClient
    );
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATED",
        actor: "RECRUITER",
        candidateId: baseCandidate.id
      }),
      transactionClient
    );
  });

  it("updates Candidate and writes UPDATED audit", async () => {
    const updated = createCandidate({ fullName: "候选人乙" });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(createCandidateDetail())
      .mockResolvedValueOnce(createCandidateDetail(updated));
    vi.mocked(candidateRepository.update).mockResolvedValueOnce(updated);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("UPDATED"));

    const result = await candidateService.updateCandidate(baseCandidate.id, {
      fullName: "候选人乙"
    });

    expect(result.fullName).toBe("候选人乙");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(candidateRepository.findById).toHaveBeenNthCalledWith(
      1,
      baseCandidate.id,
      transactionClient
    );
    expect(candidateRepository.update).toHaveBeenCalledWith(
      baseCandidate.id,
      {
        fullName: "候选人乙"
      },
      transactionClient
    );
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATED",
        afterValue: {
          fullName: "候选人乙"
        },
        beforeValue: {
          fullName: "候选人甲"
        }
      }),
      transactionClient
    );
  });

  it("records notes changes in UPDATED audit", async () => {
    const updated = createCandidate({ notes: "新备注" });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(createCandidateDetail())
      .mockResolvedValueOnce(createCandidateDetail(updated));
    vi.mocked(candidateRepository.update).mockResolvedValueOnce(updated);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("UPDATED"));

    await candidateService.updateCandidate(baseCandidate.id, {
      notes: "新备注"
    });

    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        afterValue: {
          notes: "新备注"
        },
        beforeValue: {
          notes: "内部测试备注"
        }
      }),
      transactionClient
    );
  });

  it("records only changed email in UPDATED audit", async () => {
    const updated = createCandidate({ email: "new@example.com" });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(createCandidateDetail())
      .mockResolvedValueOnce(createCandidateDetail(updated));
    vi.mocked(candidateRepository.update).mockResolvedValueOnce(updated);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("UPDATED"));

    await candidateService.updateCandidate(baseCandidate.id, {
      email: "new@example.com"
    });

    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        afterValue: {
          email: "new@example.com"
        },
        beforeValue: {
          email: "candidate@example.com"
        }
      }),
      transactionClient
    );
  });

  it("records only changed phone in UPDATED audit", async () => {
    const updated = createCandidate({ phone: "13900001111" });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(createCandidateDetail())
      .mockResolvedValueOnce(createCandidateDetail(updated));
    vi.mocked(candidateRepository.update).mockResolvedValueOnce(updated);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("UPDATED"));

    await candidateService.updateCandidate(baseCandidate.id, {
      phone: "13900001111"
    });

    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        afterValue: {
          phone: "13900001111"
        },
        beforeValue: {
          phone: "13800001234"
        }
      }),
      transactionClient
    );
  });

  it("does not repeat notes email or phone when only owner changes", async () => {
    const updated = createCandidate({ owner: "新负责人" });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(createCandidateDetail())
      .mockResolvedValueOnce(createCandidateDetail(updated));
    vi.mocked(candidateRepository.update).mockResolvedValueOnce(updated);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("UPDATED"));

    await candidateService.updateCandidate(baseCandidate.id, {
      owner: "新负责人"
    });

    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        afterValue: {
          owner: "新负责人"
        },
        beforeValue: {
          owner: "招聘负责人"
        }
      }),
      transactionClient
    );
  });

  it("skips no-op PATCH without update audit or activity timestamp changes", async () => {
    const detail = createCandidateDetail();

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(detail);

    const result = await candidateService.updateCandidate(baseCandidate.id, {
      email: "candidate@example.com",
      fullName: "候选人甲",
      notes: "内部测试备注",
      owner: "招聘负责人",
      phone: "13800001234",
      tags: ["React"],
      targetRoles: ["前端工程师"]
    });

    expect(candidateRepository.update).not.toHaveBeenCalled();
    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
    expect(result.latestActivityAt).toBe(detail.latestActivityAt.toISOString());
  });

  it("archives Candidate without physical deletion", async () => {
    const archived = createCandidate({
      archivedAt: new Date("2026-01-03T00:00:00.000Z"),
      status: "ARCHIVED"
    });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(createCandidateDetail())
      .mockResolvedValueOnce(createCandidateDetail(archived));
    vi.mocked(candidateRepository.archive).mockResolvedValueOnce(archived);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("ARCHIVED"));

    const result = await candidateService.archiveCandidate(baseCandidate.id);

    expect(result.status).toBe("ARCHIVED");
    expect(candidateRepository.archive).toHaveBeenCalledWith(baseCandidate.id, transactionClient);
    expect(candidateRepository.findById).toHaveBeenCalled();
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ARCHIVED",
        afterValue: {
          archivedAt: "2026-01-03T00:00:00.000Z",
          latestActivityAt: "2026-01-01T00:00:00.000Z",
          status: "ARCHIVED"
        },
        beforeValue: {
          archivedAt: null,
          latestActivityAt: "2026-01-01T00:00:00.000Z",
          status: "ACTIVE"
        }
      }),
      transactionClient
    );
  });

  it("restores Candidate and writes RESTORED audit", async () => {
    const archived = createCandidateDetail({
      archivedAt: new Date("2026-01-03T00:00:00.000Z"),
      status: "ARCHIVED"
    });
    const restored = createCandidate({
      archivedAt: null,
      status: "ACTIVE"
    });

    vi.mocked(candidateRepository.findById)
      .mockResolvedValueOnce(archived)
      .mockResolvedValueOnce(createCandidateDetail(restored));
    vi.mocked(candidateRepository.restore).mockResolvedValueOnce(restored);
    vi.mocked(candidateAuditRepository.create).mockResolvedValueOnce(createAudit("RESTORED"));

    const result = await candidateService.restoreCandidate(baseCandidate.id);

    expect(result.status).toBe("ACTIVE");
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "RESTORED",
        afterValue: {
          archivedAt: null,
          latestActivityAt: "2026-01-01T00:00:00.000Z",
          status: "ACTIVE"
        },
        beforeValue: {
          archivedAt: "2026-01-03T00:00:00.000Z",
          latestActivityAt: "2026-01-01T00:00:00.000Z",
          status: "ARCHIVED"
        }
      }),
      transactionClient
    );
  });

  it("propagates audit failure during create so transaction can rollback", async () => {
    vi.mocked(candidateRepository.create).mockResolvedValueOnce(baseCandidate);
    vi.mocked(candidateAuditRepository.create).mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      candidateService.createCandidate({
        fullName: "候选人甲"
      })
    ).rejects.toMatchObject({
      code: "DATABASE_ERROR"
    } satisfies Partial<CandidateServiceError>);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(candidateRepository.create).toHaveBeenCalledWith(
      {
        fullName: "候选人甲"
      },
      transactionClient
    );
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATED"
      }),
      transactionClient
    );
  });

  it("propagates audit failure during update so transaction can rollback", async () => {
    const updated = createCandidate({ fullName: "候选人乙" });

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidateDetail());
    vi.mocked(candidateRepository.update).mockResolvedValueOnce(updated);
    vi.mocked(candidateAuditRepository.create).mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      candidateService.updateCandidate(baseCandidate.id, {
        fullName: "候选人乙"
      })
    ).rejects.toMatchObject({
      code: "DATABASE_ERROR"
    } satisfies Partial<CandidateServiceError>);

    expect(candidateRepository.update).toHaveBeenCalledWith(
      baseCandidate.id,
      {
        fullName: "候选人乙"
      },
      transactionClient
    );
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATED"
      }),
      transactionClient
    );
  });

  it("propagates audit failure during archive so transaction can rollback", async () => {
    const archived = createCandidate({
      archivedAt: new Date("2026-01-03T00:00:00.000Z"),
      status: "ARCHIVED"
    });

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidateDetail());
    vi.mocked(candidateRepository.archive).mockResolvedValueOnce(archived);
    vi.mocked(candidateAuditRepository.create).mockRejectedValueOnce(new Error("audit failed"));

    await expect(candidateService.archiveCandidate(baseCandidate.id)).rejects.toMatchObject({
      code: "DATABASE_ERROR"
    } satisfies Partial<CandidateServiceError>);

    expect(candidateRepository.archive).toHaveBeenCalledWith(baseCandidate.id, transactionClient);
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ARCHIVED"
      }),
      transactionClient
    );
  });

  it("propagates audit failure during restore so transaction can rollback", async () => {
    const archived = createCandidateDetail({
      archivedAt: new Date("2026-01-03T00:00:00.000Z"),
      status: "ARCHIVED"
    });
    const restored = createCandidate({
      archivedAt: null,
      status: "ACTIVE"
    });

    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(archived);
    vi.mocked(candidateRepository.restore).mockResolvedValueOnce(restored);
    vi.mocked(candidateAuditRepository.create).mockRejectedValueOnce(new Error("audit failed"));

    await expect(candidateService.restoreCandidate(baseCandidate.id)).rejects.toMatchObject({
      code: "DATABASE_ERROR"
    } satisfies Partial<CandidateServiceError>);

    expect(candidateRepository.restore).toHaveBeenCalledWith(baseCandidate.id, transactionClient);
    expect(candidateAuditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "RESTORED"
      }),
      transactionClient
    );
  });

  it("uses repository default list behavior that excludes ARCHIVED", async () => {
    vi.mocked(candidateRepository.findMany).mockResolvedValueOnce({
      candidates: [createCandidateListRecord()],
      total: 1
    });
    vi.mocked(candidateRepository.countByStatus).mockResolvedValueOnce({
      active: 1,
      archived: 1,
      talentPool: 0,
      total: 2
    });

    await candidateService.listCandidates({
      page: 1,
      pageSize: 20
    });

    expect(candidateRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20
    });
  });

  it("passes explicit ARCHIVED filter to repository", async () => {
    vi.mocked(candidateRepository.findMany).mockResolvedValueOnce({
      candidates: [createCandidateListRecord({ status: "ARCHIVED" })],
      total: 1
    });
    vi.mocked(candidateRepository.countByStatus).mockResolvedValueOnce({
      active: 0,
      archived: 1,
      talentPool: 0,
      total: 1
    });

    await candidateService.listCandidates({
      page: 1,
      pageSize: 20,
      status: "ARCHIVED"
    });

    expect(candidateRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: "ARCHIVED"
    });
  });

  it("returns NOT_FOUND when Candidate does not exist", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(null);

    await expect(candidateService.getCandidate("missing")).rejects.toMatchObject({
      code: "NOT_FOUND"
    } satisfies Partial<CandidateServiceError>);
  });

  it("rejects forged archivedAt through ordinary update shape", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidateDetail());

    await expect(
      candidateService.updateCandidate(baseCandidate.id, {
        status: "ARCHIVED"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    } satisfies Partial<CandidateServiceError>);
  });

  it("skips no-op PATCH when arrays have the same normalized values", async () => {
    vi.mocked(candidateRepository.findById).mockResolvedValueOnce(createCandidateDetail());

    await candidateService.updateCandidate(baseCandidate.id, {
      tags: ["React"],
      targetRoles: ["前端工程师"]
    });

    expect(candidateRepository.update).not.toHaveBeenCalled();
    expect(candidateAuditRepository.create).not.toHaveBeenCalled();
  });
});

function createCandidate(overrides: Partial<Candidate> = {}): Candidate {
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    archivedAt: null,
    createdAt: now,
    currentCompany: "示例科技",
    currentTitle: "前端工程师",
    email: "candidate@example.com",
    fullName: "候选人甲",
    id: "candidate-id",
    latestActivityAt: now,
    notes: "内部测试备注",
    owner: "招聘负责人",
    phone: "13800001234",
    sourceChannel: "内推",
    status: "ACTIVE",
    tags: ["React"],
    targetRoles: ["前端工程师"],
    updatedAt: now,
    ...overrides
  };
}

function createCandidateListRecord(overrides: Partial<Candidate> = {}): CandidateListRecord {
  return {
    ...createCandidate(overrides),
    _count: {
      resumes: 0
    }
  };
}

function createCandidateDetail(overrides: Partial<Candidate> = {}): CandidateDetailRecord {
  return {
    ...createCandidate(overrides),
    _count: {
      resumes: 0
    },
    audits: []
  };
}

function createAudit(action: CandidateAudit["action"]): CandidateAudit {
  return {
    action,
    actor: "RECRUITER",
    afterValue: null,
    beforeValue: null,
    candidateId: "candidate-id",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    id: "audit-id",
    note: null
  };
}
