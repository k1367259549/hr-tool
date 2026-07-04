import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";
import type { ResumeEvaluationDetailDto } from "@/types/resumeEvaluationResult";

const serviceMock = vi.hoisted(() => ({
  submitReview: vi.fn()
}));

vi.mock("@/services/resumeEvaluationResult.service", () => ({
  ResumeEvaluationResultServiceError: class ResumeEvaluationResultServiceError extends Error {
    readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT";

    constructor(
      code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "CONFLICT",
      message: string
    ) {
      super(message);
      this.name = "ResumeEvaluationResultServiceError";
      this.code = code;
    }
  },
  resumeEvaluationResultService: serviceMock
}));

const baseEvaluation: ResumeEvaluationDetailDto = {
  createdAt: "2026-07-04T00:00:00.000Z",
  criterionResults: [],
  evaluatedBy: null,
  events: [],
  id: "eval-1",
  jobProfileId: "job-1",
  jobProfileVersion: "2026-07-04T00:00:00.000Z",
  overallNote: null,
  parsedSnapshotId: "snapshot-1",
  resumeId: "resume-1",
  resumeRevisionId: "revision-1",
  reviewedAt: "2026-07-04T17:00:00.000Z",
  reviewedBy: "kgj",
  reviewedRunId: "run-1",
  reviewerDecision: "PASS",
  reviewerNotes: "Looks good",
  revision: 0,
  selectedRunId: "run-1",
  status: "DRAFT",
  templateVersionId: "template-version-1",
  updatedAt: "2026-07-04T17:00:00.000Z"
};

describe("PATCH /api/evaluations/[id]/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits run-backed reviewer decision and returns a safe DTO", async () => {
    vi.mocked(serviceMock.submitReview).mockResolvedValueOnce(baseEvaluation);

    const { PATCH } = await import("@/app/api/evaluations/[id]/review/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/evaluations/eval-1/review", {
        actor: "kgj",
        reviewerDecision: "PASS",
        reviewerNotes: "Looks good"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );
    const json = await readApiJson<ResumeEvaluationDetailDto>(response);

    expect(response.status).toBe(200);
    expect(serviceMock.submitReview).toHaveBeenCalledWith("eval-1", {
      actor: "kgj",
      manualReviewWithoutRunBasis: false,
      reviewerDecision: "PASS",
      reviewerNotes: "Looks good"
    });
    expect(json.data).toMatchObject({
      id: "eval-1",
      reviewedBy: "kgj",
      reviewedRunId: "run-1",
      reviewerDecision: "PASS"
    });
    expect(JSON.stringify(json.data)).not.toContain("rawOutputJson");
    expect(JSON.stringify(json.data)).not.toContain("parsedText");
    expect(JSON.stringify(json.data)).not.toContain("promptBody");
    expect(JSON.stringify(json.data)).not.toContain("secret");
  });

  it("submits manual review without run basis when explicit and notes are present", async () => {
    vi.mocked(serviceMock.submitReview).mockResolvedValueOnce({
      ...baseEvaluation,
      reviewedRunId: null,
      reviewerDecision: "HOLD",
      reviewerNotes: "Manual offline review",
      selectedRunId: null
    });

    const { PATCH } = await import("@/app/api/evaluations/[id]/review/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/evaluations/eval-1/review", {
        actor: null,
        manualReviewWithoutRunBasis: true,
        reviewerDecision: "HOLD",
        reviewerNotes: "Manual offline review"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(response.status).toBe(200);
    expect(serviceMock.submitReview).toHaveBeenCalledWith("eval-1", {
      actor: null,
      manualReviewWithoutRunBasis: true,
      reviewerDecision: "HOLD",
      reviewerNotes: "Manual offline review"
    });
  });

  it("rejects no selectedRunId with omitted manual flag through service validation", async () => {
    const { ResumeEvaluationResultServiceError } = await import(
      "@/services/resumeEvaluationResult.service"
    );
    vi.mocked(serviceMock.submitReview).mockRejectedValueOnce(
      new ResumeEvaluationResultServiceError(
        "VALIDATION_ERROR",
        "提交 HR review 前必须先选择一个 SUCCEEDED run。"
      )
    );

    const { PATCH } = await import("@/app/api/evaluations/[id]/review/route");
    const response = await PATCH(
      createJsonRequest("http://localhost/api/evaluations/eval-1/review", {
        reviewerDecision: "PASS"
      }),
      { params: Promise.resolve({ id: "eval-1" }) }
    );

    expect(response.status).toBe(400);
  });

  it("rejects manual review without notes, invalid decision, invalid JSON, and extra fields", async () => {
    const { PATCH } = await import("@/app/api/evaluations/[id]/review/route");
    const invalidJsonRequest = new Request("http://localhost/api/evaluations/eval-1/review", {
      body: "{invalid-json",
      headers: { "content-type": "application/json" },
      method: "PATCH"
    });

    await expect(
      PATCH(
        createJsonRequest("http://localhost/api/evaluations/eval-1/review", {
          manualReviewWithoutRunBasis: true,
          reviewerDecision: "PASS"
        }),
        { params: Promise.resolve({ id: "eval-1" }) }
      )
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      PATCH(
        createJsonRequest("http://localhost/api/evaluations/eval-1/review", {
          reviewerDecision: "AI_PASS"
        }),
        { params: Promise.resolve({ id: "eval-1" }) }
      )
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      PATCH(invalidJsonRequest as never, { params: Promise.resolve({ id: "eval-1" }) })
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      PATCH(
        createJsonRequest("http://localhost/api/evaluations/eval-1/review", {
          reviewerDecision: "PASS",
          unexpected: true
        }),
        { params: Promise.resolve({ id: "eval-1" }) }
      )
    ).resolves.toMatchObject({ status: 400 });
    expect(serviceMock.submitReview).not.toHaveBeenCalled();
  });
});

describe("reviewer decision API route boundaries", () => {
  it("does not import Prisma, AI providers, prompts, latestRunId, or automation concepts", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "src", "app", "api", "evaluations", "[id]", "review", "route.ts"),
      "utf8"
    );

    expect(routeSource).not.toContain("@/lib/prisma");
    expect(routeSource).not.toContain("@/ai");
    expect(routeSource).not.toContain("openai");
    expect(routeSource).not.toContain("/prompts");
    expect(routeSource).not.toContain("latestRunId");
    expect(routeSource).not.toContain("ranking");
    expect(routeSource).not.toContain("matching");
    expect(routeSource).not.toContain("pipeline");
    expect(routeSource).not.toContain("autoReject");
    expect(routeSource).not.toContain("autoHire");
  });
});
