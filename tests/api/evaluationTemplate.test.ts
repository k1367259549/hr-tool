import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  EvaluationTemplateDetailDto,
  EvaluationTemplateListResultDto,
  EvaluationTemplateVersionSummaryDto,
  JobProfileEvaluationAssignmentResultDto
} from "@/types/evaluationTemplate";

const evaluationTemplateServiceMock = vi.hoisted(() => ({
  archiveTemplate: vi.fn(),
  assignTemplateVersion: vi.fn(),
  createNextDraft: vi.fn(),
  createTemplate: vi.fn(),
  getJobProfileAssignment: vi.fn(),
  getTemplate: vi.fn(),
  listTemplates: vi.fn(),
  publishVersion: vi.fn(),
  restoreTemplate: vi.fn(),
  unassignTemplateVersion: vi.fn(),
  updateDraftVersion: vi.fn(),
  updateTemplate: vi.fn()
}));

vi.mock("@/services/evaluationTemplate.service", () => ({
  EvaluationTemplateServiceError: class EvaluationTemplateServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.name = "EvaluationTemplateServiceError";
      this.code = code;
    }
  },
  evaluationTemplateService: evaluationTemplateServiceMock
}));

const versionDto: EvaluationTemplateVersionSummaryDto = {
  changeNote: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: null,
  criteria: [],
  id: "version-id",
  instructions: null,
  publishedAt: null,
  status: "DRAFT",
  templateId: "template-id",
  updatedAt: "2026-01-01T00:00:00.000Z",
  versionNumber: 1
};

const templateDto: EvaluationTemplateDetailDto = {
  activeAssignmentCount: 0,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  currentDraftVersion: versionDto,
  description: "说明",
  id: "template-id",
  latestPublishedVersion: null,
  latestVersionNumber: 1,
  name: "Backend Evaluation",
  status: "ACTIVE",
  updatedAt: "2026-01-01T00:00:00.000Z",
  versions: [versionDto]
};

const assignmentDto: JobProfileEvaluationAssignmentResultDto = {
  activeAssignment: null,
  history: []
};

