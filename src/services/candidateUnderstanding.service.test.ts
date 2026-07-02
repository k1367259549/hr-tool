import { describe, expect, it, vi } from "vitest";
import { toCandidateInsightDto } from "@/services/candidateUnderstanding.service";
import type { CandidateInsight } from "@/types/candidateUnderstanding";

vi.mock("@/ai/ai.service", () => ({
  aiService: {
    generateValidatedJsonFromPrompt: vi.fn()
  }
}));

vi.mock("@/repositories/candidateInsight.repository", () => ({
  candidateInsightRepository: {
    create: vi.fn()
  }
}));

vi.mock("@/repositories/candidateResume.repository", () => ({
  candidateResumeRepository: {
    create: vi.fn(),
    findById: vi.fn()
  }
}));

vi.mock("@/repositories/jobProfile.repository", () => ({
  jobProfileRepository: {
    findById: vi.fn()
  }
}));

vi.mock("@/utils/resumeParser", () => ({
  parseResumeFile: vi.fn(),
  ResumeParserError: class ResumeParserError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "ResumeParserError";
      this.code = code;
    }
  }
}));

const baseCandidateInsight: CandidateInsight = {
  aiModel: "test-model",
  aiProvider: "openai-compatible",
  candidateSource: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  evidence: [
    {
      claim: "有招聘经验",
      sourceChunkIds: ["chunk-1"]
    }
  ],
  generationTimeMs: 1000,
  id: "candidate-insight-id",
  insights: {
    contextSignals: ["跨部门沟通"],
    openQuestions: ["团队规模"],
    relevantExperience: ["招聘执行"],
    transferableStrengths: ["协调"]
  },
  jobProfileId: "job-profile-id",
  jobProfileVersion: "job-profile-version",
  missingInformation: ["期望城市"],
  notes: null,
  potentialRisks: ["信息不足"],
  promptFile: "candidate-understanding.md",
  promptVersion: "1.0",
  resumeId: "resume-id",
  resumeVersion: "resume-parser-v1",
  reviewedAt: null,
  strengths: ["招聘执行"],
  suggestedInterviewQuestions: ["介绍招聘项目"],
  suggestedNextActions: ["电话初筛"],
  suggestedPhoneScreenQuestions: ["求职优先级？"],
  summary: {
    candidateOverview: "候选人具备招聘经验。",
    evidenceCoverage: "简历覆盖工作经历。",
    roleContextUnderstanding: "与岗位相关。"
  },
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  workflowId: "workflow-id"
};

describe("toCandidateInsightDto", () => {
  it("serializes nullable reviewedAt as null", () => {
    expect(toCandidateInsightDto(baseCandidateInsight).reviewedAt).toBeNull();
  });

  it("serializes reviewedAt after human confirmation", () => {
    expect(
      toCandidateInsightDto({
        ...baseCandidateInsight,
        reviewedAt: new Date("2026-01-03T00:00:00.000Z")
      }).reviewedAt
    ).toBe("2026-01-03T00:00:00.000Z");
  });
});
