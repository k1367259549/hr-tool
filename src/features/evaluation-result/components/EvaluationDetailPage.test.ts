import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import {
  deriveDetailedAnalysisState,
  DetailedAnalysisResultPanel,
  DetailedAnalysisWorkspace
} from "@/features/evaluation-result/components/EvaluationDetailPage";
import { adaptDetailedScreeningResultToLegacyEvaluationResult } from "@/lib/resume-screening/detailed-screening-contract";
import type {
  DetailedAnalysisRunDto,
  ResumeEvaluationRunDto
} from "@/types/resumeEvaluationRun";
import type { DetailedScreeningResult } from "@/types/resume-screening";

type ReactElementLike = ReactElement & {
  props: {
    children?: unknown;
    href?: string;
  };
};

describe("formal detailed analysis UI", () => {
  it("derives detailed analysis start readiness from quick screening run history", () => {
    expect(deriveDetailedAnalysisState([])).toMatchObject({
      canStartDetailedAnalysis: false,
      startDisabledReason: "缺少快速初筛结果，请先完成 Quick Screening。"
    });

    expect(
      deriveDetailedAnalysisState([
        makeRun({
          id: "quick-pending",
          runType: "RULE_BASED",
          status: "PENDING"
        })
      ])
    ).toMatchObject({
      canStartDetailedAnalysis: false,
      startDisabledReason: "快速初筛仍在运行，请完成后再启动详细分析。"
    });

    expect(
      deriveDetailedAnalysisState([
        makeRun({
          rating: "NOT_ENOUGH_EVIDENCE",
          runType: "RULE_BASED"
        })
      ])
    ).toMatchObject({
      canStartDetailedAnalysis: false,
      startDisabledReason:
        "当前快速初筛建议不允许进入详细分析，请补充信息或重新初筛后再试。"
    });

    expect(
      deriveDetailedAnalysisState([
        makeRun({
          runType: "AI",
          status: "PENDING"
        }),
        makeRun({
          rating: "MANUAL_REVIEW",
          runType: "RULE_BASED"
        })
      ])
    ).toMatchObject({
      canStartDetailedAnalysis: false,
      startDisabledReason: "当前已有详细分析正在运行，请等待完成后再重试。"
    });

    expect(
      deriveDetailedAnalysisState([
        makeRun({
          rating: "MANUAL_REVIEW",
          runType: "RULE_BASED"
        })
      ])
    ).toMatchObject({
      canStartDetailedAnalysis: true,
      startDisabledReason: null
    });
  });

  it("renders canonical detailed analysis result fields", () => {
    const text = extractText(
      DetailedAnalysisResultPanel({
        analysis: createDetailedAnalysisRunDto()
      })
    );

    expect(text).toContain("详细分析已完成");
    expect(text).toContain("需要人工复核");
    expect(text).toContain("86/100");
    expect(text).toContain("该分数是岗位匹配辅助信号，不代表录用概率");
    expect(text).toContain("总结");
    expect(text).toContain("维度分析");
    expect(text).toContain("优势");
    expect(text).toContain("不足");
    expect(text).toContain("风险");
    expect(text).toContain("待确认信息");
    expect(text).toContain("简历证据");
    expect(text).toContain("缺失信息");
    expect(text).toContain("面试问题");
    expect(text).toContain("下一步人工确认建议");
    expect(text).not.toContain("rawProviderResponse");
  });

  it("renders quick prerequisite, detailed result, and history states in the workspace", () => {
    const text = extractText(
      DetailedAnalysisWorkspace({
        error: "模型结果格式异常，请重新运行详细分析。",
        isLoading: false,
        isRunning: false,
        latestDetailedAnalysis: createDetailedAnalysisRunDto(),
        onReload: () => undefined,
        onStart: () => undefined,
        runHistory: [
          makeRun({
            id: "detailed-failed",
            errorMessage: "Provider timeout.",
            runType: "AI",
            status: "FAILED"
          }),
          makeRun({
            rating: "MANUAL_REVIEW",
            runType: "RULE_BASED"
          })
        ],
        timedOut: false
      })
    );

    expect(text).toContain("详细分析执行区");
    expect(text).toContain("重新运行详细分析");
    expect(text).toContain("最新快速初筛");
    expect(text).toContain("需要人工复核");
    expect(text).toContain("详细分析失败");
    expect(text).toContain("模型结果格式异常，请重新运行详细分析。");
    expect(text).toContain("Run 历史");
    expect(text).toContain("Detailed Analysis · 失败");
    expect(text).toContain("Provider timeout.");
  });
});

