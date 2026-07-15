import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createJsonRequest, readApiJson } from "../setup/testDb";
import { adaptDetailedScreeningResultToLegacyEvaluationResult } from "@/lib/resume-screening/detailed-screening-contract";
import { QuickScreeningResultSchema } from "@/lib/resume-screening/schema";
import type {
  DetailedAnalysisRunDto,
  ResumeEvaluationRunDto
} from "@/types/resumeEvaluationRun";
import type {
  DetailedScreeningResult,
  QuickScreeningResult
} from "@/types/resume-screening";

const serviceMock = vi.hoisted(() => ({
  createDetailedAnalysisRun: vi.fn(),
  createMockEvaluationRun: vi.fn(),
  createQuickScreeningRun: vi.fn(),
  getLatestDetailedAnalysisRunByEvaluationId: vi.fn(),
  getLatestSuccessfulRunByEvaluationId: vi.fn(),
  listRunsByEvaluationId: vi.fn()
}));

const providerRuntimeConfigMock = vi.hoisted(() => ({
  createEvaluationProviderFromRuntimeConfig: vi.fn(),
  readEvaluationProviderRuntimeConfig: vi.fn()
}));

vi.mock("@/services/resumeEvaluationRun.service", () => ({
  ResumeEvaluationRunServiceError: class ResumeEvaluationRunServiceError extends Error {
    readonly code:
      | "VALIDATION_ERROR"
      | "DATABASE_ERROR"
      | "NOT_FOUND"
      | "CONFLICT"
      | "CONFIG_ERROR";

    constructor(
      code:
        | "VALIDATION_ERROR"
        | "DATABASE_ERROR"
        | "NOT_FOUND"
        | "CONFLICT"
        | "CONFIG_ERROR",
      message: string
    ) {
      super(message);
      this.name = "ResumeEvaluationRunServiceError";
      this.code = code;
    }
  },
  resumeEvaluationRunService: serviceMock
}));

