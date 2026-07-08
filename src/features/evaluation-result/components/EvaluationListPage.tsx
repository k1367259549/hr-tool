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
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            AI 简历评估工作区
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            从正式飞书 V2 工作区进入评估流程：先做快速初筛，再对值得继续看的候选人做详细分析。
            评估结果只作为招聘者辅助草稿，不产生排名、自动拒绝或自动推进 Pipeline。
          </p>
        </div>
        <Link
          href="/feishu/evaluations/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          新建 AI 评估
        </Link>
      </header>

      <AiEvaluationEntryPanel />

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
                暂无正式评估记录。可以从上方 AI 评估入口创建快速初筛记录，再进入详细分析。
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

export function AiEvaluationEntryPanel(): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase text-slate-500">
            AI Evaluation Entry
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            正式 AI 评估入口
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            使用正式评估记录承接 AI 辅助结果。Quick Screening 用于判断候选人是否值得进入详细分析；
            Detailed Analysis 用于输出岗位匹配、优势、不足、风险、证据和面试问题。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/feishu/evaluations/new?mode=quick"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            开始快速初筛
          </Link>
          <Link
            href="/feishu/evaluations/new?mode=detailed-analysis"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            准备详细分析
          </Link>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        <EvaluationStageCard
          title="Quick Screening 快速初筛"
          description="用于快速判断简历是否值得进入详细分析。重点看岗位基础匹配、明显缺口和需要电话确认的信息。"
          items={[
            "先确认简历、岗位和评价标准版本",
            "只形成辅助判断，不自动拒绝或录用",
            "适合批量简历进入人工复核前的第一步"
          ]}
        />
        <EvaluationStageCard
          title="Detailed Analysis 详细分析"
          description="用于沉淀可复核的岗位匹配分析，输出优势、不足、风险、证据和面试问题。"
          items={[
            "围绕岗位要求组织证据和风险",
            "为电话筛选和面试准备问题",
            "最终决策仍由招聘者人工确认"
          ]}
        />
      </div>
    </section>
  );
}

function EvaluationStageCard({
  title,
  description,
  items
}: {
  title: string;
  description: string;
  items: string[];
}): JSX.Element {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
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
