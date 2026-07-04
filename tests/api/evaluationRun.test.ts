import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import type { ResumeEvaluationRunDto } from "@/types/resumeEvaluationRun";

const serviceMock = vi.hoisted(() => ({
  createMockEvaluationRun: vi.fn(),
  listRunsByEvaluationId: vi.fn()
}));

vi.mock("@/services/resumeEvaluationRun.service", () => ({
  ResumeEvaluationRunServiceError: class ResumeEvaluationRunServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND",
      message: string
    ) {
      super(message);
      this.name = "ResumeEvaluationRunServiceError";
      this.code = code;
    }
  },
  resumeEvaluationRunService: serviceMock
}));

const baseRun: ResumeEvaluationRunDto = {
  completedAt: "2026-07-04T13:01:00.000Z",
  createdAt: "2026-07-04T13:00:00.000Z",
  errorCode: null,
  errorMessage: null,
  evaluationId: "eval-1",
  id: "run-1",
  modelName: null,
  modelProvider: null,
  parsedSnapshotId: "snapshot-1",
  promptVersion: null,
  rating: null,
  resumeRevisionId: "revision-1",
  runType: "MOCK",
  score: null,
  status: "SUCCEEDED",
  summary: null
};

describe("GET /api/evaluations/[id]/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns run history with no-store cache and safe DTO shape", async () => {
    vi.mocked(serviceMock.listRunsByEvaluationId).mockResolvedValueOnce([
      {
        ...baseRun,
        createdAt: "2026-07-04T13:02:00.000Z",
        id: "run-2"
      },
      baseRun
    ]);

    const { GET } = await import("@/app/api/evaluations/[id]/runs/route");
    const request = createGetRequest("http://localhost/api/evaluations/eval-1/runs");
    const response = await GET(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<ResumeEvaluationRunDto[]>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(serviceMock.listRunsByEvaluationId).toHaveBeenCalledWith("eval-1");
    expect(json.success).toBe(true);
    expect(json.data?.map((run) => run.id)).toEqual(["run-2", "run-1"]);
    expect(JSON.stringify(json.data)).not.toContain("rawOutputJson");
    expect(JSON.stringify(json.data)).not.toContain("parsedText");
    expect(JSON.stringify(json.data)).not.toContain("promptBody");
    expect(JSON.stringify(json.data)).not.toContain("secret");
  });

  it("returns service errors without direct Prisma fallback", async () => {
    const { ResumeEvaluationRunServiceError } = await import(
      "@/services/resumeEvaluationRun.service"
    );
    vi.mocked(serviceMock.listRunsByEvaluationId).mockRejectedValueOnce(
      new ResumeEvaluationRunServiceError("NOT_FOUND", "评估记录不存在。")
    );

    const { GET } = await import("@/app/api/evaluations/[id]/runs/route");
    const response = await GET(
      createGetRequest("http://localhost/api/evaluations/missing/runs"),
      { params: Promise.resolve({ id: "missing" }) }
    );

    expect(response.status).toBe(404);
  });
});

describe("POST /api/evaluations/[id]/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a MOCK run from an empty body", async () => {
    vi.mocked(serviceMock.createMockEvaluationRun).mockResolvedValueOnce(baseRun);

    const { POST } = await import("@/app/api/evaluations/[id]/runs/route");
    const request = new NextRequest("http://localhost/api/evaluations/eval-1/runs", {
      method: "POST"
    });
    const response = await POST(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<ResumeEvaluationRunDto>(response);

    expect(response.status).toBe(201);
    expect(serviceMock.createMockEvaluationRun).toHaveBeenCalledWith("eval-1");
    expect(json.data).toMatchObject({
      evaluationId: "eval-1",
      runType: "MOCK",
      status: "SUCCEEDED"
    });
    expect(JSON.stringify(json.data)).not.toContain("rawOutputJson");
  });

  it("accepts explicit MOCK runType", async () => {
    vi.mocked(serviceMock.createMockEvaluationRun).mockResolvedValueOnce(baseRun);

    const { POST } = await import("@/app/api/evaluations/[id]/runs/route");
    const request = createJsonRequest("http://localhost/api/evaluations/eval-1/runs", {
      runType: "MOCK"
    });
    const response = await POST(request, { params: Promise.resolve({ id: "eval-1" }) });

    expect(response.status).toBe(201);
    expect(serviceMock.createMockEvaluationRun).toHaveBeenCalledWith("eval-1");
  });

  it("rejects AI and RULE_BASED run types", async () => {
    const { POST } = await import("@/app/api/evaluations/[id]/runs/route");

    const aiResponse = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/runs", {
        runType: "AI"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const ruleResponse = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/runs", {
        runType: "RULE_BASED"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(aiResponse.status).toBe(400);
    expect(ruleResponse.status).toBe(400);
    expect(serviceMock.createMockEvaluationRun).not.toHaveBeenCalled();
  });

  it("rejects invalid body payloads", async () => {
    const { POST } = await import("@/app/api/evaluations/[id]/runs/route");
    const invalidJsonRequest = new NextRequest(
      "http://localhost/api/evaluations/eval-1/runs",
      {
        body: "{invalid-json",
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }
    );
    const arrayRequest = createJsonRequest("http://localhost/api/evaluations/eval-1/runs", [
      "MOCK"
    ]);
    const extraFieldRequest = createJsonRequest(
      "http://localhost/api/evaluations/eval-1/runs",
      {
        runType: "MOCK",
        selectedRunId: "run-1"
      }
    );

    await expect(
      POST(invalidJsonRequest, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      POST(arrayRequest, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      POST(extraFieldRequest, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    expect(serviceMock.createMockEvaluationRun).not.toHaveBeenCalled();
  });

  it("maps missing refs validation error to 400", async () => {
    const { ResumeEvaluationRunServiceError } = await import(
      "@/services/resumeEvaluationRun.service"
    );
    vi.mocked(serviceMock.createMockEvaluationRun).mockRejectedValueOnce(
      new ResumeEvaluationRunServiceError(
        "VALIDATION_ERROR",
        "评估记录缺少实际使用的简历修订版本或解析快照。"
      )
    );

    const { POST } = await import("@/app/api/evaluations/[id]/runs/route");
    const response = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/runs", {
        runType: "MOCK"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(response.status).toBe(400);
  });
});

describe("EvaluationRun API route boundaries", () => {
  it("does not import Prisma, AI providers, prompts, or selected/latest run writes", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "src", "app", "api", "evaluations", "[id]", "runs", "route.ts"),
      "utf8"
    );

    expect(routeSource).not.toContain("@/lib/prisma");
    expect(routeSource).not.toContain("@/ai");
    expect(routeSource).not.toContain("openai");
    expect(routeSource).not.toContain("/prompts");
    expect(routeSource).not.toContain("selectedRunId");
    expect(routeSource).not.toContain("latestRunId");
    expect(routeSource).not.toContain("ranking");
    expect(routeSource).not.toContain("matching");
    expect(routeSource).not.toContain("pipeline");
    expect(routeSource).not.toContain("autoReject");
    expect(routeSource).not.toContain("autoHire");
  });
});
