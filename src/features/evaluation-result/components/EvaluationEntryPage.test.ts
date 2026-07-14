import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AiEvaluationEntryPanel } from "@/features/evaluation-result/components/EvaluationListPage";
import {
  EvaluationModeGuide,
  QuickScreeningResultPanel,
  QuickScreeningStatusPanel
} from "@/features/evaluation-result/components/NewEvaluationPage";

type ReactElementLike = ReactElement & {
  props: {
    children?: unknown;
    href?: string;
  };
};

describe("formal evaluation entry UI", () => {
  it("shows the two-stage AI evaluation entry on the formal evaluations page", () => {
    const element = AiEvaluationEntryPanel();
    const text = extractText(element);
    const links = collectLinks(element);
    const source = readEvaluationListPageSource();

    expect(text).toContain("正式 AI 评估入口");
    expect(text).toContain("判断候选人是否值得进入详细分析");
    expect(text).toContain("岗位匹配、优势、不足、风险、证据和面试问题");
    expect(source).toContain("Quick Screening 快速初筛");
    expect(source).toContain("Detailed Analysis 详细分析");
    expect(source).toContain("不自动拒绝或录用");
    expect(links).toContain("/feishu/evaluations/new?mode=quick");
    expect(links).toContain("/feishu/evaluations/new?mode=detailed-analysis");
  });

  it("shows mode-specific copy after entering the formal evaluation flow", () => {
    const quickText = extractText(
      EvaluationModeGuide({ mode: "quick" })
    );
    const detailedText = extractText(
      EvaluationModeGuide({ mode: "detailed-analysis" })
    );

    expect(quickText).toContain("快速初筛：判断是否值得进入详细分析");
    expect(quickText).toContain("基础匹配信号");
    expect(detailedText).toContain("详细分析：沉淀岗位匹配证据");
    expect(detailedText).toContain("岗位匹配、优势、不足、风险、证据和面试问题");
    expect(`${quickText}\n${detailedText}`).toContain("不自动推进 Pipeline");
  });

  it("does not promote the local demo page from the formal evaluation entry", () => {
    const listSource = readEvaluationListPageSource();
    const newSource = readFileSync(
      join(
        process.cwd(),
        "src/features/evaluation-result/components/NewEvaluationPage.tsx"
      ),
      "utf8"
    );

    expect(`${listSource}\n${newSource}`).not.toContain("/feishu/demo");
  });

  it("renders quick screening loading, success, error, and timeout states", () => {
    const loadingText = extractText(
      QuickScreeningStatusPanel({
        createdEvaluationId: null,
        error: null,
        isLoading: true,
        onRetry: () => undefined,
        result: null,
        timedOut: false
      })
    );
    const successText = extractText(
      QuickScreeningResultPanel({ result: quickScreeningResult })
    );
    const errorText = extractText(
      QuickScreeningStatusPanel({
        createdEvaluationId: "eval-1",
        error: "快速初筛失败。",
        isLoading: false,
        onRetry: () => undefined,
        result: null,
        timedOut: false
      })
    );
    const timeoutText = extractText(
      QuickScreeningStatusPanel({
        createdEvaluationId: "eval-1",
        error: "快速初筛请求超时。",
        isLoading: false,
        onRetry: () => undefined,
        result: null,
        timedOut: true
      })
    );

    expect(loadingText).toContain("正在运行快速初筛");
    expect(successText).toContain("快速初筛已完成");
    expect(readNewEvaluationPageSource()).toContain("初筛建议");
    expect(readNewEvaluationPageSource()).toContain("规则分数");
    expect(readNewEvaluationPageSource()).toContain("摘要");
    expect(readNewEvaluationPageSource()).toContain("主要理由");
    expect(readNewEvaluationPageSource()).toContain("维度结果");
    expect(readNewEvaluationPageSource()).toContain("风险");
    expect(readNewEvaluationPageSource()).toContain("缺失信息");
    expect(readNewEvaluationPageSource()).toContain("证据");
    expect(readNewEvaluationPageSource()).toContain("面试问题");
    expect(readNewEvaluationPageSource()).toContain("下一步建议");
    expect(readNewEvaluationPageSource()).toContain("quickScreeningRecommendationLabels");
    expect(readNewEvaluationPageSource()).toContain("quickScreeningEvidenceSourceLabels");
    expect(successText).toContain("规则型辅助匹配信号，不是录用概率");
    expect(readNewEvaluationPageSource()).toContain("screeningResult.dimensions");
    expect(readNewEvaluationPageSource()).toContain("screeningResult.missingInformation");
    expect(readNewEvaluationPageSource()).toContain("screeningResult.interviewQuestions");
    expect(errorText).toContain("快速初筛失败");
    expect(errorText).toContain("重试快速初筛");
    expect(timeoutText).toContain("快速初筛超时");
    expect(timeoutText).toContain("重试快速初筛");
  });

  it("keeps quick screening in the formal evaluation flow boundaries", () => {
    const newSource = readNewEvaluationPageSource();

    expect(newSource).toContain("/api/evaluations/");
    expect(newSource).toContain("/quick-screening");
    expect(newSource).not.toContain("/api/feishu");
    expect(newSource).not.toContain("/feishu/demo");
    expect(newSource).not.toContain("autoReject");
    expect(newSource).not.toContain("autoHire");
  });
});

