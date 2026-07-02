import { describe, expect, it } from "vitest";
import {
  parseCandidateCreatePayload,
  parseCandidateUpdatePayload
} from "@/utils/candidateValidation";

describe("candidateValidation", () => {
  it("rejects empty fullName", () => {
    expect(() =>
      parseCandidateCreatePayload({
        fullName: "   "
      })
    ).toThrow("fullName 为必填项");
  });

  it("rejects invalid email", () => {
    expect(() =>
      parseCandidateCreatePayload({
        email: "invalid-email",
        fullName: "候选人甲"
      })
    ).toThrow("email 格式无效");
  });

  it("normalizes valid email", () => {
    expect(
      parseCandidateCreatePayload({
        email: "  USER@Example.COM ",
        fullName: "候选人甲"
      }).email
    ).toBe("user@example.com");
  });

  it("trims and deduplicates tags", () => {
    expect(
      parseCandidateCreatePayload({
        fullName: "候选人甲",
        tags: ["  前端 ", "", "前端", "React"]
      }).tags
    ).toEqual(["前端", "React"]);
  });

  it("trims and deduplicates targetRoles", () => {
    expect(
      parseCandidateCreatePayload({
        fullName: "候选人甲",
        targetRoles: " 前端工程师, ,前端工程师,招聘专员 "
      }).targetRoles
    ).toEqual(["前端工程师", "招聘专员"]);
  });

  it("rejects unknown fields", () => {
    expect(() =>
      parseCandidateCreatePayload({
        archivedAt: "2026-01-01",
        fullName: "候选人甲"
      })
    ).toThrow("不支持的字段");
  });

  it("rejects direct archivedAt updates", () => {
    expect(() =>
      parseCandidateUpdatePayload({
        archivedAt: "2026-01-01"
      })
    ).toThrow("不支持的字段");
  });

  it("rejects PATCH status ARCHIVED", () => {
    expect(() =>
      parseCandidateUpdatePayload({
        status: "ARCHIVED"
      })
    ).toThrow("普通保存不能将候选人设为 ARCHIVED");
  });
});
