import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";
import type { ResumeEvaluationDetailDto } from "@/types/resumeEvaluationResult";

const serviceMock = vi.hoisted(() => ({
  selectRunForReview: vi.fn()
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
  createdAt: "2026-07-04T00:00:00.000Z",
  criterionResults: [],
  evaluatedBy: null,
  events: [],
  id: "eval-1",
  jobProfileId: "job-1",
  jobProfileVersion: "2026-07-04T00:00:00.000Z",
  overallNote: null,
  parsedSnapshotId: "snapshot-1",
  resumeId: "resume-1",
  resumeRevisionId: "revision-1",
  reviewedAt: null,
  revision: 0,
  selectedRunId: null,
  status: "DRAFT",
  templateVersionId: "template-version-1",
  updatedAt: "2026-07-04T00:00:00.000Z"
};

describe("PATCH /api/evaluations/[id]/selected-run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets selectedRunId and returns an updated safe evaluation DTO", async () => {
    vi.mocked(serviceMock.selectRunForReview).mockResolvedValueOnce({
      ...baseEvaluation,
      selectedRunId: "run-1"
    });

    const { PATCH } = await import("@/app/api/evaluations/[id]/selected-run/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/evaluations/eval-1/selected-run", {
        selectedRunId: "run-1"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(serviceMock.selectRunForReview).toHaveBeenCalledWith("eval-1", "run-1");
    expect(json.data).toMatchObject({
      id: "eval-1",
      selectedRunId: "run-1"
    });
  });

  it("clears selectedRunId", async () => {
    vi.mocked(serviceMock.selectRunForReview).mockResolvedValueOnce(baseEvaluation);

    const { PATCH } = await import("@/app/api/evaluations/[id]/selected-run/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/evaluations/eval-1/selected-run", {
        selectedRunId: null
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(serviceMock.selectRunForReview).toHaveBeenCalledWith("eval-1", null);
    expect(json.data?.selectedRunId).toBeNull();
  });

  it("rejects invalid JSON, extra fields, and invalid selectedRunId types", async () => {
    const { PATCH } = await import("@/app/api/evaluations/[id]/selected-run/route");
    const invalidJsonRequest = new Request("http://localhost/api/evaluations/eval-1/selected-run", {
      body: "{invalid-json",
      headers: { "content-type": "application/json" },
      method: "PATCH"
    });
    const extraFieldRequest = createJsonRequest(
      "http://localhost/api/evaluations/eval-1/selected-run",
      {
        selectedRunId: "run-1",
        unexpected: true
      }
    );
    const numericRequest = createJsonRequest(
      "http://localhost/api/evaluations/eval-1/selected-run",
      {
        selectedRunId: 123
      }
    );

    await expect(
      PATCH(invalidJsonRequest as never, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      PATCH(extraFieldRequest, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      PATCH(numericRequest, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    expect(serviceMock.selectRunForReview).not.toHaveBeenCalled();
  });

  it("maps service validation errors safely", async () => {
    const { ResumeEvaluationResultServiceError } = await import(
      "@/services/resumeEvaluationResult.service"
    );
    vi.mocked(serviceMock.selectRunForReview).mockRejectedValueOnce(
      new ResumeEvaluationResultServiceError(
        "VALIDATION_ERROR",
        "只能选择 SUCCEEDED 状态的评估 run。"
      )
    );

    const { PATCH } = await import("@/app/api/evaluations/[id]/selected-run/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/evaluations/eval-1/selected-run", {
        selectedRunId: "failed-run"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(response.status).toBe(400);
  });
});

describe("selected-run API route boundaries", () => {
  it("does not import Prisma, AI providers, latest-run persistence, or automation concepts", () => {
    const routeSource = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "api",
        "evaluations",
        "[id]",
        "selected-run",
        "route.ts"
      ),
      "utf8"
    );

    expect(routeSource).not.toContain("@/lib/prisma");
    expect(routeSource).not.toContain("@/ai");
    expect(routeSource).not.toContain("openai");
    expect(routeSource).not.toContain("/prompts");
    expect(routeSource).not.toContain("latestRunId");
    expect(routeSource).not.toContain("ranking");
    expect(routeSource).not.toContain("matching");
    expect(routeSource).not.toContain("pipeline");
    expect(routeSource).not.toContain("autoReject");
    expect(routeSource).not.toContain("autoHire");
  });
});
