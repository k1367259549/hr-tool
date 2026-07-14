import { describe, expect, it } from "vitest";
import { bindEvaluationRunOutput } from "@/lib/evaluation/output-binding";
import {
  adaptQuickScreeningResultToLegacyEvaluationResult,
  createRuleBasedQuickScreeningResult,
  RULE_BASED_QUICK_SCREENING_WEIGHTS
} from "@/lib/resume-screening/rule-based-quick-screening-engine";
import { QuickScreeningResultSchema } from "@/lib/resume-screening/schema";
import type { EvaluationProviderInput } from "@/lib/evaluation/provider-interface";

describe("rule-based quick screening engine", () => {
  it("generates a legal result for Chinese resume and JD input", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        candidateName: "候选人A",
        jobDescription:
          "岗位：后端实习生\n要求：TypeScript API 开发\n要求：PostgreSQL 数据库设计\n要求：Docker 部署经验",
        jobTitle: "后端实习生",
        resumeText:
          "项目经历：负责 TypeScript API 开发，参与 PostgreSQL 数据库设计，并具备 Docker 部署经验。教育经历：本科。"
      })
    );

    expect(QuickScreeningResultSchema.safeParse(result).success).toBe(true);
    expect(result.screeningMode).toBe("QUICK");
    expect(result.recommendation).toBe("PROCEED_TO_NEXT_STEP");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.recommendation).not.toBe("DO_NOT_PROCEED");
  });

  it("generates a legal result for English input", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription:
          "Need backend API experience. Need PostgreSQL database work. Need Docker deployment.",
        jobTitle: "Backend Intern",
        resumeText:
          "Project experience: built backend API services with PostgreSQL and Docker for workflow tools. Education: Bachelor."
      })
    );

    expect(QuickScreeningResultSchema.safeParse(result).success).toBe(true);
    expect(result.screeningMode).toBe("QUICK");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("is deterministic for the same input", () => {
    const input = createInput({
      jobDescription:
        "TypeScript API development\nPostgreSQL database design\nDocker deployment",
      resumeText:
        "Built TypeScript API services and PostgreSQL database tables. Used Docker locally."
    });

    expect(createRuleBasedQuickScreeningResult(input)).toEqual(
      createRuleBasedQuickScreeningResult(input)
    );
  });

  it("keeps weight totals and all scores in the 0-100 integer range", () => {
    const weightTotal = Object.values(RULE_BASED_QUICK_SCREENING_WEIGHTS).reduce(
      (sum, value) => sum + value,
      0
    );
    const result = createRuleBasedQuickScreeningResult(createInput());

    expect(weightTotal).toBe(100);
    expect(Number.isInteger(result.overallScore)).toBe(true);
    expect(Number.isFinite(result.overallScore)).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    for (const dimension of result.dimensions) {
      expect(Number.isInteger(dimension.score)).toBe(true);
      expect(Number.isFinite(dimension.score)).toBe(true);
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(100);
    }
  });

  it("creates traceable strengths and evidence for strong matches", () => {
    const input = createInput({
      jobDescription:
        "TypeScript API development\nPostgreSQL database work\nDocker deployment",
      resumeText:
        "Project: TypeScript API development for recruiting workflow. PostgreSQL database work and Docker deployment were part of the project."
    });
    const result = createRuleBasedQuickScreeningResult(input);

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(
      result.evidence.every(
        (item) =>
          item.relatedRequirement === null ||
          normalizeForTest(input.jobDescription).includes(
            normalizeForTest(item.relatedRequirement)
          )
      )
    ).toBe(true);
    expect(JSON.stringify(result)).not.toContain("Google");
    expect(JSON.stringify(result)).not.toContain("985");
  });

  it("uses MANUAL_REVIEW for partial matching evidence", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription:
          "TypeScript API development\nPostgreSQL database work\nDocker deployment",
        resumeText:
          "Used TypeScript API examples and PostgreSQL database exercises in coursework."
      })
    );

    expect(result.recommendation).toBe("MANUAL_REVIEW");
    expect(result.shouldEnterDetailedAnalysis).toBe("manual_review");
    expect(result.recommendation).not.toBe("DO_NOT_PROCEED");
  });

  it("uses NOT_ENOUGH_EVIDENCE for missing or too-short information", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription: "",
        resumeText: ""
      })
    );

    expect(result.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
    expect(result.overallScore).toBeLessThan(35);
    expect(result.strengths).toEqual([]);
    expect(result.missingInformation.length).toBeGreaterThan(0);
    expect(result.recommendation).not.toBe("DO_NOT_PROCEED");
  });

  it("puts unmatched requirements into missingInformation without claiming ability absence", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription: "Need API design\nNeed database migration\nNeed testing automation",
        resumeText: "Resume only mentions campus operations and Excel reporting."
      })
    );

    expect(result.recommendation).toBe("NOT_ENOUGH_EVIDENCE");
    expect(result.missingInformation.some((item) => item.includes("简历中未找到明确证据"))).toBe(true);
    expect(JSON.stringify(result.missingInformation)).not.toContain("不具备");
  });

  it("deduplicates repeated JD requirements", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription: "TypeScript API development\nTypeScript API development\nDocker deployment",
        resumeText: "Built TypeScript API development work with Docker deployment."
      })
    );
    const relatedRequirements = result.evidence
      .map((item) => item.relatedRequirement)
      .filter((item): item is string => item !== null);

    expect(new Set(relatedRequirements).size).toBe(relatedRequirements.length);
  });

  it("handles mixed Chinese and English input", () => {
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription: "负责 TypeScript API 开发；熟悉 PostgreSQL；能够说明项目 ownership",
        resumeText: "项目经历：TypeScript API 开发，PostgreSQL 表设计，负责接口调试和文档维护。"
      })
    );

    expect(QuickScreeningResultSchema.safeParse(result).success).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("limits output size for very long input", () => {
    const repeatedRequirements = Array.from({ length: 80 }, (_, index) =>
      `Requirement ${index}: TypeScript API work`
    ).join("\n");
    const repeatedResume = Array.from({ length: 200 }, () =>
      "Built TypeScript API work for internal workflow tools."
    ).join(" ");
    const result = createRuleBasedQuickScreeningResult(
      createInput({
        jobDescription: repeatedRequirements,
        resumeText: repeatedResume
      })
    );

    expect(result.evidence.length).toBeLessThanOrEqual(12);
    expect(result.dimensions.length).toBeLessThanOrEqual(4);
    expect(result.interviewQuestions.length).toBeLessThanOrEqual(6);
  });

  it("adapts to the legacy ResumeEvaluationResult only by field mapping", () => {
    const quickResult = createRuleBasedQuickScreeningResult(createInput());
    const legacy = adaptQuickScreeningResultToLegacyEvaluationResult(quickResult);
    const bound = bindEvaluationRunOutput(legacy);

    expect(bound.success).toBe(true);
    expect(legacy.overallScore).toBe(quickResult.overallScore);
    expect(legacy.overallSummary).toContain(quickResult.summary);
    expect(legacy.dimensionScores[0]?.key).toBe("keyword-match");
    expect(legacy.notes).toContain("adapter output");
  });
});

function createInput(
  overrides: Partial<EvaluationProviderInput> = {}
): EvaluationProviderInput {
  return {
    candidateName: "Candidate A",
    jobDescription:
      "Need TypeScript API development. Need PostgreSQL database work. Need Docker deployment.",
    jobTitle: "Backend Intern",
    resumeText:
      "Project experience: built TypeScript API development and PostgreSQL database work with Docker deployment.",
    runId: "run-1",
    ...overrides
  };
}

function normalizeForTest(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}
