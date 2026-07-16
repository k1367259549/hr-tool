import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import { OpenAICompatibleEvaluationProvider } from "@/lib/evaluation/openai-compatible-provider";
import type { DetailedScreeningResultV2 } from "@/types/resume-screening";

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
    analysisMode: "DETAILED" as const,
    candidateId: "candidate-1",
    candidateName: "Demo Candidate",
    evaluationCriteria: [
      {
        description: "Build and maintain TypeScript backend APIs.",
        evidenceGuidance: "Use direct resume evidence about API ownership.",
        importance: "REQUIRED" as const,
        key: "backend-api",
        label: "Backend API"
      },
      {
        description: "Explain relevant workflow service experience.",
        importance: "PREFERRED" as const,
        key: "workflow-experience",
        label: "Workflow Experience"
      }
    ],
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

function createValidDetailedOutput(
  overrides?: Partial<DetailedScreeningResultV2>
): DetailedScreeningResultV2 {
  return {
    dimensions: [
      {
        conclusion:
          "The resume explicitly describes TypeScript API services, which maps to the backend API requirement in the JD.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "TypeScript backend API experience",
            source: "RESUME",
            text: "Built and maintained TypeScript backend APIs."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: [],
        name: "JD Match",
        risks: [],
        score: 88
      },
      {
        conclusion:
          "The recruiting workflow service experience is relevant to the job context and expected backend ownership.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Backend service ownership",
            source: "RESUME",
            text: "Built and maintained TypeScript backend APIs."
          }
        ],
        key: "experience_quality",
        matchLevel: "high",
        missingInformation: ["Availability and internship duration are not visible."],
        name: "Experience Relevance",
        risks: ["Ownership depth still needs interview confirmation."],
        score: 84
      },
      {
        conclusion:
          "The resume names TypeScript and API service work, matching the technical stack requested by the JD.",
        evidence: [
          {
            id: "ev_typescript_requirement",
            relatedRequirement: "TypeScript",
            source: "JOB_REQUIREMENT",
            text: "The job description asks for TypeScript and API experience."
          }
        ],
        key: "core_capability",
        matchLevel: "high",
        missingInformation: [],
        name: "Skill Match",
        risks: [],
        score: 86
      },
      {
        conclusion:
          "The resume gives a concise project description but still needs an interview follow-up to confirm collaboration and written communication quality.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Project communication",
            source: "RESUME",
            text: "Built and maintained TypeScript backend APIs."
          }
        ],
        key: "company_background",
        matchLevel: "medium",
        missingInformation: ["Collaboration and communication context are not explicit."],
        name: "Communication Signal",
        risks: ["Communication evidence is indirect."],
        score: 68
      },
      {
        conclusion:
          "Availability, internship duration, and weekly attendance are not visible in the resume and must be confirmed before moving forward.",
        evidence: [
          {
            id: "ev_missing_availability",
            relatedRequirement: "Internship availability",
            source: "MISSING_INFORMATION",
            text: "The resume does not state availability, internship duration, or weekly attendance."
          }
        ],
        key: "risk_control",
        matchLevel: "medium",
        missingInformation: [
          "Availability, internship duration, and weekly attendance are not visible."
        ],
        name: "Risk And Missing Info",
        risks: ["Operational availability is not confirmed."],
        score: 52
      }
    ],
    contractVersion: "detailed-screening.v2",
    criterionAssessments: [
      {
        conclusion: "The resume states TypeScript API service work that maps to the backend API criterion.",
        criterionKey: "backend-api",
        criterionLabel: "Backend API",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "TypeScript backend API experience",
            source: "RESUME",
            text: "Built and maintained TypeScript backend APIs."
          }
        ],
        interviewQuestions: ["Which API design decisions did you own?"],
        missingInformation: [],
        risks: [],
        score: 88
      },
      {
        conclusion: "The recruiting workflow service experience is relevant to the workflow experience criterion.",
        criterionKey: "workflow-experience",
        criterionLabel: "Workflow Experience",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Workflow service experience",
            source: "RESUME",
            text: "Built and maintained TypeScript backend APIs."
          }
        ],
        interviewQuestions: [],
        missingInformation: [],
        risks: [],
        score: 84
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relatedRequirement: "TypeScript backend API experience",
        source: "RESUME",
        text: "Built and maintained TypeScript backend APIs."
      },
      {
        id: "ev_typescript_requirement",
        relatedRequirement: "TypeScript",
        source: "JOB_REQUIREMENT",
        text: "The job description asks for TypeScript and API experience."
      },
      {
        id: "ev_missing_availability",
        relatedRequirement: "Internship availability",
        source: "MISSING_INFORMATION",
        text: "The resume does not state availability, internship duration, or weekly attendance."
      }
    ],
    interviewQuestions: [
      "Which API design trade-offs did you own?",
      "Please walk through the recruiting workflow API project and your direct responsibilities.",
      "How do you understand the core work of this backend internship role?",
      "Which TypeScript patterns or testing tools did you use when building the API services?",
      "What is your earliest start date, internship duration, and weekly availability?"
    ],
    missingInformation: [
      "Availability, internship duration, and weekly attendance are not visible."
    ],
    nextStep:
      "Recruiter should manually confirm ownership depth and availability before deciding whether to proceed.",
    notes: null,
    overallScore: 82,
    recommendation: "PROCEED_TO_NEXT_STEP",
    risks: [
      {
        description:
          "The resume does not show availability, internship duration, or weekly attendance, which are important practical constraints for an internship role.",
        severity: "medium",
        title: "Availability missing"
      }
    ],
    schemaVersion: "m11-a.detailed.v2",
    screeningMode: "DETAILED",
    strengths: [
      "The resume states TypeScript API service experience, which maps to the JD's backend API requirement.",
      "The recruiting workflow project context is close to the HR tooling domain, making the experience easier to discuss against this role."
    ],
    summary:
      "The candidate is a credible potential fit for the backend internship because the resume mentions TypeScript API service work that maps directly to the JD's backend and API expectations. The strongest evidence is the recruiting workflow service experience, but the evaluation still needs recruiter follow-up on project depth, collaboration scope, availability, internship duration, and weekly attendance before any human decision is made.",
    weaknesses: [
      "The resume does not explain the candidate's exact ownership level, so the interviewer should verify whether they designed, implemented, tested, or only assisted the APIs.",
      "The resume does not mention availability or internship duration, which must be confirmed before treating the match as operationally viable."
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
  createChatResponse(JSON.stringify(createValidDetailedOutput()))
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

      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
    };

    createProvider(fetchImpl);

    expect(callCount).toBe(0);
  });

  it("returns legal output from a successful mock response", async () => {
    const output = createValidDetailedOutput();
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
      expect(result.detailedScreeningResult).toEqual(output);
      expect(result.output).toMatchObject({
        overallScore: output.overallScore,
        overallSummary: output.summary,
        recommendation: "POTENTIAL_FIT",
        schemaVersion: "m07-b3-a.v1"
      });
      expect(bindEvaluationRunOutput(result.output).success).toBe(true);
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

  it("extracts detailed output from a markdown JSON code fence", async () => {
    const output = createValidDetailedOutput({
      overallScore: 79,
      recommendation: "MANUAL_REVIEW"
    });
    const provider = createProvider(
      async () => createChatResponse(`\`\`\`json\n${JSON.stringify(output)}\n\`\`\``)
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.detailedScreeningResult).toEqual(output);
      expect(result.output).toMatchObject({
        overallScore: 79,
        recommendation: "UNCERTAIN"
      });
    }
  });

  it("sends an OpenAI-compatible chat completions request body", async () => {
    let requestInit: FetchInit;
    const fetchImpl: FetchImpl = async (_url, init) => {
      requestInit = init;

      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
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
    expect(body.messages[0].content).toContain("Do not automatically hire");
    expect(body.messages[0].content).toContain("job_match");
    expect(body.messages[0].content).toContain("structured job understanding");
    expect(body.messages[0].content).toContain("screeningMode must be DETAILED");
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
    expect(body.messages[1].content).toContain("<EVALUATION_CRITERIA>");
    expect(body.messages[1].content).toContain("backend-api");
    expect(body.messages[1].content).toContain("Backend API");
    expect(body.messages[1].content).toContain("Build and maintain TypeScript backend APIs.");
    expect(body.messages[1].content).toContain("REQUIRED");
    expect(body.messages[1].content).toContain("Use direct resume evidence about API ownership.");
  });

  it("normalizes valid detailed assessments to template order without matching labels", async () => {
    const output = createValidDetailedOutput({
      criterionAssessments: [
        {
          ...createValidDetailedOutput().criterionAssessments[1]!,
          criterionLabel: "Untrusted provider label"
        },
        {
          ...createValidDetailedOutput().criterionAssessments[0]!,
          criterionLabel: "Another untrusted label"
        }
      ]
    });
    const provider = createProvider(async () => createChatResponse(JSON.stringify(output)));

    const result = await provider.evaluate(createProviderInput());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.detailedScreeningResult?.schemaVersion).toBe("m11-a.detailed.v2");
      if (result.detailedScreeningResult?.schemaVersion !== "m11-a.detailed.v2") {
        throw new Error("Expected V2 detailed screening result.");
      }

      expect(result.detailedScreeningResult.criterionAssessments.map((item) => item.criterionKey)).toEqual([
        "backend-api",
        "workflow-experience"
      ]);
      expect(result.detailedScreeningResult.criterionAssessments.map((item) => item.criterionLabel)).toEqual([
        "Backend API",
        "Workflow Experience"
      ]);
    }
  });

  it.each([
    ["missing", createValidDetailedOutput({ criterionAssessments: [createValidDetailedOutput().criterionAssessments[0]!] }), "openai-compatible-detailed-criterion-key-missing"],
    ["unknown", createValidDetailedOutput({ criterionAssessments: [...createValidDetailedOutput().criterionAssessments, { ...createValidDetailedOutput().criterionAssessments[1]!, criterionKey: "unknown-key" }] }), "openai-compatible-detailed-criterion-key-unknown"],
    ["duplicate", createValidDetailedOutput({ criterionAssessments: [createValidDetailedOutput().criterionAssessments[0]!, { ...createValidDetailedOutput().criterionAssessments[0]! }] }), "openai-compatible-detailed-criterion-key-duplicate"],
    ["underscore", createValidDetailedOutput({ criterionAssessments: [{ ...createValidDetailedOutput().criterionAssessments[0]!, criterionKey: "backend_api" }, createValidDetailedOutput().criterionAssessments[1]!] }), "openai-compatible-detailed-contract-version-invalid"],
    ["case", createValidDetailedOutput({ criterionAssessments: [{ ...createValidDetailedOutput().criterionAssessments[0]!, criterionKey: "Backend-Api" }, createValidDetailedOutput().criterionAssessments[1]!] }), "openai-compatible-detailed-contract-version-invalid"]
  ])("rejects %s criterion keys without fuzzy mapping", async (_name, output, code) => {
    const provider = createProvider(async () => createChatResponse(JSON.stringify(output)));

    await expect(provider.evaluate(createProviderInput())).resolves.toMatchObject({
      error: { code },
      failureReason: "VALIDATION_ERROR",
      success: false
    });
  });

  it("falls back to raw job description when no job understanding context is provided", async () => {
    let requestInit: FetchInit;
    const fetchImpl: FetchImpl = async (_url, init) => {
      requestInit = init;

      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
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

      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
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

  it("rejects empty detailed analysis input before calling fetch", async () => {
    let callCount = 0;
    const fetchImpl: FetchImpl = async () => {
      callCount += 1;

      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
    };
    const provider = createProvider(fetchImpl);

    const result = await provider.evaluate({
      ...createProviderInput(),
      resumeText: "   "
    });

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-input-invalid",
        message: "resumeText is required for detailed analysis."
      },
      failureReason: "VALIDATION_ERROR",
      success: false
    });
    expect(callCount).toBe(0);
  });

  it("rejects detailed input without formal evaluation criteria before calling fetch", async () => {
    let callCount = 0;
    const provider = createProvider(async () => {
      callCount += 1;
      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
    });

    const result = await provider.evaluate({
      ...createProviderInput(),
      evaluationCriteria: []
    });

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-input-invalid",
        message: "evaluationCriteria is required for criterion-aware detailed analysis."
      },
      success: false
    });
    expect(callCount).toBe(0);
  });

  it("fails when response content is invalid JSON", async () => {
    const provider = createProvider(async () => createChatResponse("{bad-json"));

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-invalid-json"
      },
      failureReason: "VALIDATION_ERROR",
      success: false
    });
  });

  it("fails when parsed output does not match DetailedScreeningResult", async () => {
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
        code: "openai-compatible-schema-validation-failed"
      },
      failureReason: "VALIDATION_ERROR",
      success: false
    });
  });

  it("fails when parsed output omits required detailed evidence", async () => {
    const provider = createProvider(
      async () =>
        createChatResponse(
          JSON.stringify(
            createValidDetailedOutput({
              dimensions: [],
              evidence: [],
              summary: "No evaluation summary provided."
            })
          )
        )
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        code: "openai-compatible-detailed-contract-version-invalid"
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
        code: "openai-compatible-provider-response-error"
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

  it("redacts apiKey values from provider error messages", async () => {
    const provider = createProvider(
      async () => {
        throw new Error("Network failed for explicit-test-key.");
      }
    );

    const result = await provider.evaluate(createProviderInput());

    expect(result).toMatchObject({
      error: {
        message: "Network failed for [redacted]."
      },
      success: false
    });
  });

  it("maps timeout to TIMEOUT", async () => {
    const provider = new OpenAICompatibleEvaluationProvider({
      apiKey: "explicit-test-key",
      baseUrl: "https://provider.test",
      fetchImpl: () => new Promise(() => undefined),
      model: "gpt-5.5-compatible",
      now: createSequentialClock([startedAt, completedAt]),
      timeoutMs: 1
    });

    const result = await provider.evaluate(createProviderInput());

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
      promptFile: "prompts/detailed-analysis.md",
      promptVersion: "2.0",
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

      return createChatResponse(JSON.stringify(createValidDetailedOutput()));
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
