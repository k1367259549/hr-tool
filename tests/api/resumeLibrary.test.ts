import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  ResumeDetailDto,
  ResumeListItemDto,
  ResumeListResultDto,
  ResumeUploadResultDto
} from "@/types/resumeLibrary";

const resumeLibraryServiceMock = vi.hoisted(() => ({
  getResume: vi.fn(),
  listResumes: vi.fn(),
  updateResumeMetadata: vi.fn(),
  uploadResume: vi.fn()
}));

vi.mock("@/services/resumeLibrary.service", () => ({
  ResumeLibraryServiceError: class ResumeLibraryServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

    constructor(code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND", message: string) {
      super(message);
      this.name = "ResumeLibraryServiceError";
      this.code = code;
    }
  },
  resumeLibraryService: resumeLibraryServiceMock
}));

const detailDto: ResumeDetailDto = {
  candidate: null,
  candidateId: null,
  candidateName: null,
  candidateSource: "内推",
  createdAt: "2026-01-01T00:00:00.000Z",
  duplicateCount: 0,
  duplicateSignal: {
    duplicateCount: 0,
    hasDuplicates: false
  },
  fileName: "resume.txt",
  fileSize: 12,
  fileType: "TXT",
  hasContentHash: true,
  id: "resume-id",
  intakeSource: "RESUME_LIBRARY",
  jobProfile: null,
  jobProfileId: null,
  jobProfileTitle: null,
  notes: "备注",
  parsedText: "hello resume",
  parsingError: null,
  parsingStatus: "PARSED",
  possibleDuplicates: [],
  semanticChunkCount: 1,
  structureChunkCount: 1,
  updatedAt: "2026-01-02T00:00:00.000Z"
};

const listItemDto: ResumeListItemDto = {
  candidateId: detailDto.candidateId,
  candidateName: detailDto.candidateName,
  candidateSource: detailDto.candidateSource,
  createdAt: detailDto.createdAt,
  duplicateCount: detailDto.duplicateCount,
  fileName: detailDto.fileName,
  fileSize: detailDto.fileSize,
  fileType: detailDto.fileType,
  hasContentHash: detailDto.hasContentHash,
  id: detailDto.id,
  intakeSource: detailDto.intakeSource,
  jobProfileId: detailDto.jobProfileId,
  jobProfileTitle: detailDto.jobProfileTitle,
  parsingStatus: detailDto.parsingStatus,
  updatedAt: detailDto.updatedAt
};

describe("Resume Library API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resumeLibraryServiceMock.getResume.mockResolvedValue(detailDto);
    resumeLibraryServiceMock.listResumes.mockResolvedValue({
      items: [listItemDto],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1
      }
    } satisfies ResumeListResultDto);
    resumeLibraryServiceMock.updateResumeMetadata.mockResolvedValue(detailDto);
    resumeLibraryServiceMock.uploadResume.mockResolvedValue({
      duplicateSignal: detailDto.duplicateSignal,
      resume: detailDto
    } satisfies ResumeUploadResultDto);
  });

  it("GET /api/resumes returns list without parsed text or original binary", async () => {
    const { GET } = await import("@/app/api/resumes/route");
    const response = await GET(
      createGetRequest("http://localhost/api/resumes?search=resume&page=1&pageSize=20") as never
    );
    const json = await readApiJson<ResumeListResultDto>(response);

    expect(response.status).toBe(200);
    expect(json.data?.items[0]).not.toHaveProperty("parsedText");
    expect(json.data?.items[0]).not.toHaveProperty("originalFile");
    expect(resumeLibraryServiceMock.listResumes).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
        search: "resume"
      })
    );
  });

  it("POST /api/resumes accepts multipart upload", async () => {
    const { POST } = await import("@/app/api/resumes/route");
    const formData = new FormData();
    formData.set("file", new File(["hello resume"], "resume.txt"));
    formData.set("candidateSource", "内推");
    const response = await POST(
      new NextRequest("http://localhost/api/resumes", {
        body: formData,
        method: "POST"
      }) as never
    );
    const json = await readApiJson<ResumeUploadResultDto>(response);

    expect(response.status).toBe(201);
    expect(json.data?.resume.id).toBe("resume-id");
    expect(resumeLibraryServiceMock.uploadResume).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateSource: "内推"
      })
    );
  });

  it("GET /api/resumes/:id returns no-store detail without original binary", async () => {
    const { GET } = await import("@/app/api/resumes/[id]/route");
    const response = await GET(createGetRequest("http://localhost/api/resumes/resume-id") as never, {
      params: Promise.resolve({
        id: "resume-id"
      })
    });
    const json = await readApiJson<ResumeDetailDto>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(json.data).not.toHaveProperty("originalFile");
    expect(json.data?.candidate).toBeNull();
    expect(json.data?.jobProfile).toBeNull();
  });

  it("PATCH /api/resumes/:id updates metadata only", async () => {
    const { PATCH } = await import("@/app/api/resumes/[id]/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/resumes/resume-id", {
        candidateSource: "Boss",
        notes: "人工备注"
      }) as never,
      {
        params: Promise.resolve({
          id: "resume-id"
        })
      }
    );

    expect(response.status).toBe(200);
    expect(resumeLibraryServiceMock.updateResumeMetadata).toHaveBeenCalledWith("resume-id", {
      candidateSource: "Boss",
      notes: "人工备注"
    });
  });

  it("returns validation and not found errors", async () => {
    const { ResumeLibraryServiceError } = await import("@/services/resumeLibrary.service");
    const { GET } = await import("@/app/api/resumes/[id]/route");
    const { PATCH } = await import("@/app/api/resumes/[id]/route");

    const invalidResponse = await PATCH(
      createJsonRequest("http://localhost/api/resumes/resume-id", {
        candidateId: "candidate-id"
      }) as never,
      {
        params: Promise.resolve({
          id: "resume-id"
        })
      }
    );

    expect(invalidResponse.status).toBe(400);

    resumeLibraryServiceMock.getResume.mockRejectedValueOnce(
      new ResumeLibraryServiceError("NOT_FOUND", "简历不存在。")
    );

    const notFoundResponse = await GET(
      createGetRequest("http://localhost/api/resumes/missing-id") as never,
      {
        params: Promise.resolve({
          id: "missing-id"
        })
      }
    );

    expect(notFoundResponse.status).toBe(404);
  });
});