vi.mock("@/lib/evaluation/provider-runtime-config", () => ({
  createEvaluationProviderFromRuntimeConfig:
    providerRuntimeConfigMock.createEvaluationProviderFromRuntimeConfig,
  readEvaluationProviderRuntimeConfig:
    providerRuntimeConfigMock.readEvaluationProviderRuntimeConfig
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

type LatestSuccessfulRunResponse = {
  run: ResumeEvaluationRunDto | null;
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

describe("GET /api/evaluations/[id]/runs/latest-successful", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest successful run in a safe wrapper", async () => {
    vi.mocked(serviceMock.getLatestSuccessfulRunByEvaluationId).mockResolvedValueOnce(baseRun);

    const { GET } = await import(
      "@/app/api/evaluations/[id]/runs/latest-successful/route"
    );
    const request = createGetRequest(
      "http://localhost/api/evaluations/eval-1/runs/latest-successful"
    );
    const response = await GET(request, { params: Promise.resolve({ id: "eval-1" }) });
    const json = await readApiJson<LatestSuccessfulRunResponse>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(serviceMock.getLatestSuccessfulRunByEvaluationId).toHaveBeenCalledWith("eval-1");
    expect(json.data?.run).toMatchObject({
      id: "run-1",
      runType: "MOCK",
      status: "SUCCEEDED"
    });
    expect(JSON.stringify(json.data)).not.toContain("rawOutputJson");
    expect(JSON.stringify(json.data)).not.toContain("parsedText");
    expect(JSON.stringify(json.data)).not.toContain("promptBody");
    expect(JSON.stringify(json.data)).not.toContain("secret");
  });

  it("returns null when there is no successful run", async () => {
    vi.mocked(serviceMock.getLatestSuccessfulRunByEvaluationId).mockResolvedValueOnce(null);

    const { GET } = await import(
      "@/app/api/evaluations/[id]/runs/latest-successful/route"
    );
    const response = await GET(
      createGetRequest("http://localhost/api/evaluations/eval-1/runs/latest-successful"),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<LatestSuccessfulRunResponse>(response);

    expect(response.status).toBe(200);
    expect(json.data).toEqual({ run: null });
  });
});

describe("POST /api/evaluations/[id]/quick-screening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a formal quick screening run through the service layer", async () => {
    vi.mocked(serviceMock.createQuickScreeningRun).mockResolvedValueOnce({
      result: {
        evidence: ["Resume matched backend api keywords."],
        nextStep: quickScreeningResult.nextStep,
        reasons: ["Keyword evidence present: Matched backend api."],
        recommendation: quickScreeningResult.recommendation,
        risks: ["Some job-description keywords were not clearly present."],
        score: quickScreeningResult.overallScore,
        summary: quickScreeningResult.summary
      },
      screeningResult: quickScreeningResult,
      run: {
        ...baseRun,
        modelName: "0.1.0",
        modelProvider: "RULE_BASED",
        rating: "PROCEED_TO_NEXT_STEP",
        runType: "RULE_BASED",
        score: 72,
        summary: "Rule-based quick screening summary."
      }
    });

    const { POST } = await import(
      "@/app/api/evaluations/[id]/quick-screening/route"
    );
    const response = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/quick-screening", {}),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<{
      run: ResumeEvaluationRunDto;
      result: {
        recommendation: string;
        score: number;
        summary: string;
        reasons: string[];
        risks: string[];
        evidence: string[];
        nextStep: string;
      };
      screeningResult: QuickScreeningResult;
    }>(response);

    expect(response.status).toBe(201);
    expect(serviceMock.createQuickScreeningRun).toHaveBeenCalledWith("eval-1");
    expect(json.data).toMatchObject({
      result: {
        recommendation: "PROCEED_TO_NEXT_STEP",
        score: 72
      },
      screeningResult: {
        recommendation: "PROCEED_TO_NEXT_STEP",
        overallScore: 72,
        screeningMode: "QUICK"
      },
      run: {
        runType: "RULE_BASED",
        status: "SUCCEEDED"
      }
    });
    expect(json.data?.result.score).toBe(json.data?.screeningResult.overallScore);
    expect(json.data?.result.recommendation).toBe(
      json.data?.screeningResult.recommendation
    );
    expect(QuickScreeningResultSchema.safeParse(json.data?.screeningResult).success).toBe(true);
    expect(JSON.stringify(json.data)).not.toContain("rawOutputJson");
    expect(JSON.stringify(json.data)).not.toContain("parsedText");
    expect(JSON.stringify(json.data)).not.toContain("promptBody");
    expect(JSON.stringify(json.data)).not.toContain("secret");
  });

  it("returns timeout-capable validation errors without Prisma fallback", async () => {
    const { ResumeEvaluationRunServiceError } = await import(
      "@/services/resumeEvaluationRun.service"
    );
    vi.mocked(serviceMock.createQuickScreeningRun).mockRejectedValueOnce(
      new ResumeEvaluationRunServiceError(
        "VALIDATION_ERROR",
        "resumeText must contain enough text for rule-based evaluation."
      )
    );

    const { POST } = await import(
      "@/app/api/evaluations/[id]/quick-screening/route"
    );
    const response = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/quick-screening", {}),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(response.status).toBe(400);
    expect(serviceMock.createQuickScreeningRun).toHaveBeenCalledWith("eval-1");
  });
});

