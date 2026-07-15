import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";

const serviceMock = vi.hoisted(() => ({
  reviewDetailedAnalysisRun: vi.fn()
}));

vi.mock("@/services/resumeEvaluationResult.service", () => ({
  ResumeEvaluationResultServiceError: class ResumeEvaluationResultServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.code = code;
    }
  },
  resumeEvaluationResultService: serviceMock
}));

describe("POST /api/evaluations/[id]/detailed-analysis/[runId]/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates a valid detailed review to the service without exposing provider data", async () => {
    serviceMock.reviewDetailedAnalysisRun.mockResolvedValueOnce({
      criterionResults: [],
      events: [],
      id: "eval-1",
      overallNote: null,
      revision: 2,
      selectedRunId: "run-1",
      status: "DRAFT"
    });

    const { POST } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/[runId]/review/route"
    );
    const response = await POST(
      createJsonRequest(
        "http://localhost/api/evaluations/eval-1/detailed-analysis/run-1/review",
        {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 1,
          note: "Reviewed the evidence.",
          reviewer: "Recruiter A"
        }
      ) as NextRequest,
      { params: Promise.resolve({ id: "eval-1", runId: "run-1" }) }
    );
    const json = await readApiJson<{ selectedRunId: string }>(response);

    expect(response.status).toBe(200);
    expect(serviceMock.reviewDetailedAnalysisRun).toHaveBeenCalledWith("eval-1", "run-1", {
      decision: "ACCEPTED_AS_REFERENCE",
      expectedRevision: 1,
      note: "Reviewed the evidence.",
      reviewer: "Recruiter A"
    });
    expect(json.data?.selectedRunId).toBe("run-1");
    expect(JSON.stringify(json)).not.toContain("apiKey");
    expect(JSON.stringify(json)).not.toContain("rawOutputJson");
  });

  it("rejects invalid body shapes before the service is called", async () => {
    const { POST } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/[runId]/review/route"
    );
    const response = await POST(
      createJsonRequest(
        "http://localhost/api/evaluations/eval-1/detailed-analysis/run-1/review",
        { decision: "REJECTED", expectedRevision: 1, reviewer: "Recruiter A" }
      ) as NextRequest,
      { params: Promise.resolve({ id: "eval-1", runId: "run-1" }) }
    );

    expect(response.status).toBe(400);
    expect(serviceMock.reviewDetailedAnalysisRun).not.toHaveBeenCalled();
  });

  it("maps controlled conflicts without direct Prisma access", async () => {
    const { ResumeEvaluationResultServiceError } = await import(
      "@/services/resumeEvaluationResult.service"
    );
    serviceMock.reviewDetailedAnalysisRun.mockRejectedValueOnce(
      new ResumeEvaluationResultServiceError("CONFLICT", "请先重新开放人工评估。")
    );

    const { POST } = await import(
      "@/app/api/evaluations/[id]/detailed-analysis/[runId]/review/route"
    );
    const response = await POST(
      createJsonRequest(
        "http://localhost/api/evaluations/eval-1/detailed-analysis/run-1/review",
        {
          decision: "ACCEPTED_AS_REFERENCE",
          expectedRevision: 1,
          reviewer: "Recruiter A"
        }
      ) as NextRequest,
      { params: Promise.resolve({ id: "eval-1", runId: "run-1" }) }
    );

    expect(response.status).toBe(409);
  });
});
