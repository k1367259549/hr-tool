import { describe, expect, it } from "vitest";
import {
  parseResumeEvaluationCreatePayload,
  parseResumeEvaluationListQuery,
  parseResumeEvaluationReopenPayload,
  parseResumeEvaluationReviewPayload,
  parseResumeEvaluationUpdatePayload,
  ResumeEvaluationValidationError
} from "@/utils/resumeEvaluationValidation";

describe("parseResumeEvaluationListQuery", () => {
  it("returns defaults with no params", () => {
    const result = parseResumeEvaluationListQuery(new URLSearchParams());
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.resumeId).toBeUndefined();
    expect(result.status).toBeUndefined();
  });

  it("parses all valid params", () => {
    const params = new URLSearchParams({
      jobProfileId: "jp-1",
      page: "3",
      pageSize: "10",
      resumeId: "r-1",
      status: "DRAFT"
    });
    const result = parseResumeEvaluationListQuery(params);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.resumeId).toBe("r-1");
    expect(result.jobProfileId).toBe("jp-1");
    expect(result.status).toBe("DRAFT");
  });

  it("rejects unknown query params", () => {
    const params = new URLSearchParams({ unknown: "x" });
    expect(() => parseResumeEvaluationListQuery(params)).toThrow(
      ResumeEvaluationValidationError
    );
  });

  it("rejects invalid status value", () => {
    const params = new URLSearchParams({ status: "INVALID" });
    expect(() => parseResumeEvaluationListQuery(params)).toThrow(
      ResumeEvaluationValidationError
    );
  });
});

describe("parseResumeEvaluationCreatePayload", () => {
  it("parses valid payload", () => {
    const result = parseResumeEvaluationCreatePayload({
      jobProfileId: "jp-1",
      resumeId: "r-1",
      templateVersionId: "tv-1"
    });
    expect(result.resumeId).toBe("r-1");
    expect(result.jobProfileId).toBe("jp-1");
    expect(result.templateVersionId).toBe("tv-1");
    expect(result.evaluatedBy).toBeUndefined();
  });

  it("parses optional evaluatedBy", () => {
    const result = parseResumeEvaluationCreatePayload({
      evaluatedBy: "招聘官 A",
      jobProfileId: "jp-1",
      resumeId: "r-1",
      templateVersionId: "tv-1"
    });
    expect(result.evaluatedBy).toBe("招聘官 A");
  });

  it("rejects missing required fields", () => {
    expect(() => parseResumeEvaluationCreatePayload({ resumeId: "r-1" })).toThrow(
      ResumeEvaluationValidationError
    );
  });

  it("rejects unknown fields", () => {
    expect(() =>
      parseResumeEvaluationCreatePayload({
        jobProfileId: "jp-1",
        resumeId: "r-1",
        templateVersionId: "tv-1",
        unknown: "x"
      })
    ).toThrow(ResumeEvaluationValidationError);
  });

  it("rejects non-object body", () => {
    expect(() => parseResumeEvaluationCreatePayload("string")).toThrow(
      ResumeEvaluationValidationError
    );
  });
});

