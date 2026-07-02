"use client";

import React from "react";
import Link from "next/link";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  applicationStageLabels,
  applicationStages
} from "@/features/pipeline/applicationStage";
import { useApplicationList } from "@/features/pipeline/hooks/useApplicationList";
import type { ApplicationStage } from "@/types/candidateApplication";

export function PipelineBoardPage(): JSX.Element {
  const { error, filters, isLoading, result, setFilters } = useApplicationList();
  const pagination = result?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
    totalPages: 1
  };
  const normalizedTotalPages = Math.max(1, pagination.totalPages);
  const currentPage = Math.min(Math.max(1, pagination.page), normalizedTotalPages);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Recruiting Pipeline</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">招聘流程看板</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Pipeline 属于 Candidate Application。阶段移动必须由招聘负责人手动确认，不会自动淘汰、录用或评分。
          </p>
        </div>
        <Link
          href="/feishu/pipeline/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          新建招聘流程
        </Link>
      </header>

      <section className="space-y-3">
        <p className="text-sm font-medium text-slate-600">全部招聘流程阶段概览</p>
        <div className="grid gap-3 md:grid-cols-4">
          {applicationStages.map((stage) => (
            <div key={stage} className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium uppercase text-slate-500">{applicationStageLabels[stage]}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{result?.metrics[stage] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="搜索候选人、岗位或 owner"
          value={filters.search}
          onChange={(event) => setFilters({ search: event.target.value })}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.stage}
          onChange={(event) => setFilters({ stage: event.target.value as ApplicationStage | "" })}
        >
          <option value="">全部阶段</option>
          {applicationStages.map((stage) => (
            <option key={stage} value={stage}>
              {applicationStageLabels[stage]}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.status}
          onChange={(event) =>
            setFilters({
              status: event.target.value as typeof filters.status
            })
          }
        >
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
          <option value="all">全部</option>
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Owner"
          value={filters.owner}
          onChange={(event) => setFilters({ owner: event.target.value })}
        />
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          onClick={() =>
            setFilters({
              owner: "",
              search: "",
              stage: "",
              status: "open"
            })
          }
        >
          重置
        </button>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载 Pipeline" description="读取招聘流程和阶段指标。" />
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            {applicationStages.map((stage) => {
              const items = result?.applications.filter((application) => application.currentStage === stage) ?? [];

              return (
                <div key={stage} className="min-h-48 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-950">{applicationStageLabels[stage]}</h2>
                    <span className="text-xs text-slate-500">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.length > 0 ? (
                      items.map((application) => (
                        <Link
                          key={application.id}
                          href={`/feishu/pipeline/${application.id}`}
                          className="block rounded-md border border-slate-200 bg-white p-3 text-sm hover:border-slate-400"
                        >
                          <p className="font-semibold text-slate-950">{application.candidate.fullName}</p>
                          <p className="mt-1 text-slate-600">{application.jobProfile.jobTitle}</p>
                          <p className="mt-2 text-xs text-slate-500">Owner: {application.owner ?? "未填写"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            最近活动：{formatDateTime(application.latestActivityAt)}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                        当前筛选下暂无记录。
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
          <PipelinePagination
            currentPage={currentPage}
            isLoading={isLoading}
            onPageChange={(page) => setFilters({ page })}
            total={pagination.total}
            totalPages={normalizedTotalPages}
          />
        </>
      )}
    </div>
  );
}

export function PipelinePagination({
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
  const isPreviousDisabled = isLoading || normalizedCurrentPage <= 1;
  const isNextDisabled = isLoading || normalizedCurrentPage >= normalizedTotalPages || total === 0;

  return (
    <nav
      aria-label="Pipeline pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4"
    >
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}