describe("GET /api/evaluations/[id]/detailed-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest successful detailed analysis run with canonical screeningResult", async () => {
    const detailedAnalysis = createDetailedAnalysisRunDto();

    vi.mocked(serviceMock.getLatestDetailedAnalysisRunByEvaluationId).mockResolvedValueOnce(
      detailedAnalysis
    );

    const { GET } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/route"
    );
    const response = await GET(
      createGetRequest("http://localhost/api/evaluations/eval-1/detailed-analysis"),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<DetailedAnalysisRunDto | null>(response);

    expect(response.status).toBe(200);
    expect(serviceMock.getLatestDetailedAnalysisRunByEvaluationId).toHaveBeenCalledWith(
      "eval-1"
    );
    expect(json.data).toMatchObject({
      success: true,
      screeningResult: {
        overallScore: detailedAnalysis.success
          ? detailedAnalysis.screeningResult.overallScore
          : undefined,
        screeningMode: "DETAILED"
      }
    });
    expect(JSON.stringify(json.data)).not.toContain("rawOutputJson");
    expect(JSON.stringify(json.data)).not.toContain("parsedText");
    expect(JSON.stringify(json.data)).not.toContain("secret");
  });

  it("returns null when no successful detailed analysis run exists", async () => {
    vi.mocked(serviceMock.getLatestDetailedAnalysisRunByEvaluationId).mockResolvedValueOnce(
      null
    );

    const { GET } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/route"
    );
    const response = await GET(
      createGetRequest("http://localhost/api/evaluations/eval-1/detailed-analysis"),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<DetailedAnalysisRunDto | null>(response);

    expect(response.status).toBe(200);
    expect(json.data).toBeNull();
  });
});

describe("POST /api/evaluations/[id]/detailed-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providerRuntimeConfigMock.readEvaluationProviderRuntimeConfig).mockReturnValue(
      {
        provider: "openai-compatible",
        luminAIConfig: {
          apiKey: "secret-key-that-must-not-leak",
          baseUrl: "https://luminai.test",
          model: "gpt-5.5",
          timeoutMs: 30_000
        },
        safeSummary: {
          baseUrl: "https://luminai.test",
          hasApiKey: true,
          model: "gpt-5.5",
          provider: "openai-compatible",
          requiresApiKey: true,
          timeoutMs: 30_000
        }
      }
    );
    vi.mocked(providerRuntimeConfigMock.createEvaluationProviderFromRuntimeConfig).mockReturnValue(
      {
        name: "OPENAI_COMPATIBLE",
        version: "openai-compatible-test-v1",
        evaluate: vi.fn()
      }
    );
  });

  it("creates a detailed analysis run through runtime config and the service layer", async () => {
    const detailedAnalysis = createDetailedAnalysisRunDto();

    vi.mocked(serviceMock.createDetailedAnalysisRun).mockResolvedValueOnce(
      detailedAnalysis
    );

    const { POST } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/route"
    );
    const response = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/detailed-analysis", {}),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<DetailedAnalysisRunDto>(response);

    expect(response.status).toBe(201);
    expect(providerRuntimeConfigMock.readEvaluationProviderRuntimeConfig).toHaveBeenCalled();
    expect(providerRuntimeConfigMock.createEvaluationProviderFromRuntimeConfig).toHaveBeenCalled();
    expect(serviceMock.createDetailedAnalysisRun).toHaveBeenCalledWith(
      "eval-1",
      expect.objectContaining({
        provider: expect.objectContaining({
          name: "OPENAI_COMPATIBLE"
        })
      })
    );
    expect(json.data).toMatchObject({
      mode: "DETAILED",
      runId: "detailed-run-1",
      screeningResult: {
        screeningMode: "DETAILED"
      },
      success: true
    });
    expect(json.data?.success && json.data.result.overallScore).toBe(
      json.data?.success && json.data.screeningResult.overallScore
    );
    expect(JSON.stringify(json.data)).not.toContain("secret-key-that-must-not-leak");
    expect(JSON.stringify(json.data)).not.toContain("rawProviderResponse");
    expect(JSON.stringify(json.data)).not.toContain("promptBody");
  });

  it("returns controlled provider failures as a failed detailed-analysis DTO", async () => {
    vi.mocked(serviceMock.createDetailedAnalysisRun).mockResolvedValueOnce({
      error: "OpenAI-compatible provider timed out.",
      evaluationId: "eval-1",
      failureReason: "TIMEOUT",
      metadata: {
        completedAt: "2026-07-04T13:02:00.000Z",
        durationMs: 30_000,
        model: "gpt-5.5",
        providerName: "OPENAI_COMPATIBLE",
        providerVersion: "openai-compatible-test-v1",
        startedAt: "2026-07-04T13:01:30.000Z"
      },
      runId: "detailed-run-failed",
      success: false
    });

    const { POST } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/route"
    );
    const response = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/detailed-analysis", {}),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<DetailedAnalysisRunDto>(response);

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({
      error: "OpenAI-compatible provider timed out.",
      failureReason: "TIMEOUT",
      runId: "detailed-run-failed",
      success: false
    });
  });

  it("maps quick-screening precondition conflicts to 409", async () => {
    const { ResumeEvaluationRunServiceError } = await import(
      "@/services/resumeEvaluationRun.service"
    );
    vi.mocked(serviceMock.createDetailedAnalysisRun).mockRejectedValueOnce(
      new ResumeEvaluationRunServiceError(
        "CONFLICT",
        "缺少快速初筛结果，请先完成 Quick Screening。"
      )
    );

    const { POST } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/route"
    );
    const response = await POST(
      createJsonRequest("http://localhost/api/evaluations/eval-1/detailed-analysis", {}),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(response.status).toBe(409);
  });
});

