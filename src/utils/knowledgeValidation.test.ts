import { describe, expect, it } from "vitest";
import {
  KnowledgeValidationError,
  parseKnowledgeCreatePayload
} from "@/utils/knowledgeValidation";

describe("knowledge validation", () => {
  it("valid knowledge input passes", () => {
    expect(
      parseKnowledgeCreatePayload({
        content: "Send a follow-up message within 24 hours.",
        source: "USER",
        tags: ["interview", "follow-up"],
        title: "Interview follow-up template",
        type: "TEMPLATE"
      })
    ).toEqual({
      content: "Send a follow-up message within 24 hours.",
      source: "USER",
      tags: ["interview", "follow-up"],
      title: "Interview follow-up template",
      type: "TEMPLATE"
    });
  });

  it("invalid knowledge type is rejected", () => {
    expect(() =>
      parseKnowledgeCreatePayload({
        content: "Content",
        source: "USER",
        tags: [],
        title: "Bad type",
        type: "INVALID"
      })
    ).toThrow(KnowledgeValidationError);
  });
});
