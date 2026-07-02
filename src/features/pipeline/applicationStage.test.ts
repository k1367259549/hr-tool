import { describe, expect, it } from "vitest";
import {
  applicationStageLabels,
  getNextApplicationStages,
  terminalApplicationStages
} from "@/features/pipeline/applicationStage";

describe("applicationStage UI helpers", () => {
  it("exposes readable stage labels", () => {
    expect(applicationStageLabels.NEW).toBe("New");
    expect(applicationStageLabels.RESUME_SCREEN).toBe("Resume Screen");
  });

  it("returns allowed transition options", () => {
    expect(getNextApplicationStages("PHONE_SCREEN")).toEqual([
      "RESUME_SCREEN",
      "INTERVIEW",
      "REJECTED",
      "WITHDRAWN"
    ]);
  });

  it("marks terminal stages as disabled", () => {
    expect(terminalApplicationStages.has("HIRED")).toBe(true);
    expect(getNextApplicationStages("HIRED")).toEqual([]);
  });
});
