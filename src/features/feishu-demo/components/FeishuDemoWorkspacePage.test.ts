import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDailyInternshipLogText,
  buildFeishuEvaluationText,
  type DailyInternshipLogState
} from "@/features/feishu-demo/components/FeishuDemoWorkspacePage";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

describe("Feishu demo workspace helpers", () => {
  it("builds a Feishu-ready evaluation text block with human review guardrails", () => {
    const text = buildFeishuEvaluationText({
      candidateName: "Lin Chen",
      jobTitle: "Backend Intern",
      output: sampleEvaluationOutput
    });

    expect(text).toContain("候选人：Lin Chen");
    expect(text).toContain("岗位：Backend Intern");
    expect(text).toContain("评估结论：POTENTIAL_FIT");
    expect(text).toContain("分数：72");
    expect(text).toContain("风险点：");
    expect(text).toContain("亮点：");
    expect(text).toContain("电话筛选问题：");
    expect(text).toContain("下一步建议：");
    expect(text).toContain(
      "本结果为 AI/规则辅助草稿，需招聘者人工确认，不代表自动录用/拒绝。"
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
