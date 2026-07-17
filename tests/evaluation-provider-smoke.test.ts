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
        key: "jd-match",
        label: "JD Match",
        rationale:
          "The resume describes TypeScript backend API services, which maps directly to the smoke JD requirement.",
        score: 88
      },
      {
        evidenceIds: ["ev_backend_api"],
        key: "experience-relevance",
        label: "Experience Relevance",
        rationale:
          "The backend service project is relevant to the demo role and gives an interviewable project basis.",
        score: 84
      },
      {
        evidenceIds: ["ev_typescript"],
        key: "skill-match",
        label: "Skill Match",
        rationale:
          "The resume mentions TypeScript API work and the JD asks for backend TypeScript capability.",
        score: 86
      },
      {
        evidenceIds: ["ev_backend_api"],
        key: "communication-signal",
        label: "Communication Signal",
        rationale:
          "The resume gives a concise technical project signal, but interview follow-up is needed to validate collaboration and explanation clarity.",
        score: 66
      },
      {
        evidenceIds: ["ev_missing_availability"],
        key: "risk-and-missing-info",
        label: "Risk And Missing Info",
        rationale:
          "The resume does not state start date, internship duration, or weekly availability.",
        score: 50
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Built and maintained TypeScript backend APIs."
      },
      {
        id: "ev_typescript",
        relevance: "HIGH",
        source: "JOB_PROFILE",
        text: "The smoke JD asks for TypeScript and backend API experience."
      },
      {
        id: "ev_missing_availability",
        relevance: "MEDIUM",
        source: "RESUME",
        text: "The resume does not mention start date, internship duration, or weekly availability."
      }
    ],
    interviewQuestions: [
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_backend_api"],
        purpose: "Validate depth of backend API ownership.",
        question: "Which API design trade-offs did you own?"
      },
      {
        category: "EXPERIENCE",
        evidenceIds: ["ev_backend_api"],
        purpose: "Confirm the candidate's direct project ownership.",
        question: "Please walk through the backend API project and your exact responsibilities."
      },
      {
        category: "MOTIVATION",
        evidenceIds: ["ev_typescript"],
        purpose: "Check understanding of the target backend internship role.",
        question: "How do you understand the main work of this backend internship?"
      },
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_typescript"],
        purpose: "Validate TypeScript and API implementation depth.",
        question: "Which TypeScript tools or testing practices did you use in the API project?"
      },
      {
        category: "RISK_FOLLOW_UP",
        evidenceIds: ["ev_missing_availability"],
        purpose: "Clarify logistics missing from the resume.",
        question: "What is your earliest start date, internship duration, and weekly availability?"
      }
    ],
    notes: null,
    overallScore: 82,
    overallSummary:
      "The candidate is a credible potential fit for the smoke backend role because the resume mentions TypeScript backend API work that maps to the JD's technical requirements. The evidence is useful but incomplete: the recruiter still needs to verify exact ownership, technical depth, collaboration context, start date, internship duration, and weekly availability before any human review decision.",
    recommendation: "POTENTIAL_FIT",
    risks: [
      {
        description:
          "Start date, internship duration, and weekly availability are not visible in the resume and should be confirmed before moving forward.",
        evidenceIds: ["ev_missing_availability"],
        severity: "MEDIUM",
        type: "MISSING_REQUIREMENT"
      }
    ],
    schemaVersion: "m07-b3-a.v1",
    strengths: [
      {
        description:
          "The resume names TypeScript backend API work, which maps directly to the smoke JD's core technical requirement.",
        evidenceIds: ["ev_backend_api", "ev_typescript"],
        title: "Backend API match"
      },
      {
        description:
          "The API project gives the recruiter a concrete experience thread to validate during phone screening.",
        evidenceIds: ["ev_backend_api"],
        title: "Concrete project evidence"
      }
    ],
    weaknesses: [
      {
        description:
          "The resume does not explain whether the candidate owned design, implementation, testing, or maintenance.",
        evidenceIds: ["ev_backend_api"],
        severity: "MEDIUM",
        title: "Ownership depth unclear"
      },
      {
        description:
          "The resume does not include start date, internship duration, or weekly availability information.",
        evidenceIds: ["ev_missing_availability"],
        severity: "MEDIUM",
        title: "Availability missing"
      }
    ]
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

  it("forwards an explicit Responses endpoint mode to the provider", async () => {
    let requestUrl: string | null = null;
    let requestBody: unknown;
    const { logger } = createLogger();
    const result = await runEvaluationProviderSmoke({
      env: createEnv({
        AI_BASE_URL: "https://luminai.test/v1",
        AI_ENDPOINT_MODE: "responses"
      }),
      fetchImpl: async (url, init) => {
        requestUrl = url;
        requestBody = JSON.parse(String(init?.body));

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              output: [
                {
                  content: [
                    {
                      text: JSON.stringify(createValidEvaluationOutput()),
                      type: "output_text"
                    }
                  ]
                }
              ]
            };
          }
        };
      },
      logger
    });

    expect(result).toMatchObject({ exitCode: 0, status: "success" });
    expect(requestUrl).toBe("https://luminai.test/v1/responses");
    expect(requestBody).toMatchObject({
      input: expect.any(Array),
      model: "gpt-5.5-smoke"
    });
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
