"use client";

import React from "react";
import Link from "next/link";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useEvaluationList } from "@/features/evaluation-result/hooks/useEvaluationList";
import {
  evaluationStatusLabels,
  formatDateTime
} from "@/features/evaluation-result/evaluationResultLabels";
import type {
  ResumeEvaluationStatus,
  ResumeEvaluationSummaryDto
} from "@/types/resumeEvaluationResult";

export function EvaluationListPage(): JSX.Element {
  const { error, filters, isLoading, result, setFilters } = useEvaluationList();
  const pagination = result?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
    totalPages: 1
  };
  const totalPages = Math.max(1, pagination.totalPages);
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Resume Evaluations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">评估记录</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            按照评价标准对简历进行人工逐项记录。不产生分数、排名或自动决策。
          </p>
        </div>
        <Link
          href="/feishu/evaluations/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          新建评估
        </Link>
      </header>

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-4">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.status}
          onChange={(event) =>
            setFilters({ status: event.target.value as ResumeEvaluationStatus | "" })
          }
        >
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="REVIEWED">已审阅</option>
        </select>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          onClick={() => setFilters({ status: "" })}
        >
          重置
        </button>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载评估记录" description="读取简历评估摘要。" />
      ) : (
        <>
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {result && result.items.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {result.items.map((evaluation) => (
                  <EvaluationRow key={evaluation.id} evaluation={evaluation} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-600">
                暂无评估记录。可以在简历详情页或此处新建评估。
              </div>
            )}
          </section>
          <EvaluationPagination
            currentPage={currentPage}
            isLoading={isLoading}
            onPageChange={(page) => setFilters({ page })}
            total={pagination.total}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
}

function EvaluationRow({
  evaluation
}: {
  evaluation: ResumeEvaluationSummaryDto;
}): JSX.Element {
  return (
    <Link
      href={`/feishu/evaluations/${evaluation.id}`}
      className="block p-4 hover:bg-slate-50"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-slate-950">
            评估 {evaluation.id.slice(0, 8)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {evaluation.evaluatedBy ? `评估人：${evaluation.evaluatedBy}` : "未指定评估人"}
          </p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          {evaluationStatusLabels[evaluation.status]}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-4">
        <MetaLine label="简历 ID" value={evaluation.resumeId.slice(0, 8)} />
        <MetaLine label="岗位 ID" value={evaluation.jobProfileId.slice(0, 8)} />
        <MetaLine label="版本号" value={String(evaluation.revision)} />
        <MetaLine label="更新时间" value={formatDateTime(evaluation.updatedAt)} />
      </div>
    </Link>
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

export function EvaluationPagination({
  currentPage,
  isLoading,
  onPageChange,
  total,
  totalPages
}: {
  currentPage: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  total: number;
  totalPages: number;
}): JSX.Element {
  const normalizedTotalPages = Math.max(1, totalPages);
  const normalizedCurrentPage = Math.min(Math.max(1, currentPage), normalizedTotalPages);
  const isPreviousDisabled = isLoading || normalizedCurrentPage <= 1 || total === 0;
  const isNextDisabled =
    isLoading || normalizedCurrentPage >= normalizedTotalPages || total === 0;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">
        第 {normalizedCurrentPage} / {normalizedTotalPages} 页，共 {total} 条
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPreviousDisabled}
          onClick={() => onPageChange(Math.max(1, normalizedCurrentPage - 1))}
        >
          上一页
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isNextDisabled}
          onClick={() =>
            onPageChange(Math.min(normalizedTotalPages, normalizedCurrentPage + 1))
          }
        >
          下一页
        </button>
      </div>
    </nav>
  );
}
