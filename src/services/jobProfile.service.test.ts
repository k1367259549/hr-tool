import { describe, expect, it, vi } from "vitest";
import { jobProfileService, toJobProfileDto } from "@/services/jobProfile.service";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type { JobProfile } from "@/types/jobProfile";

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findManyReviewed: vi.fn()
  }
}));

const baseJobProfile: JobProfile = {
  aiModel: "test-model",
  aiProvider: "openai-compatible",
  coreResponsibilities: ["招聘交付"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  generationTimeMs: 1000,
  hiringFocus: ["沟通业务需求"],
  hiringGoal: null,
  id: "job-profile-id",
  interviewFocus: ["候选人沟通"],
  jd: "负责招聘。",
  jobSummary: "招聘岗位。",
  jobTitle: "招聘专员",
  leaderRequirements: null,
  missingInformation: ["薪资范围"],
  notes: null,
  potentialRisks: ["JD 信息不足"],
  preferredCompetencies: ["ATS 使用经验"],
  promptFile: "job-understanding.md",
  promptVersion: "1.0",
  requiredCompetencies: ["招聘执行"],
  reviewedAt: null,
  suggestedFollowUpQuestions: ["目标入职时间？"],
  teamBackground: null,
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  workflowId: "workflow-id"
};

describe("toJobProfileDto", () => {
  it("serializes nullable reviewedAt as null", () => {
    expect(toJobProfileDto(baseJobProfile).reviewedAt).toBeNull();
  });

  it("serializes reviewedAt after human confirmation", () => {
    expect(
      toJobProfileDto({
        ...baseJobProfile,
        reviewedAt: new Date("2026-01-03T00:00:00.000Z")
      }).reviewedAt
    ).toBe("2026-01-03T00:00:00.000Z");
  });
});

describe("jobProfileService", () => {
  it("lists only repository-reviewed job profiles", async () => {
    vi.mocked(jobProfileRepository.findManyReviewed).mockResolvedValueOnce([
      {
        ...baseJobProfile,
        reviewedAt: new Date("2026-01-03T00:00:00.000Z")
      }
    ]);

    const result = await jobProfileService.listReviewedJobProfiles();

    expect(jobProfileRepository.findManyReviewed).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]?.reviewedAt).toBe("2026-01-03T00:00:00.000Z");
  });
});
