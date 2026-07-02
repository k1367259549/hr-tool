import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  AvailableResumeListDto,
  SafeCandidateResumeDto
} from "@/types/candidateResumeLink";

vi.mock("@/services/candidateResumeLink.service", () => ({
  CandidateResumeLinkServiceError: class CandidateResumeLinkServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.name = "CandidateResumeLinkServiceError";
      this.code = code;
    }
  },
  candidateResumeLinkService: candidateResumeLinkServiceMock
}));

const safeResumeDto: SafeCandidateResumeDto = {
  candidateId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  fileSize: 1024,
  fileType: "PDF",
  id: "resume-id",
  originalName: "resume.pdf",
  parsingStatus: "PARSED"
};

const candidateResumeLinkServiceMock = {
  linkResume: vi.fn(async (): Promise<SafeCandidateResumeDto> => ({
    ...safeResumeDto,
    candidateId: "candidate-id"
  })),
  listAvailableResumes: vi.fn(async (): Promise<AvailableResumeListDto> => ({
    pagination: {
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1
    },
    resumes: [safeResumeDto]
  })),
  listCandidateResumes: vi.fn(async (): Promise<SafeCandidateResumeDto[]> => [
    {
      ...safeResumeDto,
      candidateId: "candidate-id"
    }
  ]),
  unlinkResume: vi.fn(async (): Promise<SafeCandidateResumeDto> => safeResumeDto)
};

describe("Candidate Resume Link API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/candidates/:id/resumes returns safe resume metadata", async () => {
    const { GET } = await import("@/app/api/candidates/[id]/resumes/route");
    const response = await GET(createGetRequest("http://localhost/api/candidates/candidate-id/resumes") as never, {
      params: Promise.resolve({
        id: "candidate-id"
      })
    });
    const json = await readApiJson<SafeCandidateResumeDto[]>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.[0]).not.toHaveProperty("originalFile");
    expect(json.data?.[0]).not.toHaveProperty("parsedText");
  });

  it("GET /api/resumes/available returns paginated available resumes", async () => {
    const { GET } = await import("@/app/api/resumes/available/route");
    const response = await GET(
      createGetRequest("http://localhost/api/resumes/available?search=resume&page=1&pageSize=20") as never
    );
    const json = await readApiJson<AvailableResumeListDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.resumes).toHaveLength(1);
    expect(candidateResumeLinkServiceMock.listAvailableResumes).toHaveBeenCalledWith({
      fileType: undefined,
      page: 1,
      pageSize: 20,
      search: "resume"
    });
  });

  it("POST /api/candidates/:id/resumes links a resume", async () => {
    const { POST } = await import("@/app/api/candidates/[id]/resumes/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/candidates/candidate-id/resumes", {
        resumeId: "resume-id"
      }) as never,
      {
        params: Promise.resolve({
          id: "candidate-id"
        })
      }
    );
    const json = await readApiJson<SafeCandidateResumeDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.candidateId).toBe("candidate-id");
  });

  it("DELETE /api/candidates/:id/resumes/:resumeId unlinks without deleting resume", async () => {
    const { DELETE } = await import("@/app/api/candidates/[id]/resumes/[resumeId]/route");
    const response = await DELETE(
      createGetRequest("http://localhost/api/candidates/candidate-id/resumes/resume-id") as never,
      {
        params: Promise.resolve({
          id: "candidate-id",
          resumeId: "resume-id"
        })
      }
    );
    const json = await readApiJson<SafeCandidateResumeDto>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.candidateId).toBeNull();
  });

  it("returns 400 for invalid link payload", async () => {
    const { POST } = await import("@/app/api/candidates/[id]/resumes/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/candidates/candidate-id/resumes", {
        resumeId: "",
        unknown: true
      }) as never,
      {
        params: Promise.resolve({
          id: "candidate-id"
        })
      }
    );
    const json = await readApiJson<null>(response);

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 and 409 using standard error format", async () => {
    const { CandidateResumeLinkServiceError } = await import("@/services/candidateResumeLink.service");
    const { GET } = await import("@/app/api/candidates/[id]/resumes/route");
    const { POST } = await import("@/app/api/candidates/[id]/resumes/route");

    candidateResumeLinkServiceMock.listCandidateResumes.mockRejectedValueOnce(
      new CandidateResumeLinkServiceError("NOT_FOUND", "候选人不存在。")
    );

    const notFoundResponse = await GET(
      createGetRequest("http://localhost/api/candidates/missing-id/resumes") as never,
      {
        params: Promise.resolve({
          id: "missing-id"
        })
      }
    );
    const notFoundJson = await readApiJson<null>(notFoundResponse);

    expect(notFoundResponse.status).toBe(404);
    expect(notFoundJson.error?.code).toBe("NOT_FOUND");

    candidateResumeLinkServiceMock.linkResume.mockRejectedValueOnce(
      new CandidateResumeLinkServiceError("CONFLICT", "该简历已关联其他候选人。")
    );

    const conflictResponse = await POST(
      createJsonRequest("http://localhost/api/candidates/candidate-id/resumes", {
        resumeId: "resume-id"
      }) as never,
      {
        params: Promise.resolve({
          id: "candidate-id"
        })
      }
    );
    const conflictJson = await readApiJson<null>(conflictResponse);

    expect(conflictResponse.status).toBe(409);
    expect(conflictJson.error?.code).toBe("CONFLICT");
  });
});
