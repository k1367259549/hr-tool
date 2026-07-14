"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  quickScreeningEvidenceSourceLabels,
  quickScreeningRecommendationLabels
} from "@/lib/resume-screening/quick-screening-contract";
import type { ApiResponse } from "@/types/api";
import type { QuickScreeningRunDto } from "@/types/resumeEvaluationRun";
import type {
  ResumeEvaluationDetailDto,
  ResumeEvaluationOptionsDto
} from "@/types/resumeEvaluationResult";

const quickScreeningTimeoutMs = 30_000;

export function NewEvaluationPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillResumeId = searchParams.get("resumeId") ?? "";
  const mode = normalizeEvaluationMode(searchParams.get("mode"));

  const [resumeId, setResumeId] = useState(prefillResumeId);
  const [jobProfileId, setJobProfileId] = useState("");
  const [templateVersionId, setTemplateVersionId] = useState("");
  const [evaluatedBy, setEvaluatedBy] = useState("");
  const [options, setOptions] = useState<ResumeEvaluationOptionsDto | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickScreeningResult, setQuickScreeningResult] =
    useState<QuickScreeningRunDto | null>(null);
  const [quickScreeningError, setQuickScreeningError] = useState<string | null>(null);
  const [quickScreeningTimedOut, setQuickScreeningTimedOut] = useState(false);
  const [createdEvaluationId, setCreatedEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId.trim()) {
      setOptions(null);
      return;
    }

    let cancelled = false;
    setIsLoadingOptions(true);

    void fetch(`/api/resume-evaluation-options?resumeId=${encodeURIComponent(resumeId.trim())}`)
      .then((r) => r.json() as Promise<ApiResponse<ResumeEvaluationOptionsDto>>)
      .then((json) => {
        if (cancelled) {
          return;
        }

        if (json.success && json.data) {
          setOptions(json.data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setQuickScreeningError(null);
    setQuickScreeningTimedOut(false);
    setQuickScreeningResult(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/resume-evaluations", {
        body: JSON.stringify({
          evaluatedBy: evaluatedBy.trim() || null,
          jobProfileId: jobProfileId.trim(),
          resumeId: resumeId.trim(),
          templateVersionId: templateVersionId.trim()
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      const json = (await response.json()) as ApiResponse<ResumeEvaluationDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "创建评估失败。");
      }

      setCreatedEvaluationId(json.data.id);

      if (mode === "quick") {
        await runQuickScreening(json.data.id);
        return;
      }

      router.push(`/feishu/evaluations/${json.data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建评估失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function retryQuickScreening(): Promise<void> {
    if (!createdEvaluationId) {
      setError("请先创建评估上下文后再运行快速初筛。");
      return;
    }

    setError(null);
    setQuickScreeningError(null);
    setQuickScreeningTimedOut(false);
    setQuickScreeningResult(null);
    setIsSaving(true);

    try {
      await runQuickScreening(createdEvaluationId);
    } finally {
      setIsSaving(false);
    }
  }

  async function runQuickScreening(evaluationId: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, quickScreeningTimeoutMs);

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/quick-screening`, {
        method: "POST",
        signal: controller.signal
      });
      const json = (await response.json()) as ApiResponse<QuickScreeningRunDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "快速初筛失败。");
      }

      setQuickScreeningResult(json.data);
    } catch (runError) {
      if (runError instanceof DOMException && runError.name === "AbortError") {
        setQuickScreeningTimedOut(true);
        setQuickScreeningError(
          "快速初筛请求超时。请稍后重试，或返回评估列表查看是否已生成 run。"
        );
        return;
      }

      setQuickScreeningError(
        runError instanceof Error ? runError.message : "快速初筛失败。"
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Resume Evaluations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            新建 AI 评估
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            选择已解析的简历、已确认的岗位和已发布的评价标准版本。当前入口用于建立正式评估上下文，
            后续可承接快速初筛和详细分析结果。
          </p>
        </div>
        <Link
          href="/feishu/evaluations"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          返回列表
        </Link>
      </header>

      <EvaluationModeGuide mode={mode} />

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-md border border-slate-200 bg-white p-5">
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          简历 ID
          <input
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="粘贴 Resume ID"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
          />
        </label>

        {isLoadingOptions ? (
          <p className="text-sm text-slate-500">正在加载岗位和模板选项…</p>
        ) : null}

        {options ? (
          <>
            <label className="block text-sm font-medium text-slate-700">
              岗位画像（已确认）
              <select
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={jobProfileId}
                onChange={(e) => setJobProfileId(e.target.value)}
              >
                <option value="">请选择岗位</option>
                {options.jobProfiles.map((jp) => (
                  <option key={jp.id} value={jp.id}>
                    {jp.jobTitle}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              评价标准版本（已发布）
              <select
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={templateVersionId}
                onChange={(e) => setTemplateVersionId(e.target.value)}
              >
                <option value="">请选择版本</option>
                {options.templateVersions.map((tv) => (
                  <option key={tv.id} value={tv.id}>
                    {tv.templateName} V{tv.versionNumber}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          评估人（可选）
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="评估人姓名"
            value={evaluatedBy}
            onChange={(e) => setEvaluatedBy(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={isSaving || !resumeId.trim() || !jobProfileId || !templateVersionId}
        >
          {isSaving
            ? mode === "quick"
              ? "快速初筛中…"
              : "创建中…"
            : mode === "quick"
              ? "创建并运行快速初筛"
              : "创建评估"}
        </button>
      </form>

      {mode === "quick" ? (
        <QuickScreeningStatusPanel
          createdEvaluationId={createdEvaluationId}
          error={quickScreeningError}
          isLoading={isSaving && !quickScreeningResult}
          onRetry={() => void retryQuickScreening()}
          result={quickScreeningResult}
          timedOut={quickScreeningTimedOut}
        />
      ) : null}
    </div>
  );
}

type EvaluationMode = "quick" | "detailed-analysis";

export function EvaluationModeGuide({ mode }: { mode: EvaluationMode }): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase text-slate-500">
            {mode === "quick" ? "Quick Screening" : "Detailed Analysis"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {mode === "quick"
              ? "快速初筛：判断是否值得进入详细分析"
              : "详细分析：沉淀岗位匹配证据"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === "quick"
              ? "快速初筛用于先判断候选人与岗位是否存在基础匹配信号，并记录明显风险和待确认信息。"
              : "详细分析用于输出岗位匹配、优势、不足、风险、证据和面试问题，供招聘者人工确认。"}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          不自动拒绝、不自动录用、不自动推进 Pipeline
        </div>
      </div>
    </section>
  );
}

function normalizeEvaluationMode(value: string | null): EvaluationMode {
  return value === "detailed-analysis" ? "detailed-analysis" : "quick";
}

export function QuickScreeningStatusPanel({
  createdEvaluationId,
  error,
  isLoading,
  onRetry,
  result,
  timedOut
}: {
  createdEvaluationId: string | null;
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  result: QuickScreeningRunDto | null;
  timedOut: boolean;
}): JSX.Element {
  if (result) {
    return <QuickScreeningResultPanel result={result} />;
  }

  if (error) {
    return (
      <section className="rounded-md border border-rose-200 bg-rose-50 p-5">
        <h2 className="text-lg font-semibold text-rose-950">
          {timedOut ? "快速初筛超时" : "快速初筛失败"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {createdEvaluationId ? (
            <button
              type="button"
              className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white"
              onClick={onRetry}
            >
              重试快速初筛
            </button>
          ) : null}
          <Link
            href="/feishu/evaluations"
            className="rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700"
          >
            返回评估列表
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">正在运行快速初筛</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          系统正在创建 RULE_BASED evaluation run。若超过 30 秒没有响应，页面会显示 timeout 提示。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">快速初筛结果</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        填写表单并点击“创建并运行快速初筛”后，这里会显示建议、分数、摘要、维度、证据、缺失信息和面试问题。
      </p>
    </section>
  );
}

export function QuickScreeningResultPanel({
  result
}: {
  result: QuickScreeningRunDto;
}): JSX.Element {
  const screeningResult = result.screeningResult;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase text-slate-500">
            Quick Screening Result
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            快速初筛已完成
          </h2>
          <p className="mt-2 break-words text-sm text-slate-500">
            {result.run.modelProvider ?? "RULE_BASED"} · {result.run.modelName ?? "local-rule"}
          </p>
        </div>
        <Link
          href={`/feishu/evaluations/${result.run.evaluationId}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          查看评估详情
        </Link>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
        <ResultMetric
          label="初筛建议"
          value={quickScreeningRecommendationLabels[screeningResult.recommendation]}
        />
        <ResultMetric label="规则分数" value={`${screeningResult.overallScore}/100`} />
        <ResultMetric label="Run 状态" value={result.run.status} />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        分数是规则型辅助匹配信号，不是录用概率，也不用于候选人排名。
      </p>

      <div className="mt-5 space-y-5">
        <ResultSection title="摘要" items={[screeningResult.summary]} />
        <ResultSection title="主要理由" items={screeningResult.reasons} />
        <ResultSection title="维度结果" items={formatDimensions(screeningResult.dimensions)} />
        <ResultSection title="亮点" items={screeningResult.strengths} />
        <ResultSection
          title="风险"
          items={screeningResult.risks.map((item) => item.description)}
        />
        <ResultSection
          title="缺失信息"
          items={screeningResult.missingInformation}
          emptyText="暂无明确缺失信息，仍需人工复核。"
        />
        <ResultSection title="证据" items={formatEvidence(screeningResult.evidence)} />
        <ResultSection title="面试问题" items={screeningResult.interviewQuestions} />
        <ResultSection title="下一步建议" items={[screeningResult.nextStep]} />
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        本结果为规则辅助初筛草稿，需招聘者人工确认，不代表自动录用、自动拒绝或自动推进 Pipeline。
      </p>
    </section>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ResultSection({
  emptyText = "暂无记录，需人工补充确认。",
  items,
  title
}: {
  emptyText?: string;
  items: string[];
  title: string;
}): JSX.Element {
  return (
    <div className="border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="break-words">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function formatDimensions(
  dimensions: QuickScreeningRunDto["screeningResult"]["dimensions"]
): string[] {
  return dimensions.map(
    (dimension) =>
      `${dimension.name}：${dimension.score}/100，${dimension.conclusion}`
  );
}

function formatEvidence(
  evidence: QuickScreeningRunDto["screeningResult"]["evidence"]
): string[] {
  return evidence.map(
    (item) => `${quickScreeningEvidenceSourceLabels[item.source]}：${item.text}`
  );
}
