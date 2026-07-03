import { describe, expect, it } from "vitest";
import {
  parseAssignmentPayload,
  parseDraftVersionUpdatePayload,
  parseEvaluationTemplateCreatePayload,
  parseEvaluationTemplateListQuery,
  parseEvaluationTemplateUpdatePayload
} from "@/utils/evaluationTemplateValidation";

describe("evaluationTemplateValidation", () => {
  it("parses create and metadata patch payloads", () => {
    expect(
      parseEvaluationTemplateCreatePayload({
        description: "后端岗位标准",
        name: "Backend Evaluation"
      })
    ).toEqual({
      description: "后端岗位标准",
      name: "Backend Evaluation"
    });

    expect(
      parseEvaluationTemplateUpdatePayload({
        description: null,
        name: "Backend Evaluation V2"
      })
    ).toEqual({
      description: null,
      name: "Backend Evaluation V2"
    });
  });

  it("accepts empty criteria and structured criteria while preserving order", () => {
    expect(
      parseDraftVersionUpdatePayload({
        criteria: []
      })
    ).toEqual({
      changeNote: undefined,
      createdBy: undefined,
      criteria: [],
      instructions: undefined
    });

    const parsed = parseDraftVersionUpdatePayload({
      criteria: [
        {
          description: "能解释服务边界。",
          evidenceGuidance: "引用项目经验。",
          importance: "REQUIRED",
          key: "service-layer",
          label: "Service Layer"
        },
        {
          description: "能维护测试。",
          importance: "PREFERRED",
          key: "test-maintenance",
          label: "Test Maintenance"
        }
      ],
      instructions: "人工查看证据。"
    });

    expect(parsed.criteria?.map((criterion) => criterion.key)).toEqual([
      "service-layer",
      "test-maintenance"
    ]);
  });

  it("rejects duplicate keys, unknown fields, and scoring fields", () => {
    expect(() =>
      parseDraftVersionUpdatePayload({
        criteria: [
          {
            description: "A",
            importance: "REQUIRED",
            key: "same-key",
            label: "A"
          },
          {
            description: "B",
            importance: "PREFERRED",
            key: "same-key",
            label: "B"
          }
        ]
      })
    ).toThrow(/重复/);

    expect(() =>
      parseDraftVersionUpdatePayload({
        criteria: [
          {
            description: "A",
            importance: "REQUIRED",
            key: "valid-key",
            label: "A",
            weight: 10
          }
        ]
      })
    ).toThrow(/评分、权重、阈值/);

    expect(() =>
      parseDraftVersionUpdatePayload({
        criteria: [
          {
            description: "A",
            importance: "REQUIRED",
            key: "valid-key",
            label: "A",
            randomField: true
          }
        ]
      })
    ).toThrow(/不支持/);
  });

  it("validates list query, assignment payload, and empty patch", () => {
    expect(
      parseEvaluationTemplateListQuery(
        new URLSearchParams("search=backend&status=ACTIVE&page=2&pageSize=10")
      )
    ).toEqual({
      page: 2,
      pageSize: 10,
      search: "backend",
      status: "ACTIVE"
    });

    expect(parseAssignmentPayload({ assignedBy: "recruiter", templateVersionId: "version-id" })).toEqual({
      assignedBy: "recruiter",
      templateVersionId: "version-id"
    });

    expect(() => parseEvaluationTemplateUpdatePayload({})).toThrow(/不能为空/);
    expect(() => parseEvaluationTemplateListQuery(new URLSearchParams("unknown=1"))).toThrow(
      /不支持/
    );
  });
});
