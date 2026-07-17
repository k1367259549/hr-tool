import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createLuminAIConfig,
  createLuminAIEvaluationProvider
} from "@/lib/evaluation/luminai-config-adapter";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

type ProviderOptions = Parameters<typeof createLuminAIEvaluationProvider>[1];
type FetchImpl = NonNullable<NonNullable<ProviderOptions>["fetchImpl"]>;

function createValidEvaluationOutput(): ResumeEvaluationResult {
  return {
    confidence: "HIGH",
    dimensionScores: [
      {
        evidenceIds: ["ev_backend_api"],
        key: "backend-api",
        label: "Backend API",
        rationale: "The resume describes building production APIs.",
        score: 88
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Built and maintained TypeScript backend APIs."
      }
    ],
    interviewQuestions: [
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_backend_api"],
        purpose: "Validate depth of backend API ownership.",
        question: "Which API design trade-offs did you own?"
      }
    ],
    notes: null,
    overallScore: 82,
    overallSummary:
      "The candidate shows relevant backend API experience with direct evidence.",
    recommendation: "POTENTIAL_FIT",
    risks: [],
    schemaVersion: "m07-b3-a.v1",
    strengths: [],
    weaknesses: []
  };
}

function createFetchImpl(): FetchImpl {
  return async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify(createValidEvaluationOutput())
            }
          }
        ]
      };
    }
  });
}

describe("LuminAI config adapter", () => {
  it("creates a provider from valid explicit config", () => {
    const config = createLuminAIConfig({
      apiKey: "test-key",
      baseUrl: "https://luminai.test",
      model: "custom-model",
      timeoutMs: 12_000
    });
    const provider = createLuminAIEvaluationProvider(config, {
      fetchImpl: createFetchImpl()
    });

    expect(provider.name).toBe("OPENAI_COMPATIBLE");
    expect(provider.version).toBe("openai-compatible-skeleton-v1");
    expect(config.endpointMode).toBe("chat-completions");
  });

  it("normalizes trailing slashes from baseUrl", async () => {
    const config = createLuminAIConfig({
      apiKey: "test-key",
      baseUrl: "https://luminai.test///",
      model: "custom-model"
    });
    let requestUrl: string | null = null;
    const fetchImpl: FetchImpl = async (url) => {
      requestUrl = url;

      return createFetchImpl()(url);
    };
    const provider = createLuminAIEvaluationProvider(config, {
      fetchImpl
    });

    await provider.evaluate({
      jobDescription: "Need backend API TypeScript experience.",
      resumeText: "Built backend API TypeScript services.",
      runId: "run-1"
    });

    expect(config.baseUrl).toBe("https://luminai.test");
    expect(requestUrl).toBe("https://luminai.test/v1/chat/completions");
  });

  it.each([
    ["a v1 base URL", "https://luminai.test/v1", "chat-completions", "https://luminai.test/v1/chat/completions"],
    ["a responses base URL", "https://luminai.test/v1/responses/", "responses", "https://luminai.test/v1/responses"]
  ] as const)("does not duplicate endpoint segments for %s", async (_name, baseUrl, endpointMode, expectedUrl) => {
    let requestUrl: string | null = null;
    const provider = createLuminAIEvaluationProvider(
      createLuminAIConfig({
        apiKey: "test-key",
        baseUrl,
        endpointMode,
        model: "custom-model"
      }),
      {
        fetchImpl: async (url) => {
          requestUrl = url;
          return createFetchImpl()(url);
        }
      }
    );

    await provider.evaluate({
      jobDescription: "Need backend API TypeScript experience.",
      resumeText: "Built backend API TypeScript services.",
      runId: "run-1"
    });

    expect(requestUrl).toBe(expectedUrl);
  });

  it("rejects unsupported endpoint modes", () => {
    expect(() =>
      createLuminAIConfig({
        apiKey: "test-key",
        baseUrl: "https://luminai.test",
        endpointMode: "unknown" as never,
        model: "custom-model"
      })
    ).toThrow();
  });

  it("rejects missing or blank apiKey", () => {
    expect(() =>
      createLuminAIConfig({
        apiKey: "",
        baseUrl: "https://luminai.test",
        model: "custom-model"
      })
    ).toThrow("apiKey is required.");
  });

  it("rejects blank model but defaults when model is omitted", () => {
    expect(() =>
      createLuminAIConfig({
        apiKey: "test-key",
        baseUrl: "https://luminai.test",
        model: ""
      })
    ).toThrow("model is required.");

    expect(
      createLuminAIConfig({
        apiKey: "test-key",
        baseUrl: "https://luminai.test"
      }).model
    ).toBe("gpt-5.5");
  });

  it("rejects invalid baseUrl", () => {
    expect(() =>
      createLuminAIConfig({
        apiKey: "test-key",
        baseUrl: "not-a-url",
        model: "custom-model"
      })
    ).toThrow("baseUrl must be a valid URL.");
  });

  it("rejects invalid timeoutMs", () => {
    expect(() =>
      createLuminAIConfig({
        apiKey: "test-key",
        baseUrl: "https://luminai.test",
        model: "custom-model",
        timeoutMs: 0
      })
    ).toThrow("timeoutMs must be a positive number.");
  });

  it("applies default timeoutMs", () => {
    const config = createLuminAIConfig({
      apiKey: "test-key",
      baseUrl: "https://luminai.test",
      model: "custom-model"
    });

    expect(config.timeoutMs).toBe(30_000);
  });

  it("uses injected config instead of process.env", async () => {
    process.env.LUMINAI_API_KEY = "env-key-that-must-not-be-used";

    const config = createLuminAIConfig({
      apiKey: "explicit-key",
      baseUrl: "https://luminai.test",
      model: "custom-model"
    });
    let authorization: string | undefined;
    const fetchImpl: FetchImpl = async (url, init) => {
      authorization = init?.headers?.Authorization;

      return createFetchImpl()(url, init);
    };
    const provider = createLuminAIEvaluationProvider(config, {
      fetchImpl
    });

    await provider.evaluate({
      jobDescription: "Need backend API TypeScript experience.",
      resumeText: "Built backend API TypeScript services.",
      runId: "run-1"
    });

    expect(authorization).toBe("Bearer explicit-key");
  });

  it("does not read process.env or create env files", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/evaluation/luminai-config-adapter.ts"),
      "utf8"
    );

    expect(source).not.toContain("process.env");
  });

  it("does not call external services when creating provider", () => {
    let callCount = 0;
    const config = createLuminAIConfig({
      apiKey: "test-key",
      baseUrl: "https://luminai.test",
      model: "custom-model"
    });
    const fetchImpl: FetchImpl = async (url, init) => {
      callCount += 1;

      return createFetchImpl()(url, init);
    };

    createLuminAIEvaluationProvider(config, {
      fetchImpl
    });

    expect(callCount).toBe(0);
  });
});
