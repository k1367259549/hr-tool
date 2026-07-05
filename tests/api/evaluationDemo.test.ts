import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "../setup/testDb";

const originalEnv = { ...process.env };

type EvaluationDemoResponse = {
  success: boolean;
  runId?: string;
  output?: {
    overallScore: number;
    recommendation: string;
    overallSummary: string;
  };
  failureReason?: string;
  error?: string;
  metadata: {
    runtimeConfig: Record<string, unknown>;
    providerName?: string;
    model?: string;
    durationMs?: number;
  };
  auditEventCount?: number;
};

function resetEnv(env: Record<string, string | undefined> = {}): void {
  process.env = {
    ...originalEnv,
    AI_PROVIDER: undefined,
    AI_BASE_URL: undefined,
    AI_API_KEY: undefined,
    AI_MODEL: undefined,
    AI_TIMEOUT_MS: undefined,
    ...env
  };
}

async function postEvaluationDemo(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/evaluation-demo/route");

  return POST(createJsonRequest("http://localhost/api/evaluation-demo", body));
}

async function readJson(response: Response): Promise<EvaluationDemoResponse> {
  return (await response.json()) as EvaluationDemoResponse;
}

describe("POST /api/evaluation-demo", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("evaluates a valid request with default rule-based provider", async () => {
    resetEnv();

    const response = await postEvaluationDemo({
      candidateName: "Demo Candidate",
      jobDescription:
        "Need a backend engineer with node api postgres docker typescript recruiting workflow experience.",
      jobTitle: "Backend Engineer",
      resumeText:
        "Built backend node api services with postgres, docker, and typescript for recruiting workflow tools."
    });
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.runId).toMatch(/^evaluation-demo-/);
    expect(json.output?.overallSummary).toContain("Rule-based signal only");
    expect(json.metadata.runtimeConfig).toEqual({
      provider: "rule-based",
      requiresApiKey: false
    });
    expect(json.metadata.providerName).toBe("RULE_BASED");
    expect(json.auditEventCount).toBe(4);
  });

  it("rejects missing resumeText with 400", async () => {
    resetEnv();

    const response = await postEvaluationDemo({
      jobDescription: "Need backend API experience."
    });
    const json = await readJson(response);

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      success: false,
      error: "resumeText is required."
    });
  });

  it("rejects missing jobDescription with 400", async () => {
    resetEnv();

    const response = await postEvaluationDemo({
      resumeText: "Built backend API services."
    });
    const json = await readJson(response);

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      success: false,
      error: "jobDescription is required."
    });
  });

  it("returns a safe error when openai-compatible config is missing key or baseUrl", async () => {
    resetEnv({
      AI_PROVIDER: "openai-compatible",
      AI_BASE_URL: "https://luminai.test"
    });

    const missingKeyResponse = await postEvaluationDemo({
      jobDescription: "Need backend API experience.",
      resumeText: "Built backend API services."
    });
    const missingKeyJson = await readJson(missingKeyResponse);

    resetEnv({
      AI_PROVIDER: "openai-compatible",
      AI_API_KEY: "secret-demo-key"
    });

    const missingBaseUrlResponse = await postEvaluationDemo({
      jobDescription: "Need backend API experience.",
      resumeText: "Built backend API services."
    });
    const missingBaseUrlJson = await readJson(missingBaseUrlResponse);

    expect(missingKeyResponse.status).toBe(400);
    expect(missingKeyJson.error).toBe(
      "AI_API_KEY is required for openai-compatible provider."
    );
    expect(JSON.stringify(missingKeyJson)).not.toContain("secret-demo-key");
    expect(missingBaseUrlResponse.status).toBe(400);
    expect(missingBaseUrlJson.error).toBe(
      "AI_BASE_URL is required for openai-compatible provider."
    );
    expect(JSON.stringify(missingBaseUrlJson)).not.toContain("secret-demo-key");
  });

  it("does not expose apiKey in openai-compatible failure responses", async () => {
    resetEnv({
      AI_API_KEY: "secret-demo-key",
      AI_BASE_URL: "https://luminai.test",
      AI_MODEL: "gpt-5.5-demo",
      AI_PROVIDER: "openai-compatible"
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        async json() {
          return {};
        }
      }))
    );

    const response = await postEvaluationDemo({
      jobDescription: "Need backend API experience.",
      resumeText: "Built backend API services."
    });
    const json = await readJson(response);

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      success: false,
      failureReason: "PROVIDER_ERROR",
      metadata: {
        providerName: "OPENAI_COMPATIBLE",
        model: "gpt-5.5-demo"
      }
    });
    expect(JSON.stringify(json)).not.toContain("secret-demo-key");
  });

  it("does not call real external network in rule-based mode", async () => {
    resetEnv({
      AI_PROVIDER: "rule-based"
    });
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);

    const response = await postEvaluationDemo({
      jobDescription:
        "Need a backend engineer with node api postgres docker typescript recruiting workflow experience.",
      resumeText:
        "Built backend node api services with postgres, docker, and typescript for recruiting workflow tools."
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("evaluation demo API route boundaries", () => {
  it("does not import Prisma, Feishu, business creation services, prompts, or pipeline code", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "src", "app", "api", "evaluation-demo", "route.ts"),
      "utf8"
    );

    expect(routeSource).not.toContain("@/lib/prisma");
    expect(routeSource).not.toContain("@/services/candidate");
    expect(routeSource).not.toContain("@/services/resumeEvaluation");
    expect(routeSource).not.toContain("feishu");
    expect(routeSource).not.toContain("/prompts");
    expect(routeSource).not.toContain("pipeline");
    expect(routeSource).not.toContain("ranking");
    expect(routeSource).not.toContain("matching");
    expect(routeSource).not.toContain("autoReject");
    expect(routeSource).not.toContain("autoHire");
  });
});
