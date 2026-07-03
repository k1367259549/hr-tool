"use client";

import Link from "next/link";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useEvaluationDetail } from "@/features/evaluation-result/hooks/useEvaluationDetail";
import {
  criterionAssessmentLabels,
  evaluationStatusLabels,
  formatDateTime
} from "@/features/evaluation-result/evaluationResultLabels";
import type { ResumeEvaluationCriterionResultDto } from "@/types/resumeEvaluationResult";

export function EvaluationDetailPage({
  evaluationId
}: {
  evaluationId: string;
}): JSX.Element {
  const { error, evaluation, isLoading, isSaving, review, reopen } =
    useEvaluationDetail(evaluationId);

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
              <MetaLine label="简历 ID" value={evaluation.resumeId} />
              <MetaLine label="岗位 ID" value={evaluation.jobProfileId} />
              <MetaLine label="模板版本 ID" value={evaluation.templateVersionId} />
              <MetaLine label="岗位画像快照版本" value={evaluation.jobProfileVersion} />
              <MetaLine label="创建时间" value={formatDateTime(evaluation.createdAt)} />
              <MetaLine label="更新时间" value={formatDateTime(evaluation.updatedAt)} />
            </div>
          </section>

          {evaluation.overallNote ? (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">总体备注</h2>
              <p className="mt-3 text-sm text-slate-700">{evaluation.overallNote}</p>
            </section>
          ) : null}

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">评估维度</h2>
            {evaluation.criterionResults.length > 0 ? (
              <div className="mt-4 divide-y divide-slate-100">
                {evaluation.criterionResults.map((cr) => (
                  <CriterionResultRow key={cr.criterionKey} result={cr} />
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

function CriterionResultRow({
  result
}: {
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
    </div>
  );
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
