import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  ResumeEvaluationDetailDto,
  ResumeEvaluationListResultDto
} from "@/types/resumeEvaluationResult";

const serviceMock = vi.hoisted(() => ({
  createEvaluation: vi.fn(),
  getEvaluation: vi.fn(),
  getEvaluationOptions: vi.fn(),
  listEvaluations: vi.fn(),
  reopenEvaluation: vi.fn(),
  reviewEvaluation: vi.fn(),
  updateDraftEvaluation: vi.fn()
}));

vi.mock("@/services/resumeEvaluationResult.service", () => ({
  ResumeEvaluationResultServiceError: class ResumeEvaluationResultServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.name = "ResumeEvaluationResultServiceError";
      this.code = code;
    }
  },
  resumeEvaluationResultService: serviceMock
}));

const baseEvaluation: ResumeEvaluationDetailDto = {
  createdAt: "2026-07-01T00:00:00.000Z",
  criterionResults: [],
  evaluatedBy: null,
  events: [],
  id: "eval-1",
  jobProfileId: "jp-1",
  jobProfileVersion: "2026-07-01T00:00:00.000Z",
  overallNote: null,
  resumeId: "resume-1",
  reviewedAt: null,
  revision: 0,
  status: "DRAFT",
  templateVersionId: "tv-1",
  updatedAt: "2026-07-01T00:00:00.000Z"
};

const baseListResult: ResumeEvaluationListResultDto = {
  items: [baseEvaluation],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
};

describe("GET /api/resume-evaluations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list with Cache-Control: no-store", async () => {
    vi.mocked(serviceMock.listEvaluations).mockResolvedValueOnce(baseListResult);

    const { GET } = await import("@/app/api/resume-evaluations/route");
    const request = createGetRequest("http://localhost/api/resume-evaluations");
    const response = await GET(request);
    const json = await readApiJson<ResumeEvaluationListResultDto>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(json.success).toBe(true);
    expect(json.data?.items).toHaveLength(1);
  });

  it("returns 400 for unknown query params", async () => {
    const request = createGetRequest(
      "http://localhost/api/resume-evaluations?unknown=x"
    );
    const { GET } = await import("@/app/api/resume-evaluations/route");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});

describe("POST /api/resume-evaluations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates evaluation and returns 201", async () => {
    vi.mocked(serviceMock.createEvaluation).mockResolvedValueOnce(baseEvaluation);

    const { POST } = await import("@/app/api/resume-evaluations/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations", {
      jobProfileId: "jp-1",
      resumeId: "resume-1",
      templateVersionId: "tv-1"
    });
    const response = await POST(request);
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(201);
    expect(json.data?.id).toBe("eval-1");
  });

  it("returns 400 for missing required fields", async () => {
    const { POST } = await import("@/app/api/resume-evaluations/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations", {
      resumeId: "resume-1"
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 409 on CONFLICT service error", async () => {
    const { ResumeEvaluationResultServiceError } = await import(
      "@/services/resumeEvaluationResult.service"
    );
    vi.mocked(serviceMock.createEvaluation).mockRejectedValueOnce(
      new ResumeEvaluationResultServiceError("CONFLICT", "已存在评估。")
    );

    const { POST } = await import("@/app/api/resume-evaluations/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations", {
      jobProfileId: "jp-1",
      resumeId: "resume-1",
      templateVersionId: "tv-1"
    });
    const response = await POST(request);

    expect(response.status).toBe(409);
  });
});

describe("GET /api/resume-evaluations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns evaluation with Cache-Control: no-store", async () => {
    vi.mocked(serviceMock.getEvaluation).mockResolvedValueOnce(baseEvaluation);

    const { GET } = await import("@/app/api/resume-evaluations/[id]/route");
    const request = createGetRequest("http://localhost/api/resume-evaluations/eval-1");
    const response = await GET(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(json.data?.status).toBe("DRAFT");
  });

  it("returns 404 when not found", async () => {
    const { ResumeEvaluationResultServiceError } = await import(
      "@/services/resumeEvaluationResult.service"
    );
    vi.mocked(serviceMock.getEvaluation).mockRejectedValueOnce(
      new ResumeEvaluationResultServiceError("NOT_FOUND", "评估记录不存在。")
    );

    const { GET } = await import("@/app/api/resume-evaluations/[id]/route");
    const request = createGetRequest("http://localhost/api/resume-evaluations/missing");
    const response = await GET(request, {
      params: Promise.resolve({ id: "missing" })
    });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/resume-evaluations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates draft evaluation", async () => {
    vi.mocked(serviceMock.updateDraftEvaluation).mockResolvedValueOnce({
      ...baseEvaluation,
      overallNote: "整体评估摘要",
      revision: 1
    });

    const { PATCH } = await import("@/app/api/resume-evaluations/[id]/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations/eval-1", {
      expectedRevision: 0,
      overallNote: "整体评估摘要"
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(json.data?.revision).toBe(1);
    expect(serviceMock.updateDraftEvaluation).toHaveBeenCalledWith("eval-1", {
      criterionResults: undefined,
      evaluatedBy: undefined,
      expectedRevision: 0,
      overallNote: "整体评估摘要"
    });
  });
});

describe("POST /api/resume-evaluations/[id]/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reviews evaluation with expected revision", async () => {
    vi.mocked(serviceMock.reviewEvaluation).mockResolvedValueOnce({
      ...baseEvaluation,
      reviewedAt: "2026-07-02T00:00:00.000Z",
      revision: 2,
      status: "REVIEWED"
    });

    const { POST } = await import("@/app/api/resume-evaluations/[id]/review/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations/eval-1/review", {
      actor: "招聘官 A",
      expectedRevision: 1
    });
    const response = await POST(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(json.data?.status).toBe("REVIEWED");
    expect(serviceMock.reviewEvaluation).toHaveBeenCalledWith("eval-1", {
      actor: "招聘官 A",
      expectedRevision: 1
    });
  });
});

describe("POST /api/resume-evaluations/[id]/reopen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reopens evaluation with expected revision and note", async () => {
    vi.mocked(serviceMock.reopenEvaluation).mockResolvedValueOnce({
      ...baseEvaluation,
      revision: 3,
      status: "DRAFT"
    });

    const { POST } = await import("@/app/api/resume-evaluations/[id]/reopen/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations/eval-1/reopen", {
      actor: "招聘官 A",
      expectedRevision: 2,
      note: "重新开放补充证据"
    });
    const response = await POST(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(json.data?.revision).toBe(3);
    expect(serviceMock.reopenEvaluation).toHaveBeenCalledWith("eval-1", {
      actor: "招聘官 A",
      expectedRevision: 2,
      note: "重新开放补充证据"
    });
  });

  it("returns 400 when expectedRevision is missing", async () => {
    const { POST } = await import("@/app/api/resume-evaluations/[id]/reopen/route");
    const request = createJsonRequest("http://localhost/api/resume-evaluations/eval-1/reopen", {
      note: "重新开放补充证据"
    });
    const response = await POST(request, { params: Promise.resolve({ id: "eval-1" }) });

    expect(response.status).toBe(400);
    expect(serviceMock.reopenEvaluation).not.toHaveBeenCalled();
  });
});
