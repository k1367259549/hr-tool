import { describe, expect, it } from "vitest";
import {
  CandidateResumeLinkValidationError,
  parseAvailableResumeQuery,
  parseLinkResumePayload
} from "@/utils/candidateResumeLinkValidation";

describe("candidateResumeLinkValidation", () => {
  it("trims resumeId for link payload", () => {
    expect(parseLinkResumePayload({ resumeId: " resume-id " })).toEqual({
      resumeId: "resume-id"
    });
  });

  it("rejects unknown fields in link payload", () => {
    expect(() => parseLinkResumePayload({ resumeId: "resume-id", autoMatch: true })).toThrow(
      CandidateResumeLinkValidationError
    );
  });

  it("rejects blank resumeId", () => {
    expect(() => parseLinkResumePayload({ resumeId: " " })).toThrow("resumeId 为必填项。");
  });

  it("normalizes available resume query values", () => {
    const query = parseAvailableResumeQuery(
      new URLSearchParams("search= resume &fileType=pdf&page=2&pageSize=10")
    );

    expect(query).toEqual({
      fileType: "PDF",
      page: 2,
      pageSize: 10,
      search: "resume"
    });
  });

  it("rejects unsupported fileType", () => {
    expect(() => parseAvailableResumeQuery(new URLSearchParams("fileType=zip"))).toThrow(
      "fileType 仅支持 PDF、DOCX 或 TXT。"
    );
  });

  it("rejects invalid pagination values", () => {
    expect(() => parseAvailableResumeQuery(new URLSearchParams("page=0"))).toThrow(
      "分页参数必须是 1 到 100000 之间的整数。"
    );
    expect(() => parseAvailableResumeQuery(new URLSearchParams("pageSize=101"))).toThrow(
      "分页参数必须是 1 到 100 之间的整数。"
    );
  });
});
