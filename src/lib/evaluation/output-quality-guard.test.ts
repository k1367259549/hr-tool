import { describe, expect, it } from "vitest";
import { validateEvaluationOutputQuality } from "@/lib/evaluation/output-quality-guard";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

describe("validateEvaluationOutputQuality", () => {
  it("accepts detailed evidence-backed evaluation output", () => {
    expect(validateEvaluationOutputQuality(createDetailedOutput())).toEqual({
      success: true
    });
  });

  it("rejects generic summaries", () => {
    expect(
      validateEvaluationOutputQuality(
        createDetailedOutput({
          overallSummary: "No evaluation summary provided."
        })
      )
    ).toEqual({
      success: false,
      error: "AI evaluation output is too generic or lacks evidence."
    });
  });

  it("rejects sparse arrays even when schema shape is valid", () => {
    const detailedOutput = createDetailedOutput();

    expect(
      validateEvaluationOutputQuality(
        createDetailedOutput({
          evidence: [first(detailedOutput.evidence)],
          risks: [],
          strengths: [first(detailedOutput.strengths)],
          weaknesses: [first(detailedOutput.weaknesses)]
        })
      )
    ).toEqual({
      success: false,
      error: "AI evaluation output is too generic or lacks evidence."
    });
  });

  it("requires the detailed evaluation dimensions", () => {
    expect(
      validateEvaluationOutputQuality(
        createDetailedOutput({
          dimensionScores: [
            {
              evidenceIds: ["ev_backend_api"],
              key: "jd-match",
              label: "JD Match",
              rationale: "The candidate has some visible backend API match.",
              score: 75
            },
            {
              evidenceIds: ["ev_backend_api"],
              key: "skill-match",
              label: "Skill Match",
              rationale: "The candidate mentions TypeScript and API service work.",
              score: 75
            },
            {
              evidenceIds: ["ev_missing_availability"],
              key: "risk-and-missing-info",
              label: "Risk And Missing Info",
              rationale: "Availability information is missing and must be confirmed.",
              score: 50
            }
          ]
        })
      )
    ).toEqual({
      success: false,
      error: "AI evaluation output is too generic or lacks evidence."
    });
  });

  it("rejects placeholder content inside detailed fields", () => {
    const detailedOutput = createDetailedOutput();

    expect(
      validateEvaluationOutputQuality(
        createDetailedOutput({
          strengths: [
            {
              description: "No clear strength",
              evidenceIds: ["ev_backend_api"],
              title: "No clear strength"
            },
            second(detailedOutput.strengths)
          ]
        })
      )
    ).toEqual({
      success: false,
      error: "AI evaluation output is too generic or lacks evidence."
    });
  });
});

function createDetailedOutput(
  overrides: Partial<ResumeEvaluationResult> = {}
): ResumeEvaluationResult {
  return {
    confidence: "HIGH",
    dimensionScores: [
      {
        evidenceIds: ["ev_backend_api"],
        key: "jd-match",
        label: "JD Match",
        rationale:
          "The resume describes TypeScript API work that maps directly to the backend API requirement in the JD.",
        score: 86
      },
      {
        evidenceIds: ["ev_backend_api"],
        key: "experience-relevance",
        label: "Experience Relevance",
        rationale:
          "The project is relevant to backend service ownership and the recruiting workflow context.",
        score: 82
      },
      {
        evidenceIds: ["ev_typescript"],
        key: "skill-match",
        label: "Skill Match",
        rationale:
          "The resume names TypeScript and API work, while the JD asks for backend TypeScript experience.",
        score: 84
      },
      {
        evidenceIds: ["ev_backend_api"],
        key: "communication-signal",
        label: "Communication Signal",
        rationale:
          "The resume is concise and project-oriented, but interview follow-up is still needed to validate communication depth.",
        score: 65
      },
      {
        evidenceIds: ["ev_missing_availability"],
        key: "risk-and-missing-info",
        label: "Risk And Missing Info",
        rationale:
          "The resume does not state availability, internship duration, or weekly attendance.",
        score: 48
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relevance: "HIGH",
        source: "RESUME",
        text: "Built TypeScript API services for recruiting workflows."
      },
      {
        id: "ev_typescript",
        relevance: "HIGH",
        source: "JOB_PROFILE",
        text: "The JD asks for TypeScript backend API experience."
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
        category: "EXPERIENCE",
        evidenceIds: ["ev_backend_api"],
        purpose: "Validate recent project ownership and scope.",
        question: "Please walk through the API project and your direct responsibilities."
      },
      {
        category: "MOTIVATION",
        evidenceIds: ["ev_typescript"],
        purpose: "Check understanding of the backend internship role.",
        question: "How do you understand the core work of this backend internship?"
      },
      {
        category: "TECHNICAL",
        evidenceIds: ["ev_typescript"],
        purpose: "Validate TypeScript and API implementation depth.",
        question: "Which TypeScript patterns or testing tools did you use?"
      },
      {
        category: "RISK_FOLLOW_UP",
        evidenceIds: ["ev_missing_availability"],
        purpose: "Confirm internship logistics missing from the resume.",
        question: "What is your earliest start date and weekly availability?"
      },
      {
        category: "OTHER",
        evidenceIds: ["ev_backend_api"],
        purpose: "Clarify communication and collaboration signals.",
        question: "How did you coordinate API requirements with other teammates?"
      }
    ],
    notes: null,
    overallScore: 78,
    overallSummary:
      "The candidate appears to be a potential fit because the resume includes TypeScript API service work that maps to the backend requirements in the JD. The evidence is promising but still incomplete: the recruiter should verify the candidate's exact ownership, technical depth, collaboration context, availability, internship duration, and weekly attendance before making any human review decision.",
    recommendation: "POTENTIAL_FIT",
    risks: [
      {
        description:
          "Availability, internship duration, and weekly attendance are not visible in the resume and should be confirmed before moving forward.",
        evidenceIds: ["ev_missing_availability"],
        severity: "MEDIUM",
        type: "MISSING_REQUIREMENT"
      }
    ],
    schemaVersion: "m07-b3-a.v1",
    strengths: [
      {
        description:
          "The resume includes TypeScript API service work that directly maps to the backend API requirement in the JD.",
        evidenceIds: ["ev_backend_api", "ev_typescript"],
        title: "Backend API match"
      },
      {
        description:
          "The recruiting workflow context is close to the HR tooling domain, which can make the project evidence easier to validate.",
        evidenceIds: ["ev_backend_api"],
        title: "Relevant project context"
      }
    ],
    weaknesses: [
      {
        description:
          "The resume does not specify whether the candidate owned API design, implementation, testing, or maintenance.",
        evidenceIds: ["ev_backend_api"],
        severity: "MEDIUM",
        title: "Ownership depth unclear"
      },
      {
        description:
          "The resume does not include internship availability details, so operational fit remains unresolved.",
        evidenceIds: ["ev_missing_availability"],
        severity: "MEDIUM",
        title: "Availability missing"
      }
    ],
    ...overrides
  };
}

function first<T>(items: T[]): T {
  const item = items[0];

  if (item === undefined) {
    throw new Error("Expected at least one item.");
  }

  return item;
}

function second<T>(items: T[]): T {
  const item = items[1];

  if (item === undefined) {
    throw new Error("Expected at least two items.");
  }

  return item;
}
