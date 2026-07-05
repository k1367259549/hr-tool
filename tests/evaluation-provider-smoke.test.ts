import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runEvaluationProviderSmoke } from "../scripts/evaluation-provider-smoke";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

type SmokeOptions = Parameters<typeof runEvaluationProviderSmoke>[0];
type FetchImpl = NonNullable<NonNullable<SmokeOptions>["fetchImpl"]>;

const startedAt = "2026-07-05T15:00:00.000Z";
const completedAt = "2026-07-05T15:00:00.075Z";

function createSequentialClock(values: string[]) {
  let index = 0;

  return () => {
    const fallback = values[0] ?? new Date(0).toISOString();
    const value = values[Math.min(index, values.length - 1)] ?? fallback;

    index += 1;

    return new Date(value);
  };
}

function createLogger() {
  const messages: string[] = [];

  return {
    logger: {
      error(message: string) {
        messages.push(message);
      },
      info(message: string) {
        messages.push(message);
      }
    },
    messages
  };
}

function createEnv(overrides?: Record<string, string | undefined>) {
  return {
    AI_API_KEY: "secret-smoke-key",
    AI_BASE_URL: "https://luminai.test",
    AI_MODEL: "gpt-5.5-smoke",
    EVALUATION_PROVIDER_SMOKE: "1",
    ...overrides
  };
}

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

function createSuccessFetch(): { fetchImpl: FetchImpl; getCallCount: () => number } {
  let callCount = 0;
  const fetchImpl: FetchImpl = async () => {
    callCount += 1;

    return {
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
    };
  };

  return {
    fetchImpl,
    getCallCount: () => callCount
  };
}

describe("evaluation provider smoke script", () => {
  it("exits safely by default and does not call fetch", async () => {
    const { fetchImpl, getCallCount } = createSuccessFetch();
    const { logger, messages } = createLogger();

    const result = await runEvaluationProviderSmoke({
      env: {},
      fetchImpl,
      logger
    });

    expect(result).toMatchObject({
      exitCode: 0,
      status: "skipped"
    });
    expect(getCallCount()).toBe(0);
    expect(messages.join("\n")).toContain("EVALUATION_PROVIDER_SMOKE=1");
  });

  it("does not call fetch when required config is missing", async () => {
    const { fetchImpl, getCallCount } = createSuccessFetch();
    const { logger, messages } = createLogger();

    const result = await runEvaluationProviderSmoke({
      env: {
        EVALUATION_PROVIDER_SMOKE: "1"
      },
      fetchImpl,
      logger
    });

    expect(result).toMatchObject({
      exitCode: 1,
      status: "failed"
    });
    expect(getCallCount()).toBe(0);
    expect(messages.join("\n")).toContain("AI_BASE_URL and AI_API_KEY");
  });

  it("reports config validation failure without calling fetch", async () => {
    const { fetchImpl, getCallCount } = createSuccessFetch();
    const { logger, messages } = createLogger();

    const result = await runEvaluationProviderSmoke({
      env: createEnv({
        AI_BASE_URL: "not-a-url"
      }),
      fetchImpl,
      logger
    });

    expect(result).toMatchObject({
      error: "baseUrl must be a valid URL.",
      exitCode: 1,
      status: "failed"
    });
    expect(getCallCount()).toBe(0);
    expect(messages.join("\n")).toContain("baseUrl must be a valid URL.");
  });

  it("runs a mocked success path without real network", async () => {
    const { fetchImpl, getCallCount } = createSuccessFetch();
    const { logger, messages } = createLogger();

    const result = await runEvaluationProviderSmoke({
      env: createEnv(),
      fetchImpl,
      idGenerator: () => "audit-smoke",
      logger,
      now: createSequentialClock([
        startedAt,
        startedAt,
        startedAt,
        completedAt,
        completedAt,
        completedAt,
        completedAt,
        completedAt
      ])
    });

    expect(result).toMatchObject({
      auditEventCount: 4,
      exitCode: 0,
      model: "gpt-5.5-smoke",
      overallScore: 82,
      providerName: "OPENAI_COMPATIBLE",
      recommendation: "POTENTIAL_FIT",
      runId: "smoke-run-001",
      status: "success"
    });
    expect(result.status === "success" ? result.durationMs : -1).toBeGreaterThanOrEqual(
      0
    );
    expect(getCallCount()).toBe(1);
    expect(messages).toContain("success");
    expect(messages.join("\n")).not.toContain("secret-smoke-key");
  });

  it("runs a mocked provider failure path", async () => {
    let callCount = 0;
    const fetchImpl: FetchImpl = async () => {
      callCount += 1;

      return {
        ok: false,
        status: 500,
        async json() {
          return {};
        }
      };
    };
    const { logger, messages } = createLogger();

    const result = await runEvaluationProviderSmoke({
      env: createEnv(),
      fetchImpl,
      idGenerator: () => "audit-smoke",
      logger,
      now: createSequentialClock([startedAt, startedAt, completedAt, completedAt])
    });

    expect(result).toMatchObject({
      exitCode: 1,
      failureReason: "PROVIDER_ERROR",
      model: "gpt-5.5-smoke",
      providerName: "OPENAI_COMPATIBLE",
      runId: "smoke-run-001",
      status: "failed"
    });
    expect(callCount).toBe(1);
    expect(messages.join("\n")).toContain("failureReason=PROVIDER_ERROR");
    expect(messages.join("\n")).not.toContain("secret-smoke-key");
  });

  it("does not add API, UI, Prisma, prompt, or env file behavior", () => {
    const source = readFileSync(
      join(process.cwd(), "scripts/evaluation-provider-smoke.ts"),
      "utf8"
    );

    expect(source).not.toContain("prisma");
    expect(source).not.toContain("/api/");
    expect(source).not.toContain("prompts/");
    expect(source).not.toContain("writeFile");
  });
});