function makeRun(overrides: Partial<ResumeEvaluationRunDto> = {}): ResumeEvaluationRunDto {
  return {
    completedAt: "2026-07-04T13:01:00.000Z",
    createdAt: "2026-07-04T13:00:00.000Z",
    errorCode: null,
    errorMessage: null,
    evaluationId: "eval-1",
    id: "run-1",
    modelName: "gpt-5.5",
    modelProvider: "OPENAI_COMPATIBLE",
    parsedSnapshotId: "snapshot-1",
    promptVersion: "1.0",
    rating: "PROCEED_TO_NEXT_STEP",
    resumeRevisionId: "revision-1",
    runType: "AI",
    score: 86,
    status: "SUCCEEDED",
    summary: "Run summary.",
    ...overrides
  };
}

function createDetailedAnalysisRunDto(): DetailedAnalysisRunDto {
  const screeningResult = createDetailedScreeningResult();

  return {
    completedAt: "2026-07-04T13:02:00.000Z",
    createdAt: "2026-07-04T13:01:00.000Z",
    evaluationId: "eval-1",
    metadata: {
      completedAt: "2026-07-04T13:02:00.000Z",
      durationMs: 60_000,
      model: "gpt-5.5",
      promptFile: "prompts/detailed-analysis.md",
      promptVersion: "1.0",
      providerName: "OPENAI_COMPATIBLE",
      providerVersion: "openai-compatible-test-v1",
      startedAt: "2026-07-04T13:01:00.000Z"
    },
    mode: "DETAILED",
    model: "gpt-5.5",
    provider: "OPENAI_COMPATIBLE",
    result: adaptDetailedScreeningResultToLegacyEvaluationResult(screeningResult),
    run: makeRun({
      id: "detailed-run-1",
      rating: screeningResult.recommendation,
      runType: "AI",
      score: screeningResult.overallScore,
      summary: screeningResult.summary
    }),
    runId: "detailed-run-1",
    screeningResult,
    status: "SUCCEEDED",
    success: true
  };
}

function createDetailedScreeningResult(): DetailedScreeningResult {
  return {
    dimensions: [
      {
        conclusion:
          "The resume explicitly names TypeScript API service work that maps to the backend JD.",
        evidence: [
          {
            id: "ev_backend_api",
            relatedRequirement: "Backend API experience",
            source: "RESUME",
            text: "Built TypeScript API services for recruiting workflows."
          }
        ],
        key: "job_match",
        matchLevel: "high",
        missingInformation: ["Weekly attendance is not visible."],
        name: "JD Match",
        risks: ["Ownership depth needs interview confirmation."],
        score: 86
      }
    ],
    evidence: [
      {
        id: "ev_backend_api",
        relatedRequirement: "Backend API experience",
        source: "RESUME",
        text: "Built TypeScript API services for recruiting workflows."
      },
      {
        id: "ev_missing_availability",
        relatedRequirement: "Internship availability",
        source: "MISSING_INFORMATION",
        text: "Availability and weekly attendance are not visible in the resume."
      }
    ],
    interviewQuestions: [
      "Please walk through the API project and your direct responsibilities.",
      "What is your availability and weekly attendance?"
    ],
    missingInformation: ["Availability and weekly attendance are not visible."],
    nextStep: "Recruiter should manually confirm ownership depth and availability.",
    notes: null,
    overallScore: 86,
    recommendation: "MANUAL_REVIEW",
    risks: [
      {
        description: "Availability is missing and must be confirmed before proceeding.",
        severity: "medium",
        title: "Availability missing"
      }
    ],
    schemaVersion: "m11-a.detailed.v1",
    screeningMode: "DETAILED",
    strengths: ["Backend TypeScript API experience maps to the JD."],
    summary:
      "The candidate has relevant backend TypeScript API evidence for the role, while availability and ownership depth still need recruiter confirmation.",
    weaknesses: ["Availability and exact ownership depth are not explicit."]
  };
}

function extractText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (!isReactElementLike(node)) {
    return "";
  }

  return extractText(resolveNode(node));
}

function flattenChildren(children: unknown): unknown[] {
  if (children === undefined || children === null || typeof children === "boolean") {
    return [];
  }

  return Array.isArray(children) ? children : [children];
}

function isReactElementLike(value: unknown): value is ReactElementLike {
  return typeof value === "object" && value !== null && "props" in value;
}

function resolveNode(node: ReactElementLike): unknown {
  if (typeof node.type === "function") {
    return (node.type as (props: Record<string, unknown>) => unknown)(node.props);
  }

  return flattenChildren(node.props.children).map(extractText).join("");
}
