import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildInterviewQuestionLines,
  buildDailyInternshipLogText,
  buildFeishuEvaluationText,
  buildRiskLines,
  buildStrengthLines,
  buildWeaknessLines,
  resolveEvaluationSummary,
  type DailyInternshipLogState
} from "@/features/feishu-demo/components/FeishuDemoWorkspacePage";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

describe("Feishu demo workspace helpers", () => {
  it("builds a Feishu-ready evaluation text block with human review guardrails", () => {
    const text = buildFeishuEvaluationText({
      candidateName: "Lin Chen",
      jobTitle: "Backend Intern",
      metadata: {
        model: "gpt-5.5-demo",
        providerName: "OPENAI_COMPATIBLE"
      },
      runId: "run-demo-1",
      output: sampleEvaluationOutput
    });

    expect(text).toContain("候选人：Lin Chen");
    expect(text).toContain("岗位：Backend Intern");
    expect(text).toContain("Provider：OPENAI_COMPATIBLE");
    expect(text).toContain("Model：gpt-5.5-demo");
    expect(text).toContain("Run ID：run-demo-1");
    expect(text).toContain("评估结论：POTENTIAL_FIT");
    expect(text).toContain("分数：72");
    expect(text).toContain("总结：");
    expect(text).toContain("风险：");
    expect(text).toContain("亮点：");
    expect(text).toContain("不足：");
    expect(text).toContain("证据：");
    expect(text).toContain("维度评分：");
    expect(text).toContain("电话筛选问题：");
    expect(text).toContain("面试问题：");
    expect(text).toContain("RESUME / HIGH: Built REST APIs with Node.js and PostgreSQL.");
    expect(text).toContain("下一步建议：");
    expect(text).toContain(
      "本结果为 AI/规则辅助草稿，需招聘者人工确认，不代表自动录用/拒绝。"
    );
    expect(text).not.toContain("No evaluation summary provided.");
  });

  it("uses useful summary fields before the manual summary fallback", () => {
    expect(resolveEvaluationSummary(sampleEvaluationOutput)).toBe(
      sampleEvaluationOutput.overallSummary
    );

    const outputWithLegacySummary = {
      ...sampleEvaluationOutput,
      overallSummary: "No evaluation summary provided.",
      summary: "Legacy summary from provider output."
    } as ResumeEvaluationResult;
    const outputWithMetadataSummary = {
      ...sampleEvaluationOutput,
      overallSummary: "",
      metadata: {
        summary: "Metadata summary from provider output."
      }
    } as ResumeEvaluationResult;
    const outputWithoutSummary = {
      ...sampleEvaluationOutput,
      overallSummary: "No evaluation summary provided."
    };

    expect(resolveEvaluationSummary(outputWithLegacySummary)).toBe(
      "Legacy summary from provider output."
    );
    expect(resolveEvaluationSummary(outputWithMetadataSummary)).toBe(
      "Metadata summary from provider output."
    );
    expect(resolveEvaluationSummary(outputWithoutSummary)).toBe(
      "暂无足够摘要，请招聘者结合简历和 JD 人工补充。"
    );
  });

  it("fills readable fallback lines when strengths, risks, or weaknesses are empty", () => {
    const output = {
      ...sampleEvaluationOutput,
      risks: [],
      strengths: [],
      weaknesses: []
    };

    expect(buildStrengthLines(output)).toEqual([
      "简历中存在与岗位相关的初步匹配信号，需人工复核。"
    ]);
    expect(buildRiskLines(output)).toEqual([
      "当前评估证据不足，需进一步确认候选人与岗位要求的匹配度。"
    ]);
    expect(buildWeaknessLines(output)).toEqual([
      "暂无明确弱点记录，建议电话筛选时补充确认。"
    ]);

    const text = buildFeishuEvaluationText({
      candidateName: "",
      jobTitle: "",
      output
    });

    expect(text).not.toContain("亮点：\n- 暂无");
    expect(text).not.toContain("风险：\n- 暂无");
    expect(text).not.toContain("不足：\n- 暂无\n");
  });

  it("uses a manual strength fallback when no match evidence exists", () => {
    const output = {
      ...sampleEvaluationOutput,
      dimensionScores: [],
      evidence: [],
      strengths: []
    };

    expect(buildStrengthLines(output)).toEqual([
      "暂无明确亮点，需人工补充判断。"
    ]);
  });

  it("adds general HR phone screen questions when questions are too sparse", () => {
    const questions = buildInterviewQuestionLines(sampleEvaluationOutput);

    expect(questions).toContain(
      "请简单介绍你最近一段与该岗位最相关的经历。"
    );
    expect(questions).toContain("你对这个岗位的核心工作内容理解是什么？");
    expect(questions).toContain(
      "你目前的到岗时间、实习周期和每周可出勤天数是怎样的？"
    );
  });

  it("builds a daily internship log text block", () => {
    const log: DailyInternshipLogState = {
      contactedCount: "5",
      interviewCount: "2",
      issues: "候选人联系方式缺失，需要补录。",
      resumesReviewed: "18",
      tomorrowTodos: "继续筛选后端实习候选人。"
    };

    const text = buildDailyInternshipLogText(log);

    expect(text).toContain("今日查看简历数：18");
    expect(text).toContain("联系人数：5");
    expect(text).toContain("约面人数：2");
    expect(text).toContain("候选人联系方式缺失，需要补录。");
    expect(text).toContain("继续筛选后端实习候选人。");
  });

  it("keeps the demo page within local UI boundaries", () => {
    const componentSource = readFileSync(
      join(
        process.cwd(),
        "src/features/feishu-demo/components/FeishuDemoWorkspacePage.tsx"
      ),
      "utf8"
    );
    const pageSource = readFileSync(
      join(process.cwd(), "src/app/feishu/demo/page.tsx"),
      "utf8"
    );
    const source = `${componentSource}\n${pageSource}`;

    expect(source).toContain("/api/evaluation-demo");
    expect(source).not.toContain("/api/feishu");
    expect(source).not.toContain("FEISHU_TOKEN");
    expect(source).not.toContain("AI_API_KEY");
    expect(source).not.toContain("prisma");
    expect(source).not.toContain("pipeline");
    expect(source).not.toContain("autoReject");
    expect(source).not.toContain("autoHire");
  });
});

