import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest, readApiJson } from "../setup/testDb";
import type {
  JobProfile,
  JobProfileDto,
  JobUnderstandingResult
} from "@/types/jobProfile";

vi.mock("@/services/jobUnderstanding.service", () => ({
  JobUnderstandingServiceError: class JobUnderstandingServiceError extends Error {
    readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR";

    constructor(code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
      super(message);
      this.name = "JobUnderstandingServiceError";
      this.code = code;
    }
  },
  jobUnderstandingService: jobUnderstandingServiceMock
}));

const jobUnderstandingResult: JobUnderstandingResult = {
  aiModel: "gpt-test",
  aiProvider: "openai",
  coreResponsibilities: ["Own recruiting delivery"],
  generatedAt: "2026-01-01T00:00:00.000Z",
  generationTimeMs: 1200,
  hiringFocus: ["Clarify role priority"],
  interviewFocus: ["Stakeholder communication"],
  jobSummary: "Recruiting role summary.",
  missingInformation: ["Salary range"],
  potentialRisks: ["JD lacks seniority"],
  preferredCompetencies: ["ATS usage"],
  promptFile: "job-understanding.md",
  promptVersion: "1.0",
  requiredCompetencies: ["Recruiting execution"],
  suggestedFollowUpQuestions: ["What is the target timeline?"],
  workflowId: "00000000-0000-4000-8000-000000000001"
};

const jobUnderstandingServiceMock = {
  generateJobUnderstanding: vi.fn(async (): Promise<JobUnderstandingResult> => jobUnderstandingResult),
  saveReviewedJobProfile: vi.fn(async (input): Promise<JobProfile> => ({
    ...input,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    id: "00000000-0000-4000-8000-000000000002",
    leaderRequirements: input.leaderRequirements ?? null,
    notes: input.notes ?? null,
    reviewedAt: new Date("2026-01-01T00:00:00.000Z"),
    teamBackground: input.teamBackground ?? null,
    updatedAt: new Date("2026-01-01T00:00:00.000Z")
  }))
};

describe("Job Understanding API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/job-understanding/generate returns structured result", async () => {
    const { POST } = await import("@/app/api/job-understanding/generate/route");

    const response = await POST(
      createJsonRequest("http://localhost/api/job-understanding/generate", {
        jd: "Responsible for full-cycle recruiting.",
        jobTitle: "Recruiter"
      }) as never
    );
    const json = await readApiJson<JobUnderstandingResult>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.jobSummary).toBe("Recruiting role summary.");
    expect(jobUnderstandingServiceMock.generateJobUnderstanding).toHaveBeenCalledWith({
      jd: "Responsible for full-cycle recruiting.",
      jobTitle: "Recruiter",
      leaderRequirements: undefined,
      hiringGoal: undefined,
      notes: undefined,
      teamBackground: undefined
    });
  });

  it("POST /api/job-profiles saves reviewed job profile", async () => {
    const { POST } = await import("@/app/api/job-profiles/route");

    const response = await POST(
      createJsonRequest("http://localhost/api/job-profiles", {
        ...jobUnderstandingResult,
        jd: "Responsible for full-cycle recruiting.",
        jobTitle: "Recruiter"
      }) as never
    );
    const json = await readApiJson<JobProfileDto>(response);

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data?.jobTitle).toBe("Recruiter");
    expect(jobUnderstandingServiceMock.saveReviewedJobProfile).toHaveBeenCalled();
  });
});
