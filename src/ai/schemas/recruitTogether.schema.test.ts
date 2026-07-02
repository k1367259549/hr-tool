import { describe, expect, it } from "vitest";
import {
  validateInterviewPreparationOutput,
  validatePhoneScreenPreparationOutput,
  validateRecruiterSummaryOutput
} from "@/ai/schemas/recruitTogether.schema";

describe("recruitTogether schemas", () => {
  it("accepts valid phone, interview, and summary outputs", () => {
    expect(
      validatePhoneScreenPreparationOutput({
        conversationChecklist: ["确认候选人时间"],
        conversationGoals: ["理解候选人动机"],
        informationToConfirm: ["薪资期望"],
        keyVerificationQuestions: ["请介绍最近一段经历。"],
        riskVerificationQuestions: ["简历中空窗期是什么原因？"],
        suggestedOpening: "你好，我想先了解你的基本求职情况。",
        thingsToAvoid: ["不要做录用承诺"]
      })
    ).toMatchObject({ suggestedOpening: expect.any(String) });

    expect(
      validateInterviewPreparationOutput({
        evidenceToVerify: ["项目规模"],
        highPriorityTopics: ["协作方式"],
        interviewFocus: ["岗位相关经验"],
        missingInformation: ["可到岗时间"],
        possibleFollowUpQuestions: ["为什么这样推进？"],
        suggestedQuestions: ["请介绍一个复杂项目。"]
      })
    ).toMatchObject({ interviewFocus: ["岗位相关经验"] });

    expect(
      validateRecruiterSummaryOutput({
        candidateTimeline: ["上传简历", "电话沟通"],
        confirmedFacts: ["有招聘经验"],
        openQuestions: ["薪资待确认"],
        recruiterNotesSummary: "候选人沟通清晰。",
        suggestedNextRecruiterActions: ["向业务方同步信息"],
        unconfirmedFacts: ["团队规模"]
      })
    ).toMatchObject({ recruiterNotesSummary: "候选人沟通清晰。" });
  });

  it("rejects forbidden decision fields", () => {
    expect(() =>
      validateRecruiterSummaryOutput({
        candidateTimeline: [],
        confirmedFacts: [],
        hireRecommendation: "hire",
        openQuestions: [],
        recruiterNotesSummary: "summary",
        suggestedNextRecruiterActions: [],
        unconfirmedFacts: []
      })
    ).toThrow("禁止");
  });
});
