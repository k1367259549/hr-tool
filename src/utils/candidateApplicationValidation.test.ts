import { describe, expect, it } from "vitest";
import {
  CandidateApplicationValidationError,
  assertApplicationTransitionAllowed,
  parseApplicationCreatePayload,
  parseApplicationListQuery,
  parseApplicationTransitionPayload,
  parseApplicationUpdatePayload
} from "@/utils/candidateApplicationValidation";

describe("candidateApplicationValidation", () => {
  it("parses create payload and trims IDs", () => {
    expect(
      parseApplicationCreatePayload({
        candidateId: " candidate-id ",
        jobProfileId: " job-id ",
        notes: " note ",
        owner: " owner ",
        sourceChannel: " referral "
      })
    ).toEqual({
      candidateId: "candidate-id",
      jobProfileId: "job-id",
      notes: "note",
      owner: "owner",
      sourceChannel: "referral"
    });
  });

  it("rejects unknown create and update fields", () => {
    expect(() => parseApplicationCreatePayload({ candidateId: "c", jobProfileId: "j", score: 10 })).toThrow(
      CandidateApplicationValidationError
    );
    expect(() => parseApplicationUpdatePayload({ currentStage: "OFFER" })).toThrow(
      "不支持的字段：currentStage。"
    );
    expect(() => parseApplicationUpdatePayload({ closedAt: "2026-01-01" })).toThrow(
      "不支持的字段：closedAt。"
    );
  });

  it("rejects empty patch", () => {
    expect(() => parseApplicationUpdatePayload({})).toThrow("更新内容不能为空。");
  });

  it("parses transition payload and rejects invalid stage", () => {
    expect(parseApplicationTransitionPayload({ note: " phone ok ", toStage: "PHONE_SCREEN" })).toEqual({
      note: "phone ok",
      toStage: "PHONE_SCREEN"
    });
    expect(() => parseApplicationTransitionPayload({ toStage: "SCORED" })).toThrow("阶段无效。");
  });

  it("parses list query and validates pagination", () => {
    expect(
      parseApplicationListQuery(
        new URLSearchParams("search=alice&stage=NEW&status=all&page=2&pageSize=10")
      )
    ).toMatchObject({
      page: 2,
      pageSize: 10,
      search: "alice",
      stage: "NEW",
      status: "all"
    });
    expect(() => parseApplicationListQuery(new URLSearchParams("pageSize=101"))).toThrow(
      "分页参数必须是 1 到 100 之间的整数。"
    );
  });

  it("enforces transition matrix", () => {
    expect(() => assertApplicationTransitionAllowed("NEW", "RESUME_SCREEN")).not.toThrow();
    expect(() => assertApplicationTransitionAllowed("NEW", "HIRED")).toThrow("不允许的阶段移动。");
    expect(() => assertApplicationTransitionAllowed("HIRED", "OFFER")).toThrow("不允许的阶段移动。");
  });
});
