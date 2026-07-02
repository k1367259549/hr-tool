import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import type {
  AvailableResumeListDto,
  SafeCandidateResumeDto
} from "@/types/candidateResumeLink";

type CandidateResumeLinkPanelProps = {
  availableError: string | null;
  availableFilters: {
    search: string;
    fileType: string;
    page: number;
    pageSize: number;
  };
  availableResult: AvailableResumeListDto | null;
  candidateStatus: string;
  conflictMessage: string | null;
  isLoadingAvailable: boolean;
  isLoadingLinked: boolean;
  isMutating: boolean;
  linkedError: string | null;
  linkedResumes: SafeCandidateResumeDto[];
  onFilterChange: (filters: {
    search: string;
    fileType: string;
    page: number;
    pageSize: number;
  }) => void;
  onLink: (resumeId: string) => Promise<void>;
  onUnlink: (resumeId: string) => Promise<void>;
};

export function CandidateResumeLinkPanel({
  availableError,
  availableFilters,
  availableResult,
  candidateStatus,
  conflictMessage,
  isLoadingAvailable,
  isLoadingLinked,
  isMutating,
  linkedError,
  linkedResumes,
  onFilterChange,
  onLink,
  onUnlink
}: CandidateResumeLinkPanelProps): JSX.Element {
  const isArchived = candidateStatus === "ARCHIVED";
  const availableResumes = availableResult?.resumes ?? [];
  const pagination = availableResult?.pagination;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">关联简历</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            仅支持招聘人员人工搜索、选择并确认关联。不会自动匹配、创建候选人或转移简历。
          </p>
        </div>
        {isArchived ? (
          <span className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            已归档候选人不能新增关联
          </span>
        ) : null}
      </div>

      {conflictMessage ? (
        <ErrorState title="关联冲突" message={conflictMessage} className="mt-4" />
      ) : null}
      {linkedError ? <ErrorState title="简历关联操作失败" message={linkedError} className="mt-4" /> : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-950">已关联简历</h3>
          {isLoadingLinked ? (
            <LoadingState title="正在加载关联简历" className="mt-4" />
          ) : linkedResumes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {linkedResumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume}>
                  <button
                    type="button"
                    className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
                    disabled={isMutating}
                    onClick={() => {
                      if (
                        window.confirm(
                          "确认解除关联？解除关联不会删除 Resume，也不会删除 Candidate。"
                        )
                      ) {
                        void onUnlink(resume.id);
                      }
                    }}
                  >
                    解除关联
                  </button>
                </ResumeCard>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4 min-h-40"
              title="暂无关联简历"
              description="候选人可以暂时没有 Resume。需要时请在右侧人工搜索并确认关联。"
            />
          )}
        </div>

        <div className="rounded-md border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">搜索未关联 Resume</h3>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                placeholder="搜索文件名"
                value={availableFilters.search}
                onChange={(event) =>
                  onFilterChange({
                    ...availableFilters,
                    page: 1,
                    search: event.target.value
                  })
                }
              />
              <select
                className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                value={availableFilters.fileType}
                onChange={(event) =>
                  onFilterChange({
                    ...availableFilters,
                    fileType: event.target.value,
                    page: 1
                  })
                }
              >
                <option value="">全部类型</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="TXT">TXT</option>
              </select>
            </div>
          </div>

          {availableError ? (
            <ErrorState title="可关联简历加载失败" message={availableError} className="mt-4" />
          ) : null}

          {isLoadingAvailable ? (
            <LoadingState title="正在搜索简历" className="mt-4" />
          ) : availableResumes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {availableResumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume}>
                  <button
                    type="button"
                    className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={isArchived || isMutating}
                    onClick={() => {
                      if (window.confirm(`确认将 Resume「${resume.originalName}」关联到该候选人？`)) {
                        void onLink(resume.id);
                      }
                    }}
                  >
                    关联
                  </button>
                </ResumeCard>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4 min-h-40"
              title="暂无可关联 Resume"
              description="当前没有未关联的 Resume，或筛选条件没有匹配结果。"
            />
          )}

          {pagination ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>
                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 份
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                  disabled={availableFilters.page <= 1}
                  onClick={() =>
                    onFilterChange({
                      ...availableFilters,
                      page: Math.max(1, availableFilters.page - 1)
                    })
                  }
                >
                  上一页
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                  disabled={availableFilters.page >= pagination.totalPages}
                  onClick={() =>
                    onFilterChange({
                      ...availableFilters,
                      page: availableFilters.page + 1
                    })
                  }
                >
                  下一页
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type ResumeCardProps = {
  children: JSX.Element;
  resume: SafeCandidateResumeDto;
};

function ResumeCard({ children, resume }: ResumeCardProps): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="break-all text-sm font-semibold text-slate-950">{resume.originalName}</p>
          <p className="text-xs text-slate-500">
            {resume.fileType} · {formatFileSize(resume.fileSize)} · 上传 {formatDateTime(resume.createdAt)}
          </p>
          <p className="text-xs text-slate-500">解析状态：{resume.parsingStatus}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}