const quickScreeningResult: QuickScreeningResult = {
  dimensions: [
    {
      conclusion: "岗位要求存在明确证据。",
      evidence: [
        {
          id: "ev_1",
          relatedRequirement: "backend api",
          source: "RESUME",
          text: "Resume matched backend api keywords."
        }
      ],
      key: "job_match",
      matchLevel: "high",
      missingInformation: [],
      name: "岗位要求匹配",
      risks: [],
      score: 72
    }
  ],
  educationPass: "unclear",
  evidence: [
    {
      id: "ev_1",
      relatedRequirement: "backend api",
      source: "RESUME",
      text: "Resume matched backend api keywords."
    }
  ],
  fullTimeBachelor: "unclear",
  interviewQuestions: ["请说明 backend api 项目的具体职责。"],
  mainRisk: "当前证据仍需招聘者人工确认。",
  missingInformation: [],
  nextStep: "建议进入详细分析或电话筛选，并由招聘者人工确认。",
  notes: null,
  overallScore: 72,
  priority: "B",
  reasons: ["Keyword evidence present: Matched backend api."],
  recommendation: "PROCEED_TO_NEXT_STEP",
  risks: [
    {
      description: "Some job-description keywords were not clearly present.",
      severity: "low",
      title: "仍需人工确认"
    }
  ],
  robotArmRelevance: "high",
  schemaVersion: "m11-a.quick.v1",
  screeningMode: "QUICK",
  shouldEnterDetailedAnalysis: "yes",
  strengths: ["Resume matched backend api keywords."],
  summary: "Rule-based quick screening summary."
};

function createDetailedAnalysisRunDto(): DetailedAnalysisRunDto {
  const screeningResult = createDetailedScreeningResult();
  const result = adaptDetailedScreeningResultToLegacyEvaluationResult(screeningResult);

  return {
    completedAt: "2026-07-04T13:02:00.000Z",
    createdAt: "2026-07-04T13:01:00.000Z",
    evaluationId: "eval-1",
    metadata: {
      completedAt: "2026-07-04T13:02:00.000Z",
      durationMs: 60_000,
      model: "gpt-5.5",
      promptFile: "prompts/detailed-analysis.md",
      promptVersion: "1.0",
      providerName: "OPENAI_COMPATIBLE",
      providerVersion: "openai-compatible-test-v1",
      startedAt: "2026-07-04T13:01:00.000Z"
    },
    mode: "DETAILED",
    model: "gpt-5.5",
    provider: "OPENAI_COMPATIBLE",
    result,
    run: {
      ...baseRun,
      completedAt: "2026-07-04T13:02:00.000Z",
      createdAt: "2026-07-04T13:01:00.000Z",
      id: "detailed-run-1",
      modelName: "gpt-5.5",
      modelProvider: "OPENAI_COMPATIBLE",
      promptVersion: "1.0",
      rating: screeningResult.recommendation,
      runType: "AI",
      score: screeningResult.overallScore,
      status: "SUCCEEDED",
      summary: screeningResult.summary
    },
    runId: "detailed-run-1",
    screeningResult,
    status: "SUCCEEDED",
    success: true
  };
}