const quickScreeningResult = {
  result: {
    evidence: ["Resume matched backend api keywords."],
    nextStep: "建议补充关键信息后，再由招聘者人工确认是否进入详细分析。",
    reasons: ["Keyword evidence present: Matched backend api."],
    recommendation: "MANUAL_REVIEW" as const,
    risks: ["简历中未找到明确证据：Docker 部署"],
    score: 52,
    summary: "Rule-based quick screening summary."
  },
  screeningResult: {
    dimensions: [
      {
        conclusion: "API 经验存在证据，Docker 部署仍需确认。",
        evidence: [
          {
            id: "ev_1",
            relatedRequirement: "backend api",
            source: "RESUME" as const,
            text: "Resume matched backend api keywords."
          }
        ],
        key: "job_match" as const,
        matchLevel: "medium" as const,
        missingInformation: ["简历中未找到明确证据：Docker 部署"],
        name: "岗位要求匹配",
        risks: ["简历中未找到明确证据：Docker 部署"],
        score: 52
      }
    ],
    educationPass: "unclear" as const,
    evidence: [
      {
        id: "ev_1",
        relatedRequirement: "backend api",
        source: "RESUME" as const,
        text: "Resume matched backend api keywords."
      },
      {
        id: "ev_2",
        relatedRequirement: "Docker 部署",
        source: "MISSING_INFORMATION" as const,
        text: "简历中未找到明确证据：Docker 部署"
      }
    ],
    fullTimeBachelor: "unclear" as const,
    interviewQuestions: ["请说明 API 项目的具体职责。"],
    mainRisk: "简历中未找到明确证据：Docker 部署",
    missingInformation: ["简历中未找到明确证据：Docker 部署"],
    nextStep: "建议补充关键信息后，再由招聘者人工确认是否进入详细分析。",
    notes: null,
    overallScore: 52,
    priority: "B" as const,
    reasons: ["Keyword evidence present: Matched backend api."],
    recommendation: "MANUAL_REVIEW" as const,
    risks: [
      {
        description: "简历中未找到明确证据：Docker 部署",
        severity: "medium" as const,
        title: "Docker 部署"
      }
    ],
    robotArmRelevance: "medium" as const,
    schemaVersion: "m11-a.quick.v1" as const,
    screeningMode: "QUICK" as const,
    shouldEnterDetailedAnalysis: "manual_review" as const,
    strengths: ["Resume matched backend api keywords."],
    summary: "Rule-based quick screening summary."
  },
  run: {
    completedAt: "2026-07-04T13:01:00.000Z",
    createdAt: "2026-07-04T13:00:00.000Z",
    errorCode: null,
    errorMessage: null,
    evaluationId: "eval-1",
    id: "run-1",
    modelName: "0.1.0",
    modelProvider: "RULE_BASED",
    parsedSnapshotId: "snapshot-1",
    promptVersion: null,
    rating: "MANUAL_REVIEW",
    resumeRevisionId: "revision-1",
    runType: "RULE_BASED" as const,
    score: 52,
    status: "SUCCEEDED" as const,
    summary: "Rule-based quick screening summary."
  }
};

function readEvaluationListPageSource(): string {
  return readFileSync(
    join(
      process.cwd(),
      "src/features/evaluation-result/components/EvaluationListPage.tsx"
    ),
    "utf8"
  );
}

function readNewEvaluationPageSource(): string {
  return readFileSync(
    join(
      process.cwd(),
      "src/features/evaluation-result/components/NewEvaluationPage.tsx"
    ),
    "utf8"
  );
}

function collectLinks(node: unknown): string[] {
  if (!isReactElementLike(node)) {
    return [];
  }

  const currentHref = typeof node.props.href === "string" ? [node.props.href] : [];

  return [
    ...currentHref,
    ...flattenChildren(node.props.children).flatMap(collectLinks)
  ];
}

function extractText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (!isReactElementLike(node)) {
    return "";
  }

  return flattenChildren(node.props.children).map(extractText).join("");
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
