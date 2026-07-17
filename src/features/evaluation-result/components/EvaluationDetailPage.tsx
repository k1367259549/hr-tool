"use client";

import React from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useEvaluationDetail } from "@/features/evaluation-result/hooks/useEvaluationDetail";
import {
  criterionAssessmentLabels,
  evaluationStatusLabels,
  formatDateTime
} from "@/features/evaluation-result/evaluationResultLabels";
import {
  quickScreeningEvidenceSourceLabels,
  quickScreeningRecommendationLabels
} from "@/lib/resume-screening/quick-screening-contract";
import { parseDetailedAnalysisReviewAudit } from "@/lib/resume-screening/detailed-analysis-review";
import type { ApiResponse } from "@/types/api";
import type {
  DetailedAnalysisReviewAction,
  DetailedAnalysisRunDto,
  ResumeEvaluationRunDto
} from "@/types/resumeEvaluationRun";
import type {
  CriterionAiReferenceDto,
  EvaluationAiReferenceDto,
  ResumeEvaluationCriterionResultDto,
  ResumeEvaluationEventDto
} from "@/types/resumeEvaluationResult";
import type {
  DetailedScreeningResult,
  ScreeningRecommendation
} from "@/types/resume-screening";

const detailedAnalysisTimeoutMs = 120_000;