describe("parseResumeEvaluationUpdatePayload", () => {
  it("parses valid payload with only expectedRevision fails as empty", () => {
    expect(() =>
      parseResumeEvaluationUpdatePayload({ expectedRevision: 0 })
    ).toThrow(ResumeEvaluationValidationError);
  });

  it("parses valid payload with criterionResults", () => {
    const result = parseResumeEvaluationUpdatePayload({
      criterionResults: [
        {
          assessment: "SUPPORTED",
          criterionKey: "backend-api",
          evidenceNotes: ["有相关经验"]
        }
      ],
      expectedRevision: 2
    });
    expect(result.expectedRevision).toBe(2);
    expect(result.criterionResults).toHaveLength(1);
    const firstResult = result.criterionResults?.[0];
    expect(firstResult?.criterionKey).toBe("backend-api");
    expect(firstResult?.assessment).toBe("SUPPORTED");
  });

  it("rejects duplicate criterionKey", () => {
    expect(() =>
      parseResumeEvaluationUpdatePayload({
        criterionResults: [
          {
            assessment: "SUPPORTED",
            criterionKey: "same-key",
            evidenceNotes: []
          },
          {
            assessment: "NOT_ASSESSED",
            criterionKey: "same-key",
            evidenceNotes: []
          }
        ],
        expectedRevision: 0
      })
    ).toThrow(ResumeEvaluationValidationError);
  });

  it("rejects invalid assessment value", () => {
    expect(() =>
      parseResumeEvaluationUpdatePayload({
        criterionResults: [
          {
            assessment: "INVALID",
            criterionKey: "backend-api",
            evidenceNotes: []
          }
        ],
        expectedRevision: 0
      })
    ).toThrow(ResumeEvaluationValidationError);
  });

  it("rejects invalid criterionKey slug", () => {
    expect(() =>
      parseResumeEvaluationUpdatePayload({
        criterionResults: [
          {
            assessment: "SUPPORTED",
            criterionKey: "INVALID KEY",
            evidenceNotes: []
          }
        ],
        expectedRevision: 0
      })
    ).toThrow(ResumeEvaluationValidationError);
  });

  it("rejects non-integer expectedRevision", () => {
    expect(() =>
      parseResumeEvaluationUpdatePayload({
        expectedRevision: "not-a-number",
        overallNote: "note"
      })
    ).toThrow(ResumeEvaluationValidationError);
  });
});

describe("parseResumeEvaluationReviewPayload", () => {
  it("parses valid payload", () => {
    const result = parseResumeEvaluationReviewPayload({
      actor: "招聘官 A",
      expectedRevision: 1
    });
    expect(result.expectedRevision).toBe(1);
    expect(result.actor).toBe("招聘官 A");
  });

  it("parses without actor", () => {
    const result = parseResumeEvaluationReviewPayload({ expectedRevision: 0 });
    expect(result.actor == null).toBe(true);
  });

  it("rejects unknown fields", () => {
    expect(() =>
      parseResumeEvaluationReviewPayload({ expectedRevision: 0, x: "y" })
    ).toThrow(ResumeEvaluationValidationError);
  });
});

describe("parseResumeEvaluationReopenPayload", () => {
  it("parses expectedRevision zero with actor and note", () => {
    const result = parseResumeEvaluationReopenPayload({
      actor: "招聘官 B",
      expectedRevision: 0,
      note: "重新开放补充证据"
    });

    expect(result.expectedRevision).toBe(0);
    expect(result.actor).toBe("招聘官 B");
    expect(result.note).toBe("重新开放补充证据");
  });

  it("rejects missing expectedRevision, invalid revision, unknown fields, and empty note", () => {
    expect(() => parseResumeEvaluationReopenPayload({ note: "x" })).toThrow(
      ResumeEvaluationValidationError
    );
    expect(() =>
      parseResumeEvaluationReopenPayload({ expectedRevision: -1, note: "x" })
    ).toThrow(ResumeEvaluationValidationError);
    expect(() =>
      parseResumeEvaluationReopenPayload({ expectedRevision: 1.2, note: "x" })
    ).toThrow(ResumeEvaluationValidationError);
    expect(() =>
      parseResumeEvaluationReopenPayload({ expectedRevision: "1", note: "x" })
    ).toThrow(ResumeEvaluationValidationError);
    expect(() =>
      parseResumeEvaluationReopenPayload({ expectedRevision: 0, note: "x", unknown: true })
    ).toThrow(ResumeEvaluationValidationError);
    expect(() => parseResumeEvaluationReopenPayload({ expectedRevision: 0, note: "" })).toThrow(
      ResumeEvaluationValidationError
    );
  });
});
