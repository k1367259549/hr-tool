"use client";

import React from "react";
import Link from "next/link";
import type { ResumeIntakeSource } from "@prisma/client";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useResumeList } from "@/features/resume-library/hooks/useResumeList";
import {
  formatDateTime,
  formatFileSize,
  resumeIntakeSourceLabels,
  resumeParsingStatusLabels
} from "@/features/resume-library/resumeLibraryLabels";
import type {
  ResumeFileType,
  ResumeLinkStatus,
  ResumeListItemDto,
  ResumeParsingStatus
} from "@/types/resumeLibrary";

export function ResumeLibraryPage(): JSX.Element {
  const { error, filters, isLoading, result, setFilters } = useResumeList();
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
          <p className="text-sm font-medium uppercase text-slate-500">Resume Library</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">简历库</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            独立管理 Resume Library 记录。上传只做文件解析和元数据保存，不会自动创建 Candidate、关联岗位或触发评估。
          </p>
        </div>
        <Link
          href="/feishu/resumes/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          上传简历
        </Link>
      </header>

      <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="搜索文件、候选人、岗位或来源"
          value={filters.search}
          onChange={(event) => setFilters({ search: event.target.value })}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.fileType}
          onChange={(event) => setFilters({ fileType: event.target.value as ResumeFileType | "" })}
        >
          <option value="">全部类型</option>
          <option value="PDF">PDF</option>
          <option value="DOCX">DOCX</option>
          <option value="TXT">TXT</option>
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.parsingStatus}
          onChange={(event) =>
            setFilters({ parsingStatus: event.target.value as ResumeParsingStatus | "" })
          }
        >
          <option value="">全部解析状态</option>
          <option value="PARSED">已解析</option>
          <option value="FAILED">解析失败</option>
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.intakeSource}
          onChange={(event) =>
            setFilters({ intakeSource: event.target.value as ResumeIntakeSource | "" })
          }
        >
          <option value="">全部入口</option>
          <option value="RESUME_LIBRARY">Resume Library</option>
          <option value="CANDIDATE_UNDERSTANDING">Candidate Understanding</option>
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filters.linkStatus}
          onChange={(event) => setFilters({ linkStatus: event.target.value as ResumeLinkStatus })}
        >
          <option value="all">全部关联状态</option>
          <option value="linked">已关联 Candidate</option>
          <option value="unlinked">未关联 Candidate</option>
        </select>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          onClick={() =>
            setFilters({
              fileType: "",
              intakeSource: "",
              linkStatus: "all",
              parsingStatus: "",
              search: ""
            })
          }
        >
          重置
        </button>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载简历库" description="读取 Resume Library 元数据和关联状态。" />
      ) : (
        <>
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {result && result.items.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {result.items.map((resume) => (
                  <ResumeListRow key={resume.id} resume={resume} />
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-600">
                暂无符合条件的简历。可以上传独立 Resume，或从 Candidate Understanding 流程产生解析记录。
              </div>
            )}
          </section>
          <ResumePagination
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

function ResumeListRow({ resume }: { resume: ResumeListItemDto }): JSX.Element {
  return (
    <Link href={`/feishu/resumes/${resume.id}`} className="block p-4 hover:bg-slate-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-slate-950">{resume.fileName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {resume.fileType} · {formatFileSize(resume.fileSize)} ·{" "}
            {resumeParsingStatusLabels[resume.parsingStatus] ?? resume.parsingStatus}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">{formatDateTime(resume.createdAt)}</div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-4">
        <MetaLine label="Candidate" value={resume.candidateName ?? "未关联"} />
        <MetaLine label="初始岗位" value={resume.jobProfileTitle ?? "无初始岗位"} />
        <MetaLine label="来源渠道" value={resume.candidateSource ?? "未填写"} />
        <MetaLine label="进入入口" value={resumeIntakeSourceLabels[resume.intakeSource]} />
      </div>
      {resume.duplicateCount > 0 ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          系统发现 {resume.duplicateCount} 份内容完全相同的简历，请人工检查。
        </p>
      ) : null}
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

export function ResumePagination({
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
