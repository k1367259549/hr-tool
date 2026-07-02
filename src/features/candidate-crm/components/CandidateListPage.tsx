"use client";

import Link from "next/link";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { CandidateList } from "@/features/candidate-crm/components/CandidateList";
import { CandidateListFilters } from "@/features/candidate-crm/components/CandidateListFilters";
import { CandidateMetrics } from "@/features/candidate-crm/components/CandidateMetrics";
import { useCandidateList } from "@/features/candidate-crm/hooks/useCandidateList";

export function CandidateListPage(): JSX.Element {
  const { data, error, filters, isLoading, page, reload, setFilters, setPage } = useCandidateList();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Candidate CRM</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">候选人管理</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            管理候选人基础信息、来源、负责人、人才池状态和审计记录。本阶段不自动关联简历、不接入飞书 API。
          </p>
        </div>
        <Link
          href="/feishu/candidates/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          新建候选人
        </Link>
      </header>

      {error ? <ErrorState message={error} actionLabel="重新加载" onAction={() => void reload()} /> : null}

      {data ? <CandidateMetrics counts={data.counts} /> : null}

      <CandidateListFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <LoadingState title="正在加载候选人" description="读取候选人列表和动态指标。" />
      ) : data ? (
        <>
          <CandidateList candidates={data.candidates} />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              第 {data.pagination.page} / {data.pagination.totalPages} 页，共 {data.pagination.total} 位候选人
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
