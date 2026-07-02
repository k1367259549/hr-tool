import { describe, expect, it } from "vitest";
import {
  validateDailySummaryOutput,
  validateImprovementSuggestionsOutput
} from "@/ai/schemas/dailyWorkspace.schema";

const unified = {
  attention: ["证据不足时需人工确认"],
  audit: ["基于今日活动快照生成"],
  confidence: "medium",
  evidence: ["1 个候选人洞察"],
  insights: ["今日有候选人跟进"],
  suggestedActions: ["明日继续跟进"],
  summary: "今日招聘工作摘要"
};

describe("dailyWorkspace schemas", () => {
  it("accepts valid daily workspace outputs", () => {
    expect(
      validateDailySummaryOutput({
        ...unified,
        candidatesProcessed: ["候选人 A"],
        interviewsCompleted: [],
        jobsWorkedOn: ["招聘专员"],
        keyAchievements: ["完成候选人理解"],
        pendingWork: ["继续跟进"],
        phoneScreensCompleted: [],
        todaysWorkSummary: "今天完成了候选人理解。"
      })
    ).toMatchObject({ todaysWorkSummary: "今天完成了候选人理解。" });
  });

  it("rejects forbidden learning asset fields", () => {
    expect(() =>
      validateImprovementSuggestionsOutput({
        ...unified,
        aiSuggestions: [],
        autoLearn: true,
        potentialProductImprovementNotes: [],
        promptImprovementIdeas: [],
        recruiterEfficiencySuggestions: [],
        workflowImprovementIdeas: []
      })
    ).toThrow("禁止");
  });
});
