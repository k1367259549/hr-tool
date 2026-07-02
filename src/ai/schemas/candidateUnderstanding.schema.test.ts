import { describe, expect, it } from "vitest";
import { validateCandidateUnderstandingAiOutput } from "@/ai/schemas/candidateUnderstanding.schema";

const validOutput = {
  evidence: [
    {
      claim: "候选人有招聘流程经验。",
      quote: "负责招聘流程推进",
      sourceChunkIds: ["structure-experience-1"]
    }
  ],
  insights: {
    contextSignals: ["有跨部门协作信号"],
    openQuestions: ["需要确认最近项目规模"],
    relevantExperience: ["招聘流程推进"],
    transferableStrengths: ["沟通协调"]
  },
  missingInformation: ["期望城市"],
  potentialRisks: ["简历未说明团队规模"],
  strengths: ["有招聘执行经验"],
  suggestedInterviewQuestions: ["请介绍一次复杂招聘项目。"],
  suggestedNextActions: ["电话初筛时核实项目规模。"],
  suggestedPhoneScreenQuestions: ["目前求职优先级是什么？"],
  summary: {
    candidateOverview: "候选人具备招聘执行背景。",
    evidenceCoverage: "简历覆盖工作经历，但缺少规模细节。",
    roleContextUnderstanding: "可用于理解其与岗位上下文相关的经历。"
  }
};

describe("candidateUnderstandingAiOutputSchema", () => {
  it("accepts valid candidate understanding output", () => {
    expect(validateCandidateUnderstandingAiOutput(validOutput)).toEqual(validOutput);
  });

  it("rejects forbidden scoring fields", () => {
    const forbiddenFields = [
      "matchScore",
      "score",
      "rank",
      "hireRecommendation",
      "rejectRecommendation"
    ];

    forbiddenFields.forEach((field) => {
      expect(() =>
        validateCandidateUnderstandingAiOutput({
          ...validOutput,
          [field]: "forbidden"
        })
      ).toThrow("禁止");
    });
  });

  it("rejects nested forbidden decision fields", () => {
    expect(() =>
      validateCandidateUnderstandingAiOutput({
        ...validOutput,
        summary: {
          ...validOutput.summary,
          hireRecommendation: "hire"
        }
      })
    ).toThrow("禁止");
  });
});
