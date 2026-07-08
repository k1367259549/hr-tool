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
    candidateName: "Demo Candidate",
    jobDescription: "Need a backend engineer with TypeScript and API experience.",
    jobTitle: "Backend Engineer",
    jobProfileId: "job-profile-1",
    jobUnderstandingJson: {
      coreResponsibilities: ["Build backend API services"],
      interviewFocus: ["API ownership depth"],
      jobSummary: "Backend engineering role for recruiting workflow services.",
      mustHaveRequirements: ["TypeScript", "API design"],
      niceToHaveRequirements: ["HR tooling domain familiarity"],
      risks: ["Availability is not confirmed"],
      screeningFocus: ["Recent backend project depth"]
    },
    jobUnderstandingSummary: "Backend engineering role for recruiting workflow services.",
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
        key: "jd-match",
        label: "JD Match",
        rationale:
          "The resume explicitly describes TypeScript API services, which maps to the backend API requirement in the JD.",
        score: 88
      },
      {
        evidenceIds: ["ev_backend_api"],
        key: "experience-relevance",
        label: "Experience Relevance",
        rationale:
          "The recruiting workflow service experience is relevant to the job context and expected backend ownership.",
        score: 84
      },
      {
        evidenceIds: ["ev_typescript"],
        key: "skill-match",
        label: "Skill Match",
        rationale:
          "The resume names TypeScript and API service work, matching the technical stack requested by the JD.",
        score: 86
      },
      {
        evidenceIds: ["ev_backend_api"],
        key: "communication-signal",
        label: "Communication Signal",
        rationale:
          "The resume gives a concise project description but still needs an interview follow-up to confirm collaboration and written communication quality.",
        score: 68
      },
      {
        evidenceIds: ["ev_missing_availability"],
        key: "risk-and-missing-info",
        label: "Risk And Missing Info",
        rationale:
          "Availability, internship duration, and weekly attendance are not visible in the resume and must be confirmed before moving forward.",
        score: 52
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
        text: "The job description asks for TypeScript and API experience."
      },
      {
        id: "ev_missing_availability",
        relevance: "MEDIUM",
        source: "RESUME",
        text: "The resume does not state availability, internship duration, or weekly attendance."
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
        purpose: "Confirm whether the listed backend work was hands-on and recent.",
        question: "Please walk through the recruiting workflow API project and your direct responsibilities."
      },
      {
        category: "MOTIVATION",
        evidenceIds: ["ev_typescript"],
        purpose: "Check role understanding against the backend internship JD.",
        question: "How do you understand the core work of this backend internship role?"
      },
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_typescript"],
        purpose: "Validate practical TypeScript and API tooling experience.",
        question: "Which TypeScript patterns or testing tools did you use when building the API services?"
      },
      {
        category: "RISK_FOLLOW_UP",
        evidenceIds: ["ev_missing_availability"],
        purpose: "Clarify missing availability and internship commitment information.",
        question: "What is your earliest start date, internship duration, and weekly availability?"
      }
    ],
    notes: null,
    overallScore: 82,
    overallSummary:
      "The candidate is a credible potential fit for the backend internship because the resume mentions TypeScript API service work that maps directly to the JD's backend and API expectations. The strongest evidence is the recruiting workflow service experience, but the evaluation still needs recruiter follow-up on project depth, collaboration scope, availability, internship duration, and weekly attendance before any human decision is made.",
    recommendation: "POTENTIAL_FIT",
    risks: [
      {
        description:
          "The resume does not show availability, internship duration, or weekly attendance, which are important practical constraints for an internship role.",
        evidenceIds: ["ev_missing_availability"],
        severity: "MEDIUM",
        type: "MISSING_REQUIREMENT"
      }
    ],
    schemaVersion: "m07-b3-a.v1",
    strengths: [
      {
        description:
          "The resume states TypeScript API service experience, which maps to the JD's backend API requirement.",
        evidenceIds: ["ev_backend_api", "ev_typescript"],
        title: "Relevant backend API signal"
      },
      {
        description:
          "The recruiting workflow project context is close to the HR tooling domain, making the experience easier to discuss against this role.",
        evidenceIds: ["ev_backend_api"],
        title: "Domain-adjacent project context"
      }
    ],
    weaknesses: [
      {
        description:
          "The resume does not explain the candidate's exact ownership level, so the interviewer should verify whether they designed, implemented, tested, or only assisted the APIs.",
        evidenceIds: ["ev_backend_api"],
        severity: "MEDIUM",
        title: "Ownership depth unclear"
      },
      {
        description:
          "The resume does not mention availability or internship duration, which must be confirmed before treating the match as operationally viable.",
        evidenceIds: ["ev_missing_availability"],
        severity: "MEDIUM",
        title: "Availability missing"
      }
    ],
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
    expect(body.messages[0].content).toContain("Do not make automatic hiring");
    expect(body.messages[0].content).toContain("jd-match");
    expect(body.messages[0].content).toContain("structured job understanding");
    expect(body.messages[1].content).toContain("<JOB_UNDERSTANDING>");
    expect(body.messages[1].content).toContain("</JOB_UNDERSTANDING>");
    expect(body.messages[1].content).toContain("mustHaveRequirements");
    expect(body.messages[1].content).toContain("Recent backend project depth");
    expect(body.messages[1].content).toContain("<JOB_DESCRIPTION>");
    expect(body.messages[1].content).toContain("</JOB_DESCRIPTION>");
    expect(body.messages[1].content).toContain("<RESUME_TEXT>");
    expect(body.messages[1].content).toContain("</RESUME_TEXT>");
    expect(body.messages[1].content).toContain("candidateName: Demo Candidate");
    expect(body.messages[1].content).toContain("jobTitle: Backend Engineer");
    expect(body.messages[1].content).toContain(
      "Need a backend engineer with TypeScript and API experience."
    );
    expect(body.messages[1].content).toContain(
      "Built TypeScript API services for recruiting workflows."
    );
  });

  it("falls back to raw job description when no job understanding context is provided", async () => {
    let requestInit: FetchInit;
    const fetchImpl: FetchImpl = async (_url, init) => {
      requestInit = init;

      return createChatResponse(JSON.stringify(createValidEvaluationOutput()));
    };
    const provider = createProvider(fetchImpl);
    const input = createProviderInput();

    await provider.evaluate({
      ...input,
      jobUnderstandingJson: undefined,
      jobUnderstandingSummary: undefined
    });

    const body = JSON.parse(String(requestInit?.body));

    expect(body.messages[1].content).not.toContain("<JOB_UNDERSTANDING>");
    expect(body.messages[1].content).toContain("<JOB_DESCRIPTION>");
    expect(body.messages[1].content).toContain(input.jobDescription);
  });

  it("sends distinct request bodies for different resumeText values", async () => {
    const requestBodies: string[] = [];
    const fetchImpl: FetchImpl = async (_url, init) => {
      requestBodies.push(String(init?.body));

      return createChatResponse(JSON.stringify(createValidEvaluationOutput()));
    };
    const provider = createProvider(fetchImpl);

    await provider.evaluate({
      ...createProviderInput(),
      resumeText: "Resume A: built TypeScript API services for recruiting workflows."
    });
    await provider.evaluate({
      ...createProviderInput(),
      resumeText: "Resume B: focused on campus operations and Excel reporting."
    });

    expect(requestBodies).toHaveLength(2);
    expect(requestBodies[0]).not.toBe(requestBodies[1]);
    expect(requestBodies[0]).toContain("Resume A");
    expect(requestBodies[1]).toContain("Resume B");
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

  it("fails when parsed output is valid JSON but too generic", async () => {
    const provider = createProvider(
      async () =>
        createChatResponse(
          JSON.stringify(
            createValidEvaluationOutput({
              dimensionScores: [
                {
                  evidenceIds: ["ev_backend_api"],
                  key: "jd-match",
                  label: "JD Match",
                  rationale: "Some match exists.",
                  score: 60
                }
              ],
              evidence: [
                {
                  id: "ev_backend_api",
                  relevance: "LOW",
                  source: "RESUME",
                  text: "No evidence provided."
                }
              ],
              interviewQuestions: [
                {
                  category: "OTHER",
                  evidenceIds: ["ev_backend_api"],
                  purpose: "Clarify.",
                  question: "Tell me about yourself."
                }
              ],
              overallSummary: "No evaluation summary provided.",
              risks: [],
              strengths: [],
              weaknesses: []
            })
          )
        )
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-output-quality-failed",
        message: "AI evaluation output is too generic or lacks evidence."
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
