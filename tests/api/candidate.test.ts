import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type { CandidateDto, CandidateListResultDto } from "@/types/candidate";

vi.mock("@/services/candidate.service", () => ({
  CandidateServiceError: class CandidateServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.name = "CandidateServiceError";
      this.code = code;
    }
  },
  candidateService: candidateServiceMock
}));

const candidateDto: CandidateDto = {
  archivedAt: null,
  audits: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  currentCompany: "示例科技",
  currentTitle: "前端工程师",
  email: "candidate@example.com",
  fullName: "候选人甲",
  id: "candidate-id",
  latestActivityAt: "2026-01-01T00:00:00.000Z",
  maskedEmail: "c***@example.com",
  maskedPhone: "138****1234",
  notes: "测试备注",
  owner: "招聘负责人",
  phone: "13800001234",
  resumeCount: 0,
  sourceChannel: "内推",
  status: "ACTIVE",
  tags: ["React"],
  targetRoles: ["前端工程师"],
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const candidateListResult: CandidateListResultDto = {
  candidates: [candidateDto],
  counts: {
    active: 1,
    archived: 0,
    talentPool: 0,
    total: 1
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1
  }
};

const candidateServiceMock = {
  archiveCandidate: vi.fn(async (): Promise<CandidateDto> => ({
    ...candidateDto,
    archivedAt: "2026-01-02T00:00:00.000Z",
    status: "ARCHIVED"
  })),
  createCandidate: vi.fn(async (): Promise<CandidateDto> => candidateDto),
  getCandidate: vi.fn(async (): Promise<CandidateDto> => candidateDto),
  listCandidates: vi.fn(async (): Promise<CandidateListResultDto> => candidateListResult),
  restoreCandidate: vi.fn(async (): Promise<CandidateDto> => candidateDto),
  updateCandidate: vi.fn(async (): Promise<CandidateDto> => ({
    ...candidateDto,
    fullName: "候选人乙"
  }))
};

describe("Candidate API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/candidates returns standard list response", async () => {
    const { GET } = await import("@/app/api/candidates/route");
    const response = await GET(createGetRequest("http://localhost/api/candidates") as never);
    const json = await readApiJson<CandidateListResultDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.candidates).toHaveLength(1);
  });

  it("POST /api/candidates creates Candidate", async () => {
    const { POST } = await import("@/app/api/candidates/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/candidates", {
        fullName: "候选人甲"
      }) as never
    );
    const json = await readApiJson<CandidateDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.id).toBe("candidate-id");
  });

  it("GET /api/candidates/:id returns Candidate detail", async () => {
    const { GET } = await import("@/app/api/candidates/[id]/route");
    const response = await GET(createGetRequest("http://localhost/api/candidates/candidate-id") as never, {
      params: Promise.resolve({
        id: "candidate-id"
      })
    });
    const json = await readApiJson<CandidateDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.fullName).toBe("候选人甲");
  });

  it("GET /api/candidates/:id returns standard not found response", async () => {
    const { CandidateServiceError } = await import("@/services/candidate.service");
    const { GET } = await import("@/app/api/candidates/[id]/route");

    candidateServiceMock.getCandidate.mockRejectedValueOnce(
      new CandidateServiceError("NOT_FOUND", "候选人不存在。")
    );

    const response = await GET(createGetRequest("http://localhost/api/candidates/missing-id") as never, {
      params: Promise.resolve({
        id: "missing-id"
      })
    });
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("NOT_FOUND");
  });

  it("PATCH /api/candidates/:id updates Candidate", async () => {
    const { PATCH } = await import("@/app/api/candidates/[id]/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/candidates/candidate-id", {
        fullName: "候选人乙"
      }) as never,
      {
        params: Promise.resolve({
          id: "candidate-id"
        })
      }
    );
    const json = await readApiJson<CandidateDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.fullName).toBe("候选人乙");
  });

  it("DELETE /api/candidates/:id archives Candidate", async () => {
    const { DELETE } = await import("@/app/api/candidates/[id]/route");
    const response = await DELETE(createGetRequest("http://localhost/api/candidates/candidate-id") as never, {
      params: Promise.resolve({
        id: "candidate-id"
      })
    });
    const json = await readApiJson<CandidateDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.status).toBe("ARCHIVED");
  });

  it("POST /api/candidates/:id/restore restores Candidate", async () => {
    const { POST } = await import("@/app/api/candidates/[id]/restore/route");
    const response = await POST(createGetRequest("http://localhost/api/candidates/candidate-id/restore") as never, {
      params: Promise.resolve({
        id: "candidate-id"
      })
    });
    const json = await readApiJson<CandidateDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.status).toBe("ACTIVE");
  });

  it("returns validation error for invalid input", async () => {
    const { POST } = await import("@/app/api/candidates/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/candidates", {
        fullName: ""
      }) as never
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns conflict error with CONFLICT code", async () => {
    const { CandidateServiceError } = await import("@/services/candidate.service");
    const { POST } = await import("@/app/api/candidates/route");

    candidateServiceMock.createCandidate.mockRejectedValueOnce(
      new CandidateServiceError("CONFLICT", "候选人已存在。")
    );

    const response = await POST(
      createJsonRequest("http://localhost/api/candidates", {
        fullName: "候选人甲"
      }) as never
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("CONFLICT");
  });
});
