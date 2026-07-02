"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  applicationStageLabels,
  getNextApplicationStages,
  terminalApplicationStages
} from "@/features/pipeline/applicationStage";
import { useApplicationDetail } from "@/features/pipeline/hooks/useApplicationDetail";

type ApplicationDetailPageProps = {
  applicationId: string;
};

export function ApplicationDetailPage({ applicationId }: ApplicationDetailPageProps): JSX.Element {
  const { application, error, isLoading, isSaving, transitionStage, updateMetadata } =
    useApplicationDetail(applicationId);
  const [metadata, setMetadata] = useState({
    notes: "",
    owner: "",
    sourceChannel: ""
  });

  useEffect(() => {
    if (!application) {
      return;
    }

    setMetadata({
      notes: application.notes ?? "",
      owner: application.owner ?? "",
      sourceChannel: application.sourceChannel ?? ""
    });
  }, [application]);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase text-slate-500">Candidate Application</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">招聘流程详情</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          所有阶段变化都需要手动确认，并写入事件时间线。终态流程不会自动 reopen。
        </p>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载招聘流程" description="读取 Candidate、Job Profile 和阶段历史。" />
      ) : application ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <MetaItem label="当前阶段" value={applicationStageLabels[application.currentStage]} />
            <MetaItem label="候选人" value={application.candidate.fullName} />
            <MetaItem label="岗位" value={application.jobProfile.jobTitle} />
            <MetaItem label="关闭时间" value={application.closedAt ? formatDateTime(application.closedAt) : "进行中"} />
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">流程信息</h2>
                <p className="mt-1 text-sm text-slate-500">普通保存只能更新 owner、source 和 notes。</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/feishu/candidates/${application.candidateId}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  查看 Candidate
                </Link>
                <Link href="/feishu/pipeline" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  返回 Pipeline
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Owner"
                value={metadata.owner}
                onChange={(value) => setMetadata((current) => ({ ...current, owner: value }))}
              />
              <InputField
                label="Source"
                value={metadata.sourceChannel}
                onChange={(value) => setMetadata((current) => ({ ...current, sourceChannel: value }))}
              />
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Notes
                <textarea
                  className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={metadata.notes}
                  onChange={(event) => setMetadata((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>
            </div>
            <button
              type="button"
              className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={isSaving}
              onClick={() => void updateMetadata(metadata)}
            >
              保存流程信息
            </button>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">人工阶段移动</h2>
            {terminalApplicationStages.has(application.currentStage) ? (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                当前流程已关闭，不能继续移动阶段。本里程碑不支持 reopen。
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {getNextApplicationStages(application.currentStage).map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    disabled={isSaving}
                    onClick={() => {
                      const note = window.prompt(`确认移动到 ${applicationStageLabels[stage]}？可填写阶段备注。`);

                      if (note !== null) {
                        void transitionStage(stage, note);
                      }
                    }}
                  >
                    {applicationStageLabels[stage]}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">事件时间线</h2>
            <div className="mt-4 space-y-3">
              {application.events.length > 0 ? (
                application.events.map((event) => (
                  <div key={event.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-950">{event.eventType}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {event.fromStage ? applicationStageLabels[event.fromStage] : "开始"} →{" "}
                      {event.toStage ? applicationStageLabels[event.toStage] : "未指定"}
                    </p>
                    {event.note ? <p className="mt-1 text-slate-600">{event.note}</p> : null}
                    <p className="mt-1 text-xs text-slate-500">Actor: {event.actor ?? "未记录"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">暂无事件。</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function InputField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}): JSX.Element {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}
