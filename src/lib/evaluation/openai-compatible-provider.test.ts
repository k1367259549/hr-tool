import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { OpenAICompatibleEvaluationProvider } from "@/lib/evaluation/openai-compatible-provider";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

const startedAt = "2026-07-05T13:00:00.000Z";
const completedAt = "2026-07-05T13:00:00.050Z";
type ProviderOptions = ConstructorParameters<typeof OpenAICompatibleEvaluationProvider>[0];
type FetchImpl = NonNullable<ProviderOptions["fetchImpl"]>;
type FetchInit = Parameters<FetchImpl>[1];

function createSequentialClock(values: string[]) {
  let index = 0;

  return () => {
    const fallback = values[0] ?? new Date(0).toISOString();
    const value = values[Math.min(index, values.length - 1)] ?? fallback;

    index += 1;

    return new Date(value);
  };
}

function createProviderInput() {
  return {
    candidateId: "candidate-1",
    jobDescription: "Need a backend engineer with TypeScript and API experience.",
    jobProfileId: "job-profile-1",
    resumeText: "Built TypeScript API services for recruiting workflows.",
    runId: "run-1",
    templateVersionId: "template-version-1"
  };
}

function createValidEvaluationOutput(
  overrides?: Partial<ResumeEvaluationResult>
): ResumeEvaluationResult {
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
    weaknesses: [],
    ...overrides
  };
}

function createChatResponse(content: string) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content
            }
          }
        ]
      };
    }
  };
}

function createProvider(fetchImpl: FetchImpl = async () =>
  createChatResponse(JSON.stringify(createValidEvaluationOutput()))
) {
  return new OpenAICompatibleEvaluationProvider({
    apiKey: "explicit-test-key",
    baseUrl: "https://provider.test",
    fetchImpl,
    model: "gpt-5.5-compatible",
    now: createSequentialClock([startedAt, completedAt]),
    timeoutMs: 50,
    version: "openai-compatible-test-v1"
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("OpenAICompatibleEvaluationProvider", () => {
  it("does not call the network when constructed", () => {
    let callCount = 0;
    const fetchImpl: FetchImpl = async () => {
      callCount += 1;

      return createChatResponse(JSON.stringify(createValidEvaluationOutput()));
    };

    createProvider(fetchImpl);

    expect(callCount).toBe(0);
  });

  it("returns legal output from a successful mock response", async () => {
    const output = createValidEvaluationOutput();
    let requestUrl: string | null = null;
    let requestInit: FetchInit;
    const fetchImpl: FetchImpl = async (url, init) => {
      requestUrl = url;
      requestInit = init;

      return createChatResponse(JSON.stringify(output));
    };
    const provider = createProvider(fetchImpl);

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.output).toEqual(output);
      expect(bindEvaluationRunOutput(result.output)).toEqual({
        success: true,
        output
      });
    }

    expect(requestUrl).toBe("https://provider.test/v1/chat/completions");
    expect(requestInit).toMatchObject({
      headers: {
        Authorization: "Bearer explicit-test-key",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  });

  it("sends an OpenAI-compatible chat completions request body", async () => {
    let requestInit: FetchInit;
    const fetchImpl: FetchImpl = async (_url, init) => {
      requestInit = init;

      return createChatResponse(JSON.stringify(createValidEvaluationOutput()));
    };
    const provider = createProvider(fetchImpl);

    await provider.evaluate(createProviderInput());

    const body = JSON.parse(String(requestInit?.body));

    expect(body).toMatchObject({
      model: "gpt-5.5-compatible",
      response_format: {
        type: "json_object"
      },
      temperature: 0
    });
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0]).toMatchObject({
      role: "system"
    });
    expect(body.messages[1]).toMatchObject({
      role: "user"
    });
  });

  it("fails when response content is invalid JSON", async () => {
    const provider = createProvider(async () => createChatResponse("{bad-json"));

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-json-parse-failed"
      },
      failureReason: "VALIDATION_ERROR",
      success: false
    });
  });

  it("fails when parsed output does not bind to ResumeEvaluationResult", async () => {
    const provider = createProvider(
      async () =>
        createChatResponse(
          JSON.stringify({
            recommendation: "AUTO_HIRE"
          })
        )
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-output-binding-failed"
      },
      failureReason: "VALIDATION_ERROR",
      success: false
    });
  });

  it("maps HTTP non-2xx responses to PROVIDER_ERROR", async () => {
    const provider = createProvider(
      async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        async json() {
          return {};
        }
      })
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-http-error"
      },
      failureReason: "PROVIDER_ERROR",
      success: false
    });
  });

  it("maps fetch rejection to PROVIDER_ERROR", async () => {
    const provider = createProvider(
      async () => {
        throw new Error("Network unavailable.");
      }
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-network-error",
        message: "Network unavailable."
      },
      failureReason: "PROVIDER_ERROR",
      success: false
    });
  });

  it("maps timeout to TIMEOUT", async () => {
    vi.useFakeTimers();

    const provider = new OpenAICompatibleEvaluationProvider({
      apiKey: "explicit-test-key",
      baseUrl: "https://provider.test",
      fetchImpl: () => new Promise(() => undefined),
      model: "gpt-5.5-compatible",
      now: createSequentialClock([startedAt, completedAt]),
      timeoutMs: 5
    });
    const resultPromise = provider.evaluate(createProviderInput());

    await vi.advanceTimersByTimeAsync(6);

    const result = await resultPromise;

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-timeout"
      },
      failureReason: "TIMEOUT",
      success: false
    });
  });

  it("returns metadata with model, provider, and duration", async () => {
    const provider = createProvider();

    const result = await provider.evaluate(createProviderInput());

    expect(result.metadata).toEqual({
      completedAt,
      durationMs: 50,
      model: "gpt-5.5-compatible",
      providerName: "OPENAI_COMPATIBLE",
      providerVersion: "openai-compatible-test-v1",
      startedAt
    });
  });

  it("uses injected config instead of process.env", async () => {
    process.env.OPENAI_API_KEY = "env-key-that-must-not-be-used";

    let requestInit: FetchInit;
    const fetchImpl: FetchImpl = async (_url, init) => {
      requestInit = init;

      return createChatResponse(JSON.stringify(createValidEvaluationOutput()));
    };
    const provider = createProvider(fetchImpl);

    await provider.evaluate(createProviderInput());

    expect(requestInit?.headers?.Authorization).toBe("Bearer explicit-test-key");
  });

  it("does not contain process.env config reads", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/evaluation/openai-compatible-provider.ts"),
      "utf8"
    );

    expect(source).not.toContain("process.env");
  });
});
