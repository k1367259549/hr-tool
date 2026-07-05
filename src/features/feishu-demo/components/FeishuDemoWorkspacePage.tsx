"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormField } from "@/components/shared/FormField";
import { SectionCard } from "@/components/shared/SectionCard";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";

type EvaluationDemoApiResponse =
  | {
      success: true;
      runId: string;
      output: ResumeEvaluationResult;
      metadata: EvaluationDemoMetadata;
      auditEventCount: number;
    }
  | {
      success: false;
      runId?: string;
      failureReason?: string;
      error: string;
      metadata: EvaluationDemoMetadata;
    };

type EvaluationDemoMetadata = {
  runtimeConfig: Record<string, unknown>;
  providerName?: string;
  providerVersion?: string;
  model?: string;
  durationMs?: number;
};

export type FeishuDemoFormState = {
  candidateName: string;
  jobTitle: string;
  resumeText: string;
  jobDescription: string;
};

export type DailyInternshipLogState = {
  resumesReviewed: string;
  contactedCount: string;
  interviewCount: string;
  issues: string;
  tomorrowTodos: string;
};

const initialFormState: FeishuDemoFormState = {
  candidateName: "",
  jobTitle: "",
  resumeText: "",
  jobDescription: ""
};

const initialDailyLogState: DailyInternshipLogState = {
  resumesReviewed: "0",
  contactedCount: "0",
  interviewCount: "0",
  issues: "",
  tomorrowTodos: ""
};

