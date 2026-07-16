import { describe, expect, it } from "vitest";
import { promptRegistry } from "@/ai/prompts/promptRegistry";

describe("detailed analysis prompt registry", () => {
  it("loads the V2 criterion-aware detailed analysis prompt", async () => {
    const prompt = await promptRegistry.getPrompt("detailed-analysis.md");

    expect(prompt).toMatchObject({
      path: "prompts/detailed-analysis.md",
      version: "2.0"
    });
    expect(prompt.template).toContain('contractVersion must be detailed-screening.v2');
    expect(prompt.template).toContain("screeningMode must be DETAILED");
    expect(prompt.template).toContain("criterionAssessments");
    expect(prompt.template).toContain("character-for-character");
    expect(prompt.template).toContain("same order");
    expect(prompt.template).toContain("Do not invent companies");
    expect(prompt.template).toContain("missingInformation must not be written");
    expect(prompt.template).toContain("Do not rank candidates");
    expect(prompt.template).toContain("Do not automatically hire");
  });
});