describe("Evaluation Template API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    evaluationTemplateServiceMock.archiveTemplate.mockResolvedValue(templateDto);
    evaluationTemplateServiceMock.assignTemplateVersion.mockResolvedValue(assignmentDto);
    evaluationTemplateServiceMock.createNextDraft.mockResolvedValue(versionDto);
    evaluationTemplateServiceMock.createTemplate.mockResolvedValue(templateDto);
    evaluationTemplateServiceMock.getJobProfileAssignment.mockResolvedValue(assignmentDto);
    evaluationTemplateServiceMock.getTemplate.mockResolvedValue(templateDto);
    evaluationTemplateServiceMock.listTemplates.mockResolvedValue({
      items: [templateDto],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1
      }
    } satisfies EvaluationTemplateListResultDto);
    evaluationTemplateServiceMock.publishVersion.mockResolvedValue({
      ...versionDto,
      publishedAt: "2026-01-02T00:00:00.000Z",
      status: "PUBLISHED"
    });
    evaluationTemplateServiceMock.restoreTemplate.mockResolvedValue(templateDto);
    evaluationTemplateServiceMock.unassignTemplateVersion.mockResolvedValue(assignmentDto);
    evaluationTemplateServiceMock.updateDraftVersion.mockResolvedValue(versionDto);
    evaluationTemplateServiceMock.updateTemplate.mockResolvedValue(templateDto);
  });

  it("GET /api/evaluation-templates returns no-store list", async () => {
    const { GET } = await import("@/app/api/evaluation-templates/route");
    const response = await GET(
      createGetRequest("http://localhost/api/evaluation-templates?search=backend&page=1&pageSize=20") as never
    );
    const json = await readApiJson<EvaluationTemplateListResultDto>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(json.data?.items[0]?.name).toBe("Backend Evaluation");
  });

  it("creates, reads, and updates a template through service layer", async () => {
    const listRoute = await import("@/app/api/evaluation-templates/route");
    const detailRoute = await import("@/app/api/evaluation-templates/[id]/route");

    const createResponse = await listRoute.POST(
      createJsonRequest("http://localhost/api/evaluation-templates", {
        description: "说明",
        name: "Backend Evaluation"
      }) as never
    );
    const getResponse = await detailRoute.GET(
      createGetRequest("http://localhost/api/evaluation-templates/template-id") as never,
      {
        params: Promise.resolve({
          id: "template-id"
        })
      }
    );
    const patchResponse = await detailRoute.PATCH(
      createJsonRequest("http://localhost/api/evaluation-templates/template-id", {
        name: "Backend Evaluation Updated"
      }) as never,
      {
        params: Promise.resolve({
          id: "template-id"
        })
      }
    );

    expect(createResponse.status).toBe(201);
    expect(getResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(patchResponse.status).toBe(200);
    expect(evaluationTemplateServiceMock.updateTemplate).toHaveBeenCalledWith("template-id", {
      description: undefined,
      name: "Backend Evaluation Updated"
    });
  });

  it("updates, publishes, creates next draft, archives, and restores", async () => {
    const versionRoute = await import("@/app/api/evaluation-template-versions/[id]/route");
    const publishRoute = await import("@/app/api/evaluation-template-versions/[id]/publish/route");
    const nextDraftRoute = await import("@/app/api/evaluation-templates/[id]/versions/route");
    const archiveRoute = await import("@/app/api/evaluation-templates/[id]/archive/route");
    const restoreRoute = await import("@/app/api/evaluation-templates/[id]/restore/route");

    expect(
      (
        await versionRoute.PATCH(
          createJsonRequest("http://localhost/api/evaluation-template-versions/version-id", {
            criteria: []
          }) as never,
          {
            params: Promise.resolve({
              id: "version-id"
            })
          }
        )
      ).status
    ).toBe(200);
    expect((await publishRoute.POST({} as never, { params: Promise.resolve({ id: "version-id" }) })).status).toBe(200);
    expect((await nextDraftRoute.POST({} as never, { params: Promise.resolve({ id: "template-id" }) })).status).toBe(201);
    expect((await archiveRoute.POST({} as never, { params: Promise.resolve({ id: "template-id" }) })).status).toBe(200);
    expect((await restoreRoute.POST({} as never, { params: Promise.resolve({ id: "template-id" }) })).status).toBe(200);
  });

  it("supports job profile assignment routes", async () => {
    const route = await import("@/app/api/job-profiles/[id]/evaluation-template-assignment/route");
    const getResponse = await route.GET(
      createGetRequest("http://localhost/api/job-profiles/job-id/evaluation-template-assignment") as never,
      {
        params: Promise.resolve({
          id: "job-id"
        })
      }
    );
    const putResponse = await route.PUT(
      createJsonRequest("http://localhost/api/job-profiles/job-id/evaluation-template-assignment", {
        assignedBy: "recruiter",
        templateVersionId: "version-id"
      }) as never,
      {
        params: Promise.resolve({
          id: "job-id"
        })
      }
    );
    const deleteResponse = await route.DELETE({} as never, {
      params: Promise.resolve({
        id: "job-id"
      })
    });

    expect(getResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(putResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
  });

  it("maps validation, not found, conflict, and safe database errors", async () => {
    const { EvaluationTemplateServiceError } = await import("@/services/evaluationTemplate.service");
    const { PATCH } = await import("@/app/api/evaluation-template-versions/[id]/route");
    const { GET } = await import("@/app/api/evaluation-templates/[id]/route");
    const { POST } = await import("@/app/api/evaluation-template-versions/[id]/publish/route");

    const invalidResponse = await PATCH(
      createJsonRequest("http://localhost/api/evaluation-template-versions/version-id", {
        criteria: [{ key: "bad", label: "Bad", description: "Bad", importance: "REQUIRED", score: 10 }]
      }) as never,
      {
        params: Promise.resolve({
          id: "version-id"
        })
      }
    );
    expect(invalidResponse.status).toBe(400);

    evaluationTemplateServiceMock.getTemplate.mockRejectedValueOnce(
      new EvaluationTemplateServiceError("NOT_FOUND", "评价标准不存在。")
    );
    expect(
      (
        await GET(createGetRequest("http://localhost/api/evaluation-templates/missing") as never, {
          params: Promise.resolve({
            id: "missing"
          })
        })
      ).status
    ).toBe(404);

    evaluationTemplateServiceMock.publishVersion.mockRejectedValueOnce(
      new EvaluationTemplateServiceError("CONFLICT", "只有 Draft 版本可以发布。")
    );
    expect(
      (
        await POST({} as never, {
          params: Promise.resolve({
            id: "version-id"
          })
        })
      ).status
    ).toBe(409);
  });
});
