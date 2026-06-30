import { describe, expect, it } from "vitest";
import { JsonParserError, parseJsonOutput } from "@/ai/parser/jsonParser";

describe("AI JSON parser", () => {
  it("valid JSON is parsed correctly", () => {
    expect(parseJsonOutput('{"summary":"ok","score":90}')).toEqual({
      score: 90,
      summary: "ok"
    });
  });

  it("invalid JSON is rejected", () => {
    expect(() => parseJsonOutput("{summary:ok}")).toThrow(JsonParserError);
  });
});