function createDetailedScreeningResult(): DetailedScreeningResult {
  return {
    dimensions: [
      {
        conclusion:
          "The resume explicitly names TypeScript API service work that maps to the backend JD.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Backend API experience",
            source: "RESUME",
            text: "Built TypeScript API services for recruiting workflows."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: [],
        name: "JD Match",
        risks: [],
        score: 86
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relatedRequirement: "Backend API experience",
        source: "RESUME",
        text: "Built TypeScript API services for recruiting workflows."
      },
      {
        id: "ev_missing_availability",
        relatedRequirement: "Internship availability",
        source: "MISSING_INFORMATION",
        text: "Availability and weekly attendance are not visible in the resume."
      }
    ],
    interviewQuestions: [
      "Please walk through the API project and your direct responsibilities.",
      "What is your availability and weekly attendance?"
    ],
    missingInformation: ["Availability and weekly attendance are not visible."],
    nextStep: "Recruiter should manually confirm ownership depth and availability.",
    notes: null,
    overallScore: 86,
    recommendation: "MANUAL_REVIEW",
    risks: [
      {
        description: "Availability is missing and must be confirmed before proceeding.",
        severity: "medium",
        title: "Availability missing"
      }
    ],
    schemaVersion: "m11-a.detailed.v1",
    screeningMode: "DETAILED",
    strengths: ["Backend TypeScript API experience maps to the JD."],
    summary:
      "The candidate has relevant backend TypeScript API evidence for the role, while availability and ownership depth still need recruiter confirmation.",
    weaknesses: ["Availability and exact ownership depth are not explicit."]
  };
}

describe("EvaluationRun API route boundaries", () => {
  it("does not import Prisma, AI providers, prompts, or selected/latest run writes", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "src", "app", "api", "evaluations", "[id]", "runs", "route.ts"),
      "utf8"
    );
    const latestRouteSource = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "api",
        "evaluations",
        "[id]",
        "runs",
        "latest-successful",
        "route.ts"
      ),
      "utf8"
    );
    const quickScreeningRouteSource = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "api",
        "evaluations",
        "[id]",
        "quick-screening",
        "route.ts"
      ),
      "utf8"
    );
    const detailedAnalysisRouteSource = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "api",
        "evaluations",
        "[id]",
        "detailed-analysis",
        "route.ts"
      ),
      "utf8"
    );
    const combinedSource = `${routeSource}\n${latestRouteSource}\n${quickScreeningRouteSource}\n${detailedAnalysisRouteSource}`;

    expect(combinedSource).not.toContain("@/lib/prisma");
    expect(combinedSource).not.toContain("@/ai");
    expect(combinedSource).not.toContain("openai");
    expect(combinedSource).not.toContain("/prompts");
    expect(combinedSource).not.toContain("selectedRunId");
    expect(combinedSource).not.toContain("latestRunId");
    expect(combinedSource).not.toContain("ranking");
    expect(combinedSource).not.toContain("matching");
    expect(combinedSource).not.toContain("pipeline");
    expect(combinedSource).not.toContain("autoReject");
    expect(combinedSource).not.toContain("autoHire");
  });
});
