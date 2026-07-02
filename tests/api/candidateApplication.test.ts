import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  ApplicationListResultDto,
  CandidateApplicationDetailDto
} from "@/types/candidateApplication";

vi.mock("@/services/candidateApplication.service", () => ({
  CandidateApplicationServiceError: class CandidateApplicationServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.name = "CandidateApplicationServiceError";
      this.code = code;
    }
  },
  candidateApplicationService: candidateApplicationServiceMock
}));

const applicationDto: CandidateApplicationDetailDto = {
  candidate: {
    fullName: "候选人甲",
    id: "candidate-id",
    owner: "招聘负责人",
    sourceChannel: "内推",
    status: "ACTIVE"
  },
  candidateId: "candidate-id",
  closedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  currentStage: "NEW",
  events: [
    {
      actor: "RECRUITER",
      applicationId: "application-id",
      createdAt: "2026-01-01T00:00:00.000Z",
      eventType: "CREATED",
      fromStage: null,
      id: "event-id",
      note: null,
      toStage: "NEW"
    }
  ],
  id: "application-id",
  jobProfile: {
    hiringGoal: "招 1 人",
    id: "job-id",
    jobTitle: "Synthetic Role",
    reviewedAt: "2026-01-01T00:00:00.000Z"
  },
  jobProfileId: "job-id",
  latestActivityAt: "2026-01-01T00:00:00.000Z",
  notes: null,
  owner: "招聘负责人",
  sourceChannel: "内推",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const candidateApplicationServiceMock = {
  createApplication: vi.fn(async (): Promise<CandidateApplicationDetailDto> => applicationDto),
  getApplication: vi.fn(async (): Promise<CandidateApplicationDetailDto> => applicationDto),
  listApplications: vi.fn(async (): Promise<ApplicationListResultDto> => ({
    applications: [applicationDto],
    metrics: {
      HIRED: 0,
      INTERVIEW: 0,
      NEW: 1,
      OFFER: 0,
      PHONE_SCREEN: 0,
      REJECTED: 0,
      RESUME_SCREEN: 0,
      WITHDRAWN: 0
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1
    }
  })),
  transitionApplicationStage: vi.fn(async (): Promise<CandidateApplicationDetailDto> => ({
    ...applicationDto,
    currentStage: "RESUME_SCREEN"
  })),
  updateApplicationMetadata: vi.fn(async (): Promise<CandidateApplicationDetailDto> => applicationDto)
};

describe("Candidate Application API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/applications returns list with metrics", async () => {
    const { GET } = await import("@/app/api/applications/route");
    const response = await GET(
      createGetRequest("http://localhost/api/applications?status=open&page=1&pageSize=20") as never
    );
    const json = await readApiJson<ApplicationListResultDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.applications[0]).not.toHaveProperty("email");
    expect(json.data?.applications[0]).not.toHaveProperty("phone");
  });

  it("POST /api/applications creates an application", async () => {
    const { POST } = await import("@/app/api/applications/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/applications", {
        candidateId: "candidate-id",
        jobProfileId: "job-id"
      }) as never
    );
    const json = await readApiJson<CandidateApplicationDetailDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.currentStage).toBe("NEW");
  });

  it("GET and PATCH /api/applications/:id use service layer", async () => {
    const { GET, PATCH } = await import("@/app/api/applications/[id]/route");
    const getResponse = await GET(createGetRequest("http://localhost/api/applications/application-id") as never, {
      params: Promise.resolve({
        id: "application-id"
      })
    });
    const patchResponse = await PATCH(
      createJsonRequest("http://localhost/api/applications/application-id", {
        owner: "新负责人"
      }) as never,
      {
        params: Promise.resolve({
          id: "application-id"
        })
      }
    );

    expect(getResponse.status).toBe(200);
    expect(patchResponse.status).toBe(200);
    expect(candidateApplicationServiceMock.updateApplicationMetadata).toHaveBeenCalledWith(
      "application-id",
      {
        notes: undefined,
        owner: "新负责人",
        sourceChannel: undefined
      }
    );
  });

  it("POST /api/applications/:id/transition moves stage", async () => {
    const { POST } = await import("@/app/api/applications/[id]/transition/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/applications/application-id/transition", {
        note: "进入简历筛选",
        toStage: "RESUME_SCREEN"
      }) as never,
      {
        params: Promise.resolve({
          id: "application-id"
        })
      }
    );
    const json = await readApiJson<CandidateApplicationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(json.data?.currentStage).toBe("RESUME_SCREEN");
  });

  it("returns 400 for invalid payload", async () => {
    const { PATCH } = await import("@/app/api/applications/[id]/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/applications/application-id", {
        currentStage: "OFFER"
      }) as never,
      {
        params: Promise.resolve({
          id: "application-id"
        })
      }
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(400);
    expect(json.error?.code).toBe("VALIDATION_ERROR");
  });

  it("maps service NOT_FOUND and CONFLICT to standard errors", async () => {
    const { CandidateApplicationServiceError } = await import("@/services/candidateApplication.service");
    const { GET } = await import("@/app/api/applications/[id]/route");
    const { POST } = await import("@/app/api/applications/[id]/transition/route");

    candidateApplicationServiceMock.getApplication.mockRejectedValueOnce(
      new CandidateApplicationServiceError("NOT_FOUND", "招聘流程不存在。")
    );

    const notFoundResponse = await GET(
      createGetRequest("http://localhost/api/applications/missing-id") as never,
      {
        params: Promise.resolve({
          id: "missing-id"
        })
      }
    );
    const notFoundJson = await readApiJson<null>(notFoundResponse);

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundJson.error?.code).toBe("NOT_FOUND");

    candidateApplicationServiceMock.transitionApplicationStage.mockRejectedValueOnce(
      new CandidateApplicationServiceError("CONFLICT", "不允许的阶段移动。")
    );

    const conflictResponse = await POST(
      createJsonRequest("http://localhost/api/applications/application-id/transition", {
        toStage: "HIRED"
      }) as never,
      {
        params: Promise.resolve({
          id: "application-id"
        })
      }
    );
    const conflictJson = await readApiJson<null>(conflictResponse);

    expect(conflictResponse.status).toBe(409);
    expect(conflictJson.error?.code).toBe("CONFLICT");
  });
});