const sampleEvaluationOutput: ResumeEvaluationResult = {
  confidence: "MEDIUM",
  dimensionScores: [
    {
      evidenceIds: ["evidence-1"],
      key: "backend",
      label: "Backend Experience",
      rationale: "Has internship project experience with API development.",
      score: 76
    }
  ],
  evidence: [
    {
      id: "evidence-1",
      relevance: "HIGH",
      source: "RESUME",
      text: "Built REST APIs with Node.js and PostgreSQL."
    }
  ],
  interviewQuestions: [
    {
      category: "TECHNICAL",
      evidenceIds: ["evidence-1"],
      purpose: "Confirm API design depth.",
      question: "Please describe one API you designed and how you tested it."
    }
  ],
  notes: null,
  overallScore: 72,
  overallSummary:
    "Rule-based signal suggests a possible fit, pending recruiter review.",
  recommendation: "POTENTIAL_FIT",
  risks: [
    {
      description: "Production experience is not clearly evidenced.",
      evidenceIds: ["evidence-1"],
      severity: "MEDIUM",
      type: "MISSING_REQUIREMENT"
    }
  ],
  schemaVersion: "m07-b3-a.v1",
  strengths: [
    {
      description: "Shows API and database project experience.",
      evidenceIds: ["evidence-1"],
      title: "Backend project foundation"
    }
  ],
  weaknesses: [
    {
      description: "Needs more detail on production ownership.",
      evidenceIds: ["evidence-1"],
      severity: "LOW",
      title: "Ownership evidence"
    }
  ]
};