export function FeishuDemoWorkspacePage(): JSX.Element {
  const [form, setForm] = useState<FeishuDemoFormState>(initialFormState);
  const [dailyLog, setDailyLog] = useState<DailyInternshipLogState>(
    initialDailyLogState
  );
  const [result, setResult] = useState<EvaluationDemoApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const feishuText = useMemo(() => {
    return result?.success
      ? buildFeishuEvaluationText({
          candidateName: form.candidateName,
          jobTitle: form.jobTitle,
          output: result.output
        })
      : "";
  }, [form.candidateName, form.jobTitle, result]);
  const dailyText = useMemo(
    () => buildDailyInternshipLogText(dailyLog),
    [dailyLog]
  );

  async function submitEvaluation(): Promise<void> {
    setError(null);
    setCopyMessage(null);

    if (!form.resumeText.trim() || !form.jobDescription.trim()) {
      setResult(null);
      setError("请填写简历文本和 JD 文本。");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/evaluation-demo", {
        body: JSON.stringify({
          candidateName: form.candidateName || undefined,
          jobDescription: form.jobDescription,
          jobTitle: form.jobTitle || undefined,
          resumeText: form.resumeText
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as EvaluationDemoApiResponse;

      setResult(payload);

      if (!payload.success) {
        setError(payload.error);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "评估 Demo 调用失败。"
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyText(text: string, label: string): Promise<void> {
    if (!text.trim()) {
      setCopyMessage("暂无可复制内容。");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} 已复制。`);
    } catch {
      setCopyMessage("复制失败，请手动选择文本复制。");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feishu Evaluation Demo"
        description="本地演示页：输入 JD 与简历，生成可复制到飞书的评估草稿和实习日报。"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(320px,480px)_1fr]">
        <SectionCard title="输入区" description="候选人与岗位信息仅用于本次本地 Demo 请求。">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <TextInput
                id="candidate-name"
                label="候选人"
                value={form.candidateName}
                onChange={(value) => setForm((current) => ({ ...current, candidateName: value }))}
              />
              <TextInput
                id="job-title"
                label="岗位"
                value={form.jobTitle}
                onChange={(value) => setForm((current) => ({ ...current, jobTitle: value }))}
              />
            </div>
            <TextAreaInput
              id="resume-text"
              label="简历文本"
              rows={10}
              value={form.resumeText}
              onChange={(value) => setForm((current) => ({ ...current, resumeText: value }))}
            />
            <TextAreaInput
              id="job-description"
              label="JD 文本"
              rows={10}
              value={form.jobDescription}
              onChange={(value) =>
                setForm((current) => ({ ...current, jobDescription: value }))
              }
            />
            <button
              type="button"
              onClick={() => void submitEvaluation()}
              disabled={isLoading}
              className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "正在生成..." : "生成评估草稿"}
            </button>
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {copyMessage ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {copyMessage}
              </p>
            ) : null}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="输出区" description="评估结果为 AI/规则辅助草稿，需人工确认。">
            {result?.success ? (
              <EvaluationResultPanel result={result} />
            ) : result ? (
              <FailurePanel result={result} />
            ) : (
              <p className="text-sm text-slate-600">提交 JD 与简历后显示结构化评估结果。</p>
            )}
          </SectionCard>

          <SectionCard title="复制到飞书" description="适合粘贴到飞书文档或多维表格备注。">
            <CopyPanel
              text={feishuText}
              buttonLabel="复制评估文本"
              onCopy={() => void copyText(feishuText, "评估文本")}
            />
          </SectionCard>
        </div>
      </section>

      <SectionCard title="Daily Internship Log" description="生成可复制的实习日报文本。">
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            id="resumes-reviewed"
            label="今日查看简历数"
            value={dailyLog.resumesReviewed}
            onChange={(value) =>
              setDailyLog((current) => ({ ...current, resumesReviewed: value }))
            }
          />
          <TextInput
            id="contacted-count"
            label="联系人数"
            value={dailyLog.contactedCount}
            onChange={(value) =>
              setDailyLog((current) => ({ ...current, contactedCount: value }))
            }
          />
          <TextInput
            id="interview-count"
            label="约面人数"
            value={dailyLog.interviewCount}
            onChange={(value) =>
              setDailyLog((current) => ({ ...current, interviewCount: value }))
            }
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextAreaInput
            id="issues"
            label="问题记录"
            rows={5}
            value={dailyLog.issues}
            onChange={(value) => setDailyLog((current) => ({ ...current, issues: value }))}
          />
          <TextAreaInput
            id="tomorrow-todos"
            label="明日待办"
            rows={5}
            value={dailyLog.tomorrowTodos}
            onChange={(value) =>
              setDailyLog((current) => ({ ...current, tomorrowTodos: value }))
            }
          />
        </div>
        <div className="mt-4">
          <CopyPanel
            text={dailyText}
            buttonLabel="复制日报文本"
            onCopy={() => void copyText(dailyText, "日报文本")}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function EvaluationResultPanel({
  result
}: {
  result: Extract<EvaluationDemoApiResponse, { success: true }>;
}): JSX.Element {
  const output = result.output;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 text-sm md:grid-cols-3">
        <Metric label="Run ID" value={result.runId} />
        <Metric label="Provider" value={result.metadata.providerName ?? "unknown"} />
        <Metric label="Model" value={result.metadata.model ?? "-"} />
        <Metric
          label="Duration"
          value={
            result.metadata.durationMs === undefined
              ? "-"
              : `${result.metadata.durationMs} ms`
          }
        />
        <Metric label="Audit Events" value={String(result.auditEventCount)} />
        <Metric label="Recommendation" value={output.recommendation} />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Overall Score</p>
        <p className="mt-1 text-3xl font-semibold text-slate-950">
          {output.overallScore}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{output.overallSummary}</p>
      </div>

      <StructuredList title="Strengths" items={output.strengths.map(formatStrength)} />
      <StructuredList title="Weaknesses" items={output.weaknesses.map(formatWeakness)} />
      <StructuredList title="Risks" items={output.risks.map(formatRisk)} />
      <StructuredList title="Evidence" items={output.evidence.map(formatEvidence)} />
      <StructuredList
        title="Dimension Scores"
        items={output.dimensionScores.map(formatDimensionScore)}
      />
      <StructuredList
        title="Interview Questions"
        items={output.interviewQuestions.map(formatInterviewQuestion)}
      />
    </div>
  );
}

function FailurePanel({
  result
}: {
  result: Extract<EvaluationDemoApiResponse, { success: false }>;
}): JSX.Element {
  return (
    <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">评估生成失败</p>
      <p>{result.error}</p>
      {result.failureReason ? <p>Failure Reason: {result.failureReason}</p> : null}
      {result.runId ? <p>Run ID: {result.runId}</p> : null}
    </div>
  );
}

function CopyPanel({
  text,
  buttonLabel,
  onCopy
}: {
  text: string;
  buttonLabel: string;
  onCopy: () => void;
}): JSX.Element {
  return (
    <div className="space-y-3">
      <textarea
        readOnly
        rows={12}
        value={text}
        className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-800"
      />
      <button
        type="button"
        onClick={onCopy}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <FormField id={id} label={label}>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </FormField>
  );
}

function TextAreaInput({
  id,
  label,
  rows,
  value,
  onChange
}: {
  id: string;
  label: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </FormField>
  );
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="border-b border-slate-200 pb-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StructuredList({
  title,
  items
}: {
  title: string;
  items: string[];
}): JSX.Element {
  return (
    <section className="border-t border-slate-200 pt-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-200 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">暂无</p>
      )}
    </section>
  );
}

export function buildFeishuEvaluationText({
  candidateName,
  jobTitle,
  output
}: {
  candidateName: string;
  jobTitle: string;
  output: ResumeEvaluationResult;
}): string {
  return [
    "候选人评估草稿",
    `候选人：${candidateName || "未填写"}`,
    `岗位：${jobTitle || "未填写"}`,
    `评估结论：${output.recommendation}`,
    `分数：${output.overallScore}`,
    `摘要：${output.overallSummary}`,
    "",
    "亮点：",
    ...formatLines(output.strengths.map(formatStrength)),
    "",
    "风险点：",
    ...formatLines(output.risks.map(formatRisk)),
    "",
    "待确认弱点：",
    ...formatLines(output.weaknesses.map(formatWeakness)),
    "",
    "电话筛选问题：",
    ...formatLines(output.interviewQuestions.map(formatInterviewQuestion)),
    "",
    "下一步建议：",
    "- 招聘者人工核对证据与岗位要求。",
    "- 根据电话筛选问题补充候选人信息。",
    "- 确认后再决定是否进入后续流程。",
    "",
    "本结果为 AI/规则辅助草稿，需招聘者人工确认，不代表自动录用/拒绝。"
  ].join("\n");
}

export function buildDailyInternshipLogText(log: DailyInternshipLogState): string {
  return [
    "实习日报",
    `今日查看简历数：${log.resumesReviewed || "0"}`,
    `联系人数：${log.contactedCount || "0"}`,
    `约面人数：${log.interviewCount || "0"}`,
    "",
    "问题记录：",
    log.issues.trim() || "无",
    "",
    "明日待办：",
    log.tomorrowTodos.trim() || "无"
  ].join("\n");
}

function formatLines(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- 暂无"];
}

function formatStrength(item: ResumeEvaluationResult["strengths"][number]): string {
  return `${item.title}: ${item.description}`;
}

function formatWeakness(item: ResumeEvaluationResult["weaknesses"][number]): string {
  return `${item.title} (${item.severity}): ${item.description}`;
}

function formatRisk(item: ResumeEvaluationResult["risks"][number]): string {
  return `${item.type} / ${item.severity}: ${item.description}`;
}

function formatEvidence(item: ResumeEvaluationResult["evidence"][number]): string {
  return `${item.source} / ${item.relevance}: ${item.text}`;
}

function formatDimensionScore(
  item: ResumeEvaluationResult["dimensionScores"][number]
): string {
  return `${item.label}: ${item.score} - ${item.rationale}`;
}

function formatInterviewQuestion(
  item: ResumeEvaluationResult["interviewQuestions"][number]
): string {
  return `${item.category}: ${item.question} (${item.purpose})`;
}
