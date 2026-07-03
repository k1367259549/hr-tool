"use client";

import React from "react";
import Link from "next/link";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useEvaluationTemplateList } from "@/features/evaluation-template/hooks/useEvaluationTemplateList";
import {
  formatDateTime,
  templateStatusLabels,
  versionStatusLabels
} from "@/features/evaluation-template/evaluationTemplateLabels";
import type {
  EvaluationTemplateStatus,
  EvaluationTemplateSummaryDto
} from "@/types/evaluationTemplate";

export function EvaluationTemplateListPage(): JSX.Element {
  const { error, filters, isLoading, result, setFilters } = useEvaluationTemplateList();
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
          <p className="text-sm font-medium uppercase text-slate-500">Evaluation Templates</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">评价标准</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            管理可版本化的岗位评价维度。模板不会自动评估简历，也不会产生评分、排名或招聘决策。
          </p>
        </div>
        <Link
          href="/feishu/evaluation-templates/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          新建评价标准
        </Link>
      </header>

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="搜索名称或说明"
          value={filters.search}
          onChange={(event) => setFilters({ search: event.target.value })}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.status}
          onChange={(event) =>
            setFilters({ status: event.target.value as EvaluationTemplateStatus | "" })
          }
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">启用</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          onClick={() => setFilters({ search: "", status: "" })}
        >
          重置
        </button>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载评价标准" description="读取模板、版本和岗位分配摘要。" />
      ) : (
        <>
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {result && result.items.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {result.items.map((template) => (
                  <TemplateRow key={template.id} template={template} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-600">
                暂无评价标准。可以先创建一个空模板，再逐步添加招聘关注维度。
              </div>
            )}
          </section>
          <EvaluationTemplatePagination
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

function TemplateRow({ template }: { template: EvaluationTemplateSummaryDto }): JSX.Element {
  return (
    <Link href={`/feishu/evaluation-templates/${template.id}`} className="block p-4 hover:bg-slate-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-slate-950">{template.name}</p>
          <p className="mt-1 text-xs text-slate-500">{template.description ?? "未填写说明"}</p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          {templateStatusLabels[template.status]}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-5">
        <MetaLine
          label="当前 Draft"
          value={
            template.currentDraftVersion
              ? `V${template.currentDraftVersion.versionNumber} ${versionStatusLabels[template.currentDraftVersion.status]}`
              : "无"
          }
        />
        <MetaLine
          label="最新 Published"
          value={
            template.latestPublishedVersion
              ? `V${template.latestPublishedVersion.versionNumber}`
              : "无"
          }
        />
        <MetaLine label="关联岗位" value={`${template.activeAssignmentCount} 个`} />
        <MetaLine label="最新版本号" value={`V${template.latestVersionNumber}`} />
        <MetaLine label="更新时间" value={formatDateTime(template.updatedAt)} />
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

export function EvaluationTemplatePagination({
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
  const isNextDisabled = isLoading || normalizedCurrentPage >= normalizedTotalPages || total === 0;

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
          onClick={() => onPageChange(Math.min(normalizedTotalPages, normalizedCurrentPage + 1))}
        >
          下一页
        </button>
      </div>
    </nav>
  );
}