export function EvaluationDetailPage({
  evaluationId
}: {
  evaluationId: string;
}): JSX.Element {
  const { error, evaluation, isLoading, isSaving, reload, review, reopen } =
    useEvaluationDetail(evaluationId);
  const [detailedAnalysis, setDetailedAnalysis] =
    useState<DetailedAnalysisRunDto | null>(null);
  const [detailedAnalysisError, setDetailedAnalysisError] = useState<string | null>(null);
  const [detailedAnalysisTimedOut, setDetailedAnalysisTimedOut] = useState(false);
  const [isDetailedAnalysisLoading, setIsDetailedAnalysisLoading] = useState(false);
  const [isDetailedAnalysisRunning, setIsDetailedAnalysisRunning] = useState(false);
  const [isDetailedAnalysisReviewing, setIsDetailedAnalysisReviewing] = useState(false);
  const [detailedAnalysisReviewError, setDetailedAnalysisReviewError] = useState<string | null>(
    null
  );
  const [detailedAnalysisReviewNote, setDetailedAnalysisReviewNote] = useState("");
  const [runHistory, setRunHistory] = useState<ResumeEvaluationRunDto[]>([]);

  const reloadDetailedAnalysis = useCallback(async () => {
    setIsDetailedAnalysisLoading(true);
    setDetailedAnalysisError(null);
    setDetailedAnalysisTimedOut(false);

    try {
      const runsResponse = await fetch(`/api/evaluations/${evaluationId}/runs`);
      const runs = await readApiData<ResumeEvaluationRunDto[]>(
        runsResponse,
        "评估 run 历史加载失败。"
      );

      setRunHistory(runs);

      const detailedResponse = await fetch(
        `/api/evaluations/${evaluationId}/detailed-analysis`
      );
      const latestDetailed = await readApiData<DetailedAnalysisRunDto | null>(
        detailedResponse,
        "详细分析结果加载失败。"
      );

      setDetailedAnalysis(latestDetailed);
    } catch (loadError) {
      setDetailedAnalysisError(
        loadError instanceof Error ? loadError.message : "详细分析结果加载失败。"
      );
    } finally {
      setIsDetailedAnalysisLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    void reloadDetailedAnalysis();
  }, [reloadDetailedAnalysis]);

  const startDetailedAnalysis = useCallback(async () => {
    setDetailedAnalysisError(null);
    setDetailedAnalysisTimedOut(false);
    setIsDetailedAnalysisRunning(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, detailedAnalysisTimeoutMs);

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/detailed-analysis`, {
        method: "POST",
        signal: controller.signal
      });
      const result = await readApiData<DetailedAnalysisRunDto>(
        response,
        "详细分析启动失败。"
      );

      if (!result.success) {
        await reloadDetailedAnalysis();
        setDetailedAnalysisError(result.error);
        setDetailedAnalysisTimedOut(result.failureReason === "TIMEOUT");
        return;
      }

      setDetailedAnalysis(result);
      await reloadDetailedAnalysis();
    } catch (runError) {
      if (runError instanceof DOMException && runError.name === "AbortError") {
        setDetailedAnalysisTimedOut(true);
        setDetailedAnalysisError(
          "详细分析请求超时。请稍后重试，或返回评估列表查看是否已生成 run。"
        );
        return;
      }

      setDetailedAnalysisError(
        runError instanceof Error ? runError.message : "详细分析启动失败。"
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsDetailedAnalysisRunning(false);
    }
  }, [evaluationId, reloadDetailedAnalysis]);

  const reviewDetailedAnalysis = useCallback(
    async (runId: string, decision: DetailedAnalysisReviewAction) => {
      if (!evaluation) {
        return;
      }

      const note = detailedAnalysisReviewNote.trim();

      if ((decision === "NEEDS_REVISION" || decision === "REJECTED") && !note) {
        setDetailedAnalysisReviewError("要求重新分析或拒绝结果时，请填写审核说明。");
        return;
      }

      setDetailedAnalysisReviewError(null);
      setIsDetailedAnalysisReviewing(true);

      try {
        const response = await fetch(
          `/api/evaluations/${evaluationId}/detailed-analysis/${runId}/review`,
          {
            body: JSON.stringify({
              decision,
              expectedRevision: evaluation.revision,
              note: note || null,
              reviewer: evaluation.evaluatedBy?.trim() || "Recruiter"
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST"
          }
        );

        await readApiData(response, "详细分析审核提交失败。");
        setDetailedAnalysisReviewNote("");
        await Promise.all([reload(), reloadDetailedAnalysis()]);
      } catch (reviewError) {
        setDetailedAnalysisReviewError(
          reviewError instanceof Error ? reviewError.message : "详细分析审核提交失败。"
        );
      } finally {
        setIsDetailedAnalysisReviewing(false);
      }
    },
    [detailedAnalysisReviewNote, evaluation, evaluationId, reload, reloadDetailedAnalysis]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Resume Evaluations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">评估详情</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            人工逐项记录评价标准证据。不产生分数、排名或自动决策。
          </p>
        </div>
        <Link
          href="/feishu/evaluations"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          返回列表
        </Link>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载评估详情" description="读取评估记录和事件历史。" />
      ) : evaluation ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <MetaItem
              label="状态"
              value={evaluationStatusLabels[evaluation.status] ?? evaluation.status}
            />
            <MetaItem label="版本" value={String(evaluation.revision)} />
            <MetaItem
              label="评估人"
              value={evaluation.evaluatedBy ?? "未指定"}
            />
            <MetaItem
              label="审阅时间"
              value={formatDateTime(evaluation.reviewedAt)}
            />
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">关联信息</h2>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <MetaLine label="简历" value="已关联" />
              <MetaLine label="岗位" value="已关联" />
              <MetaLine label="评价标准" value="已关联" />
              <MetaLine label="岗位画像快照版本" value={evaluation.jobProfileVersion} />
              <MetaLine label="创建时间" value={formatDateTime(evaluation.createdAt)} />
              <MetaLine label="更新时间" value={formatDateTime(evaluation.updatedAt)} />
            </div>
          </section>

          <DetailedAnalysisWorkspace
            error={detailedAnalysisError}
            isLoading={isDetailedAnalysisLoading}
            isRunning={isDetailedAnalysisRunning}
            isReviewing={isDetailedAnalysisReviewing}
            latestDetailedAnalysis={detailedAnalysis}
            onReload={() => void reloadDetailedAnalysis()}
            onReview={(runId, decision) => void reviewDetailedAnalysis(runId, decision)}
            onReviewNoteChange={setDetailedAnalysisReviewNote}
            onStart={() => void startDetailedAnalysis()}
            reviewError={detailedAnalysisReviewError}
            reviewEvents={evaluation.events}
            reviewNote={detailedAnalysisReviewNote}
            runHistory={runHistory}
            selectedRunId={evaluation.selectedRunId}
            timedOut={detailedAnalysisTimedOut}
          />

          {evaluation.overallNote ? (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">总体备注</h2>
              <p className="mt-3 text-sm text-slate-700">{evaluation.overallNote}</p>
            </section>
          ) : null}

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">评估维度</h2>
            <AiReferenceStatusNotice reference={evaluation.aiReference} />
            {evaluation.criterionResults.length > 0 ? (
              <div className="mt-4 divide-y divide-slate-100">
                {evaluation.criterionResults.map((cr) => (
                  <CriterionResultRow
                    aiReference={findCriterionAiReference(evaluation.aiReference, cr.criterionKey)}
                    key={cr.criterionKey}
                    result={cr}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                暂无评估维度记录。请更新 DRAFT 状态的评估以填写各维度结果。
              </p>
            )}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-950">操作</h2>
            <div className="flex flex-wrap gap-3">
              {evaluation.status === "DRAFT" ? (
                <button
                  type="button"
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() => void review()}
                >
                  {isSaving ? "处理中…" : "标记为已审阅"}
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() => void reopen()}
                >
                  {isSaving ? "处理中…" : "重新开放"}
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              标记审阅后评估进入只读状态。重新开放后可继续编辑。
            </p>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">操作历史</h2>
            {evaluation.events.length > 0 ? (
              <div className="mt-3 divide-y divide-slate-100">
                {evaluation.events.map((event) => (
                  <div key={event.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-medium text-slate-700">{event.eventType}</span>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(event.createdAt)}
                      </span>
                    </div>
                    {event.actor ? (
                      <p className="mt-1 text-xs text-slate-500">操作人：{event.actor}</p>
                    ) : null}
                    {event.changedFields.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        变更字段：{event.changedFields.join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">暂无操作历史。</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

type DetailedAnalysisWorkspaceProps = {
  error: string | null;
  isLoading: boolean;
  isRunning: boolean;
  isReviewing?: boolean;
  latestDetailedAnalysis: DetailedAnalysisRunDto | null;
  onReload: () => void;
  onReview?: (runId: string, decision: DetailedAnalysisReviewAction) => void;
  onReviewNoteChange?: (note: string) => void;
  onStart: () => void;
  reviewError?: string | null;
  reviewEvents?: ResumeEvaluationEventDto[];
  reviewNote?: string;
  runHistory: ResumeEvaluationRunDto[];
  selectedRunId?: string | null;
  timedOut: boolean;
};

type DetailedAnalysisReadiness = {
  canStartDetailedAnalysis: boolean;
  latestDetailedRun: ResumeEvaluationRunDto | null;
  latestQuickRun: ResumeEvaluationRunDto | null;
  startDisabledReason: string | null;
};

export function DetailedAnalysisWorkspace({
  error,
  isLoading,
  isRunning,
  isReviewing = false,
  latestDetailedAnalysis,
  onReload,
  onReview,
  onReviewNoteChange,
  onStart,
  reviewError = null,
  reviewEvents = [],
  reviewNote = "",
  runHistory,
  selectedRunId = null,
  timedOut
}: DetailedAnalysisWorkspaceProps): JSX.Element {
  const readiness = deriveDetailedAnalysisState(runHistory);
  const hasDetailedRun = runHistory.some((run) => run.runType === "AI");
  const actionLabel = isRunning
    ? "详细分析中…"
    : hasDetailedRun
      ? "重新运行详细分析"
      : "开始详细分析";
  const actionDisabled =
    isLoading || isRunning || !readiness.canStartDetailedAnalysis;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase text-slate-500">
            Detailed Analysis
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            详细分析执行区
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            基于已完成的 Quick Screening、岗位画像和简历解析文本生成可复核的岗位匹配、优势、风险、证据和面试问题。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={actionDisabled}
            onClick={onStart}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRunning}
            onClick={onReload}
          >
            刷新状态
          </button>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
        <RunSummaryMetric
          label="最新快速初筛"
          value={formatRunSummary(readiness.latestQuickRun)}
        />
        <RunSummaryMetric
          label="详细分析状态"
          value={formatRunSummary(readiness.latestDetailedRun)}
        />
        <RunSummaryMetric
          label="启动条件"
          value={
            readiness.canStartDetailedAnalysis
              ? "满足，可以启动详细分析"
              : readiness.startDisabledReason ?? "状态待确认"
          }
        />
      </div>

      {readiness.latestQuickRun ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          最新快速初筛：
          {formatScreeningRecommendation(readiness.latestQuickRun.rating)}，
          分数 {readiness.latestQuickRun.score ?? "无"}。
          {readiness.latestQuickRun.summary
            ? ` ${readiness.latestQuickRun.summary}`
            : ""}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          尚未找到 Quick Screening run。请先运行快速初筛，再启动详细分析。
        </p>
      )}

      {error ? (
        <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">
            {timedOut ? "详细分析请求超时" : "详细分析失败"}
          </p>
          <p className="mt-2 leading-6">{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          正在读取详细分析状态和 run 历史…
        </div>
      ) : null}

      {latestDetailedAnalysis ? (
        <DetailedAnalysisResultPanel
          analysis={latestDetailedAnalysis}
          isReviewing={isReviewing}
          onReview={onReview}
          onReviewNoteChange={onReviewNoteChange}
          reviewError={reviewError}
          reviewNote={reviewNote}
          reviewState={
            latestDetailedAnalysis.success
              ? findDetailedAnalysisReviewState(reviewEvents, latestDetailedAnalysis.runId)
              : null
          }
          selectedRunId={selectedRunId}
        />
      ) : !isLoading ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          暂无成功的详细分析结果。满足快速初筛前置条件后，可以点击“开始详细分析”生成 canonical DetailedScreeningResult。
        </div>
      ) : null}

      <DetailedAnalysisHistoryPanel reviewEvents={reviewEvents} runs={runHistory} />
    </section>
  );
}

export function deriveDetailedAnalysisState(
  runs: ResumeEvaluationRunDto[]
): DetailedAnalysisReadiness {
  const latestDetailedRun = runs.find((run) => run.runType === "AI") ?? null;
  const runningDetailedRun =
    runs.find((run) => run.runType === "AI" && run.status === "PENDING") ?? null;
  const latestQuickRun = runs.find((run) => run.runType === "RULE_BASED") ?? null;

  if (runningDetailedRun) {
    return {
      canStartDetailedAnalysis: false,
      latestDetailedRun,
      latestQuickRun,
      startDisabledReason: "当前已有详细分析正在运行，请等待完成后再重试。"
    };
  }

  if (!latestQuickRun) {
    return {
      canStartDetailedAnalysis: false,
      latestDetailedRun,
      latestQuickRun,
      startDisabledReason: "缺少快速初筛结果，请先完成 Quick Screening。"
    };
  }

  if (latestQuickRun.status === "PENDING") {
    return {
      canStartDetailedAnalysis: false,
      latestDetailedRun,
      latestQuickRun,
      startDisabledReason: "快速初筛仍在运行，请完成后再启动详细分析。"
    };
  }

  if (latestQuickRun.status === "FAILED") {
    return {
      canStartDetailedAnalysis: false,
      latestDetailedRun,
      latestQuickRun,
      startDisabledReason: "快速初筛失败，请先重新运行快速初筛。"
    };
  }

  if (!isDetailedAnalysisAllowedRecommendation(latestQuickRun.rating)) {
    return {
      canStartDetailedAnalysis: false,
      latestDetailedRun,
      latestQuickRun,
      startDisabledReason:
        "当前快速初筛建议不允许进入详细分析，请补充信息或重新初筛后再试。"
    };
  }

  return {
    canStartDetailedAnalysis: true,
    latestDetailedRun,
    latestQuickRun,
    startDisabledReason: null
  };
}

export function DetailedAnalysisResultPanel({
  analysis,
  isReviewing = false,
  onReview,
  onReviewNoteChange,
  reviewError = null,
  reviewNote = "",
  reviewState = null,
  selectedRunId = null
}: {
  analysis: DetailedAnalysisRunDto;
  isReviewing?: boolean;
  onReview?: (runId: string, decision: DetailedAnalysisReviewAction) => void;
  onReviewNoteChange?: (note: string) => void;
  reviewError?: string | null;
  reviewNote?: string;
  reviewState?: DetailedAnalysisReviewState | null;
  selectedRunId?: string | null;
}): JSX.Element {
  if (!analysis.success) {
    return (
      <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {analysis.error}
      </div>
    );
  }

  const result = analysis.screeningResult;

  return (
    <div className="mt-5 rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase text-slate-500">
            Detailed Result
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            详细分析已完成
          </h3>
          <p className="mt-2 break-words text-sm text-slate-500">
            Run {analysis.runId} · {analysis.provider ?? "OPENAI_COMPATIBLE"} ·{" "}
            {analysis.model ?? analysis.metadata.model ?? "未记录模型"}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          耗时 {analysis.metadata.durationMs}ms · {formatDateTime(analysis.completedAt)}
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
        <RunSummaryMetric
          label="详细建议"
          value={formatScreeningRecommendation(result.recommendation)}
        />
        <RunSummaryMetric label="岗位匹配分" value={`${result.overallScore}/100`} />
        <RunSummaryMetric label="Run 状态" value={analysis.status} />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        该分数是岗位匹配辅助信号，不代表录用概率，也不用于候选人排名。
      </p>

      <DetailedAnalysisReviewPanel
        isReviewing={isReviewing}
        onReview={onReview}
        onReviewNoteChange={onReviewNoteChange}
        reviewError={reviewError}
        reviewNote={reviewNote}
        reviewState={reviewState}
        runId={analysis.runId}
        selectedRunId={selectedRunId}
      />

      <div className="mt-5 space-y-5">
        <DetailedListSection title="总结" items={[result.summary]} />
        <DetailedDimensionSection dimensions={result.dimensions} />
        <DetailedListSection title="优势" items={result.strengths} />
        <DetailedListSection title="不足" items={result.weaknesses} />
        <DetailedListSection
          title="风险"
          items={result.risks.map((item) => item.description)}
        />
        <DetailedListSection
          title="待确认信息"
          emptyText="暂无待确认信息，仍需招聘者人工复核。"
          items={result.missingInformation}
        />
        <DetailedListSection title="证据" items={formatDetailedEvidence(result.evidence)} />
        <DetailedListSection title="面试问题" items={result.interviewQuestions} />
        <DetailedListSection title="下一步人工确认建议" items={[result.nextStep]} />
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        本结果为 AI/规则辅助草稿，需招聘者人工确认，不代表自动录用、自动拒绝或自动推进 Pipeline。
      </p>
    </div>
  );
}

export function DetailedAnalysisHistoryPanel({
  reviewEvents = [],
  runs
}: {
  reviewEvents?: ResumeEvaluationEventDto[];
  runs: ResumeEvaluationRunDto[];
}): JSX.Element {
  const relevantRuns = runs.filter(
    (run) => run.runType === "RULE_BASED" || run.runType === "AI"
  );

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-950">Run 历史</h3>
      {relevantRuns.length > 0 ? (
        <div className="mt-3 divide-y divide-slate-100">
          {relevantRuns.map((run) => (
            <div key={run.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-medium text-slate-700">
                  {formatRunType(run.runType)} · {formatRunStatus(run.status)}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(run.createdAt)}
                </span>
              </div>
              <p className="mt-1 break-words text-xs text-slate-500">
                {run.modelProvider ?? "local"} / {run.modelName ?? "未记录模型"} ·{" "}
                {formatScreeningRecommendation(run.rating)} · 分数{" "}
                {run.score ?? "无"}
              </p>
              {run.summary ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{run.summary}</p>
              ) : null}
              {run.errorMessage ? (
                <p className="mt-2 text-sm leading-6 text-rose-700">
                  错误：{run.errorMessage}
                </p>
              ) : null}
              {run.runType === "AI" ? (
                <p className="mt-2 text-xs text-slate-500">
                  审核状态：{formatDetailedAnalysisReviewState(
                    findDetailedAnalysisReviewState(reviewEvents, run.id)
                  )}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">暂无 Quick 或 Detailed run 记录。</p>
      )}
    </div>
  );
}

type DetailedAnalysisReviewState = {
  decision: DetailedAnalysisReviewAction;
  note: string | null;
  reviewedAt: string;
  reviewer: string | null;
};

function DetailedAnalysisReviewPanel({
  isReviewing,
  onReview,
  onReviewNoteChange,
  reviewError,
  reviewNote,
  reviewState,
  runId,
  selectedRunId
}: {
  isReviewing: boolean;
  onReview?: (runId: string, decision: DetailedAnalysisReviewAction) => void;
  onReviewNoteChange?: (note: string) => void;
  reviewError: string | null;
  reviewNote: string;
  reviewState: DetailedAnalysisReviewState | null;
  runId: string;
  selectedRunId: string | null;
}): JSX.Element {
  const isReference =
    selectedRunId === runId && reviewState?.decision === "ACCEPTED_AS_REFERENCE";

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <h4 className="text-sm font-semibold text-slate-950">人工审核</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        AI 详细分析仅作为评估参考。最终评价内容需要由招聘人员核对、编辑并确认。
      </p>
      {reviewState ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-medium">{formatDetailedAnalysisReviewState(reviewState)}</p>
          <p className="mt-1 text-xs text-slate-500">
            审核人：{reviewState.reviewer ?? "未记录"} · {formatDateTime(reviewState.reviewedAt)}
          </p>
          {reviewState.note ? <p className="mt-2 leading-6">{reviewState.note}</p> : null}
          {isReference ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">已设为人工评估参考</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">尚未审核该详细分析结果。</p>
      )}
      {onReview ? (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`review-note-${runId}`}>
            审核说明
          </label>
          <textarea
            id={`review-note-${runId}`}
            className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            onChange={(event) => onReviewNoteChange?.(event.target.value)}
            placeholder="要求重新分析或拒绝结果时必须填写说明。"
            value={reviewNote}
          />
          {reviewError ? <p className="mt-2 text-sm text-rose-700">{reviewError}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={isReviewing}
              onClick={() => onReview(runId, "ACCEPTED_AS_REFERENCE")}
            >
              {isReviewing ? "提交中…" : "采用为人工评估参考"}
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
              disabled={isReviewing}
              onClick={() => onReview(runId, "NEEDS_REVISION")}
            >
              要求重新分析
            </button>
            <button
              type="button"
              className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
              disabled={isReviewing}
              onClick={() => onReview(runId, "REJECTED")}
            >
              拒绝该结果
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function findDetailedAnalysisReviewState(
  events: ResumeEvaluationEventDto[],
  runId: string
): DetailedAnalysisReviewState | null {
  for (const event of events) {
    const audit = parseDetailedAnalysisReviewAudit(event);

    if (audit?.runId === runId) {
      return {
        decision: audit.decision,
        note: event.note,
        reviewedAt: event.createdAt,
        reviewer: event.actor
      };
    }
  }

  return null;
}

function formatDetailedAnalysisReviewState(
  state: DetailedAnalysisReviewState | null
): string {
  if (!state) {
    return "未审核";
  }

  if (state.decision === "ACCEPTED_AS_REFERENCE") {
    return "已设为人工评估参考";
  }

  if (state.decision === "NEEDS_REVISION") {
    return "需要重新分析";
  }

  return "该结果未被采用";
}

function DetailedDimensionSection({
  dimensions
}: {
  dimensions: DetailedScreeningResult["dimensions"];
}): JSX.Element {
  return (
    <div className="border-t border-slate-200 pt-4">
      <h4 className="text-sm font-semibold text-slate-950">维度分析</h4>
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
        {dimensions.map((dimension) => (
          <div key={dimension.key} className="min-w-0 rounded-md border border-slate-200 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="break-words text-sm font-semibold text-slate-950">
                {dimension.name}
              </p>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                {dimension.score}/100 · {dimension.matchLevel}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {dimension.conclusion}
            </p>
            {dimension.missingInformation.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                待确认：{dimension.missingInformation.join("；")}
              </p>
            ) : null}
            {dimension.risks.length > 0 ? (
              <p className="mt-1 text-xs leading-5 text-rose-700">
                风险：{dimension.risks.join("；")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailedListSection({
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
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
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

function RunSummaryMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

async function readApiData<TData>(
  response: Response,
  fallbackMessage: string
): Promise<TData> {
  const json = (await response.json()) as ApiResponse<TData>;

  if (!json.success) {
    throw new Error(json.error?.message ?? fallbackMessage);
  }

  return json.data;
}

function formatRunSummary(run: ResumeEvaluationRunDto | null): string {
  if (!run) {
    return "无记录";
  }

  const score = run.score === null ? "无分数" : `${run.score}分`;

  return `${formatRunStatus(run.status)} · ${formatScreeningRecommendation(run.rating)} · ${score}`;
}

function formatRunType(runType: ResumeEvaluationRunDto["runType"]): string {
  if (runType === "RULE_BASED") {
    return "Quick Screening";
  }

  if (runType === "AI") {
    return "Detailed Analysis";
  }

  return "Mock Run";
}

function formatRunStatus(status: ResumeEvaluationRunDto["status"]): string {
  if (status === "SUCCEEDED") {
    return "已完成";
  }

  if (status === "FAILED") {
    return "失败";
  }

  return "运行中";
}

function formatScreeningRecommendation(value: string | null): string {
  if (isKnownScreeningRecommendation(value)) {
    return quickScreeningRecommendationLabels[value];
  }

  return value ?? "无建议";
}

function isDetailedAnalysisAllowedRecommendation(value: string | null): boolean {
  return value === "PROCEED_TO_NEXT_STEP" || value === "MANUAL_REVIEW";
}

function isKnownScreeningRecommendation(
  value: string | null
): value is ScreeningRecommendation {
  return (
    value !== null &&
    Object.prototype.hasOwnProperty.call(quickScreeningRecommendationLabels, value)
  );
}

function formatDetailedEvidence(
  evidence: DetailedScreeningResult["evidence"]
): string[] {
  return evidence.map((item) => {
    const source = quickScreeningEvidenceSourceLabels[item.source];
    const relatedRequirement = item.relatedRequirement
      ? `（${item.relatedRequirement}）`
      : "";

    return `${source}${relatedRequirement}：${item.text}`;
  });
}

function CriterionResultRow({
  aiReference,
  result
}: {
  aiReference: CriterionAiReferenceDto | null;
  result: ResumeEvaluationCriterionResultDto;
}): JSX.Element {
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="break-all text-sm font-semibold text-slate-950">{result.criterionKey}</p>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
          {criterionAssessmentLabels[result.assessment]}
        </span>
      </div>
      {result.recruiterNote ? (
        <p className="mt-2 text-sm text-slate-600">{result.recruiterNote}</p>
      ) : null}
      {result.evidenceNotes.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
          {result.evidenceNotes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      ) : null}
      <CriterionAiReferencePanel reference={aiReference} />
    </div>
  );
}

export function AiReferenceStatusNotice({
  reference
}: {
  reference: EvaluationAiReferenceDto | undefined;
}): JSX.Element {
  const message = reference?.warning ?? "尚未选择 AI 详细分析作为人工评估参考。人工评价仍可独立完成。";

  if (reference?.status === "AVAILABLE") {
    return (
      <p className="mt-3 text-sm leading-6 text-slate-600">
        以下内容来自已由招聘人员选定的 AI 详细分析，仅作为人工评价参考。最终评价需要由招聘人员核对、编辑并确认。
      </p>
    );
  }

  return <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>;
}

export function CriterionAiReferencePanel({
  reference
}: {
  reference: CriterionAiReferenceDto | null;
}): JSX.Element {
  if (!reference || reference.status !== "AVAILABLE") {
    return (
      <p className="mt-3 text-xs leading-5 text-slate-500">
        当前 AI 详细分析中没有该评价标准的有效逐项结果。请由招聘人员根据简历和岗位要求独立完成评价。
      </p>
    );
  }

  return (
    <aside className="mt-4 min-w-0 border-l-2 border-sky-200 pl-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">AI 逐项参考</h3>
          <p className="mt-1 break-words text-xs text-slate-500">{reference.criterionLabel}</p>
        </div>
        <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-800">
          {reference.score}/100
        </span>
      </div>
      <p className="mt-2 break-words text-sm leading-6 text-slate-700">{reference.conclusion}</p>
      <AiReferenceList title="证据" items={formatAiReferenceEvidence(reference.evidence)} />
      <AiReferenceList title="AI 提示的风险" items={reference.risks} />
      <AiReferenceList
        emptyText="暂无待确认信息，仍需招聘人员人工核对。"
        title="待确认信息"
        items={reference.missingInformation}
      />
      <AiReferenceList title="面试问题" items={reference.interviewQuestions} />
    </aside>
  );
}

function AiReferenceList({
  emptyText = "暂无记录。",
  items,
  title
}: {
  emptyText?: string;
  items: string[];
  title: string;
}): JSX.Element {
  return (
    <div className="mt-3 min-w-0">
      <h4 className="text-xs font-medium text-slate-600">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-6 text-slate-600">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="break-words">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs leading-5 text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function findCriterionAiReference(
  reference: EvaluationAiReferenceDto | undefined,
  criterionKey: string
): CriterionAiReferenceDto | null {
  if (reference?.status !== "AVAILABLE") {
    return null;
  }

  return reference.criterionReferences.find((item) => item.criterionKey === criterionKey) ?? null;
}

function formatAiReferenceEvidence(
  evidence: CriterionAiReferenceDto["evidence"]
): string[] {
  return evidence.map((item) => {
    const source = quickScreeningEvidenceSourceLabels[item.source];
    const relatedRequirement = item.relatedRequirement ? `（${item.relatedRequirement}）` : "";

    return `${source}${relatedRequirement}：${item.text}`;
  });
}

function MetaItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <p>
      <span className="font-medium text-slate-500">{label}: </span>
      <span className="break-all text-slate-700">{value}</span>
    </p>
  );
}
