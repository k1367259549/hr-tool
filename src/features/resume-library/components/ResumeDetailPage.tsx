"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useResumeDetail } from "@/features/resume-library/hooks/useResumeDetail";
import {
  formatDateTime,
  formatFileSize,
  resumeIntakeSourceLabels,
  resumeParsingStatusLabels
} from "@/features/resume-library/resumeLibraryLabels";

export function ResumeDetailPage({ resumeId }: { resumeId: string }): JSX.Element {
  const { error, isLoading, isSaving, resume, updateMetadata } = useResumeDetail(resumeId);
  const [metadata, setMetadata] = useState({
    candidateSource: "",
    notes: ""
  });

  useEffect(() => {
    if (!resume) {
      return;
    }

    setMetadata({
      candidateSource: resume.candidateSource ?? "",
      notes: resume.notes ?? ""
    });
  }, [resume]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Resume Library</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">简历详情</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Resume 与 Candidate、Job Profile 分离维护。多岗位人工评估结果将在 MILESTONE-07 接入。
          </p>
        </div>
        <Link href="/feishu/resumes" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
          返回简历库
        </Link>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载简历详情" description="读取解析状态、关联摘要和重复提示。" />
      ) : resume ? (
        <>
          {resume.duplicateSignal.hasDuplicates ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              系统发现 {resume.duplicateSignal.duplicateCount} 份内容完全相同的简历，请人工检查。系统不会自动合并、
              删除或复制关联关系。
            </section>
          ) : null}

          <section className="grid gap-3 md:grid-cols-4">
            <MetaItem label="文件类型" value={resume.fileType} />
            <MetaItem label="文件大小" value={formatFileSize(resume.fileSize)} />
            <MetaItem
              label="解析状态"
              value={resumeParsingStatusLabels[resume.parsingStatus] ?? resume.parsingStatus}
            />
            <MetaItem label="进入入口" value={resumeIntakeSourceLabels[resume.intakeSource]} />
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">文件与关联信息</h2>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <MetaLine label="文件名" value={resume.fileName} />
              <MetaLine label="上传时间" value={formatDateTime(resume.createdAt)} />
              <MetaLine label="更新时间" value={formatDateTime(resume.updatedAt)} />
              <MetaLine label="内容哈希" value={resume.hasContentHash ? "已记录，用于重复提示" : "未记录"} />
              <MetaLine
                label="关联 Candidate"
                value={resume.candidate ? resume.candidate.fullName : "未关联"}
              />
              <MetaLine
                label="初始岗位上下文"
                value={resume.jobProfile ? resume.jobProfile.jobTitle : "无初始岗位"}
              />
            </div>
            {resume.candidate ? (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Candidate 详情页可以人工解除或新增简历关联。本页不会自动变更 Candidate。
              </p>
            ) : null}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">来源与备注</h2>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-medium text-slate-700">
                候选人来源
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={metadata.candidateSource}
                  onChange={(event) =>
                    setMetadata((current) => ({
                      ...current,
                      candidateSource: event.target.value
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                备注
                <textarea
                  className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={metadata.notes}
                  onChange={(event) =>
                    setMetadata((current) => ({
                      ...current,
                      notes: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={isSaving}
              onClick={() => void updateMetadata(metadata)}
            >
              保存来源和备注
            </button>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">解析结果</h2>
              {resume.parsingError ? (
                <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {resume.parsingError}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <MetaLine label="结构块" value={String(resume.structureChunkCount)} />
                <MetaLine label="语义块" value={String(resume.semanticChunkCount)} />
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">重复记录</h2>
              {resume.possibleDuplicates.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {resume.possibleDuplicates.map((duplicate) => (
                    <Link
                      key={duplicate.id}
                      href={`/feishu/resumes/${duplicate.id}`}
                      className="block rounded-md border border-slate-200 p-3 text-sm hover:border-slate-400"
                    >
                      <p className="break-all font-medium text-slate-950">{duplicate.fileName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {duplicate.candidateName ?? "未关联 Candidate"} · {formatDateTime(duplicate.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">暂无完全相同文件。</p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">Parsed Text</h2>
            {resume.parsedText ? (
              <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                {resume.parsedText}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-slate-500">当前记录没有可展示的解析文本。</p>
            )}
          </section>
        </>
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
