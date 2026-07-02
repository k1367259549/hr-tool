import { describe, expect, it } from "vitest";
import { JsonParserError, parseJsonOutput } from "@/ai/parser/jsonParser";

describe("AI JSON parser", () => {
  it("valid JSON is parsed correctly", () => {
    expect(parseJsonOutput('{"summary":"ok","score":90}')).toEqual({
      score: 90,
      summary: "ok"
    });
  });

  it("common fenced JSON output is normalized", () => {
    expect(parseJsonOutput('```json\n{"summary":"ok"}\n```')).toEqual({
      summary: "ok"
    });
  });

  it("JSON object wrapped with incidental text is normalized", () => {
    expect(parseJsonOutput('Here is the JSON:\n{"summary":"ok"}')).toEqual({
      summary: "ok"
    });
  });

  it("invalid JSON is rejected", () => {
    expect(() => parseJsonOutput("{summary:ok}")).toThrow(JsonParserError);
  });
});
