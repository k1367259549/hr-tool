import Link from "next/link";
import { useState } from "react";
import { CandidateForm } from "@/features/candidate-crm/components/CandidateForm";
import { CandidateResumeLinkPanel } from "@/features/candidate-crm/components/CandidateResumeLinkPanel";
import { CandidateStatusBadge } from "@/features/candidate-crm/components/CandidateStatusBadge";
import type { useCandidateResumes } from "@/features/candidate-crm/hooks/useCandidateResumes";
import { CandidateApplicationsPanel } from "@/features/pipeline/components/CandidateApplicationsPanel";
import type { useCandidateApplications } from "@/features/pipeline/hooks/useCandidateApplications";
import type { CandidateDto, CandidateUpdateInput } from "@/types/candidate";

type CandidateDetailProps = {
  candidate: CandidateDto;
  isSaving: boolean;
  onArchive: () => Promise<void>;
  onRestore: () => Promise<void>;
  onUpdate: (input: CandidateUpdateInput) => Promise<void>;
  applicationState: ReturnType<typeof useCandidateApplications>;
  resumeLinkState: ReturnType<typeof useCandidateResumes>;
};

type ScheduleInterviewState = {
  interviewerEmail: string;
  startTime: string;
  endTime: string;
  round: string;
  mode: string;
};

type ScheduleInterviewResponse = {
  candidateId: string;
  calendarEventId: string;
  bitableRecordId: string;
  syncStatus: "SUCCESS";
  scheduleSyncStatus: "BITABLE_SYNCED";
  syncId: string;
  deduplicated: boolean;
};

type ScheduleInterviewPartialFailure = {
  candidateId: string;
  calendarEventId: string;
  bitableRecordId: string;
  code: "FEISHU_PARTIAL_SYNC_FAILED";
  message: string;
  syncId: string;
  syncStatus: "BITABLE_SYNC_FAILED";
  success: false;
  deduplicated: boolean;
};

type RetrySyncResponse = {
  syncId: string;
  candidateId: string;
  calendarEventId: string;
  bitableRecordId: string;
  syncStatus: "BITABLE_SYNCED";
  retryCount: number;
};

const initialScheduleInterviewState: ScheduleInterviewState = {
  endTime: "",
  interviewerEmail: "",
  mode: "视频面试",
  round: "一面",
  startTime: ""
};

export function CandidateDetail({
  candidate,
  isSaving,
  onArchive,
  onRestore,
  onUpdate,
  applicationState,
  resumeLinkState
}: CandidateDetailProps): JSX.Element {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        当前版本尚未实现多用户权限，仅适用于受控的内部环境。详情页会显示完整联系方式。
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        <MetaItem label="Candidate ID" value={candidate.id} />
        <MetaItem label="状态" value={<CandidateStatusBadge status={candidate.status} />} />
        <MetaItem label="关联 Resume" value={`${candidate.resumeCount}`} />
        <MetaItem label="创建时间" value={formatDateTime(candidate.createdAt)} />
        <MetaItem label="最近活动" value={formatDateTime(candidate.latestActivityAt)} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">候选人资料</h2>
            <p className="mt-1 text-sm text-slate-500">编辑基础信息不会触发 AI、Pipeline 或飞书同步。</p>
          </div>
          <div className="flex gap-2">
            <Link href="/feishu/candidates" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              返回列表
            </Link>
            {candidate.status === "ARCHIVED" ? (
              <button
                type="button"
                className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                disabled={isSaving}
                onClick={() => void onRestore()}
              >
                恢复
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                disabled={isSaving}
                onClick={() => {
                  if (window.confirm("确认归档该候选人？归档不会物理删除数据。")) {
                    void onArchive();
                  }
                }}
              >
                归档
              </button>
            )}
          </div>
        </div>
        <CandidateForm
          candidate={candidate}
          disabled={isSaving}
          submitLabel="保存修改"
          onSubmit={(input) => onUpdate(input as CandidateUpdateInput)}
        />
      </section>

      <CandidateResumeLinkPanel
        availableError={resumeLinkState.availableError}
        availableFilters={resumeLinkState.availableFilters}
        availableResult={resumeLinkState.availableResult}
        candidateStatus={candidate.status}
        conflictMessage={resumeLinkState.conflictMessage}
        isLoadingAvailable={resumeLinkState.isLoadingAvailable}
        isLoadingLinked={resumeLinkState.isLoadingLinked}
        isMutating={resumeLinkState.isMutating}
        linkedError={resumeLinkState.linkedError}
        linkedResumes={resumeLinkState.candidateResumes}
        onFilterChange={resumeLinkState.setAvailableFilters}
        onLink={resumeLinkState.linkResume}
        onUnlink={resumeLinkState.unlinkResume}
      />

      <CandidateApplicationsPanel candidateId={candidate.id} applicationState={applicationState} />

      <ScheduleInterviewPanel candidate={candidate} />

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">审计时间线</h2>
        <div className="mt-4 space-y-3">
          {candidate.audits.length > 0 ? (
            candidate.audits.map((audit) => (
              <div key={audit.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-950">{audit.action}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(audit.createdAt)}</p>
                </div>
                <p className="mt-1 text-slate-500">Actor: {audit.actor}</p>
                {audit.note ? <p className="mt-1 text-slate-600">{audit.note}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">暂无审计记录。</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ScheduleInterviewPanel({ candidate }: { candidate: CandidateDto }): JSX.Element {
  const [form, setForm] = useState<ScheduleInterviewState>(initialScheduleInterviewState);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createScheduleIdempotencyKey());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleInterviewResponse | null>(null);
  const [partialFailure, setPartialFailure] =
    useState<ScheduleInterviewPartialFailure | null>(null);
  const [retryResult, setRetryResult] = useState<RetrySyncResponse | null>(null);

  async function submitSchedule(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setResult(null);
    setPartialFailure(null);
    setRetryResult(null);

    if (
      !window.confirm(
        "确认由 HR 手动触发飞书日程创建和多维表格状态更新？不会自动通知候选人。"
      )
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/interviews/schedule", {
        body: JSON.stringify({
          candidateId: candidate.id,
          idempotencyKey,
          ...form
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const json = (await response.json()) as {
        success: boolean;
        data: ScheduleInterviewResponse | ScheduleInterviewPartialFailure | null;
        error: { code: string; message: string } | null;
      };

      if (
        !json.success &&
        json.error?.code === "FEISHU_PARTIAL_SYNC_FAILED" &&
        json.data
      ) {
        setPartialFailure(json.data as ScheduleInterviewPartialFailure);
        return;
      }

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "安排面试失败。");
      }

      setResult(json.data as ScheduleInterviewResponse);
      setIdempotencyKey(createScheduleIdempotencyKey());
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : "安排面试失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function retryBitableSync(): Promise<void> {
    if (!partialFailure) {
      return;
    }

    if (!window.confirm("确认只重试飞书表格同步？不会重复创建面试日程。")) {
      return;
    }

    setError(null);
    setRetryResult(null);
    setIsRetryingSync(true);

    try {
      const response = await fetch("/api/interviews/schedule/retry-sync", {
        body: JSON.stringify({
          syncId: partialFailure.syncId
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const json = (await response.json()) as {
        success: boolean;
        data: RetrySyncResponse | null;
        error: { code: string; message: string } | null;
      };

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "飞书表格重试同步失败。");
      }

      setRetryResult(json.data);
      setResult({
        bitableRecordId: json.data.bitableRecordId,
        calendarEventId: json.data.calendarEventId,
        candidateId: json.data.candidateId,
        deduplicated: false,
        scheduleSyncStatus: "BITABLE_SYNCED",
        syncId: json.data.syncId,
        syncStatus: "SUCCESS"
      });
      setPartialFailure(null);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "飞书表格重试同步失败。");
    } finally {
      setIsRetryingSync(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">安排面试</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            仅在 HR 人工确认后调用飞书开放平台自建应用 API：先查询面试官忙闲，
            无冲突时创建日历日程并更新多维表格状态。不会自动拒绝候选人，也不会自动给候选人发消息。
          </p>
        </div>
        <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          人工确认触发
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ScheduleField
          label="面试官邮箱"
          value={form.interviewerEmail}
          type="email"
          onChange={(value) => setForm((current) => ({ ...current, interviewerEmail: value }))}
        />
        <ScheduleField
          label="面试轮次"
          value={form.round}
          onChange={(value) => setForm((current) => ({ ...current, round: value }))}
        />
        <ScheduleField
          label="开始时间"
          value={form.startTime}
          type="datetime-local"
          onChange={(value) => setForm((current) => ({ ...current, startTime: value }))}
        />
        <ScheduleField
          label="结束时间"
          value={form.endTime}
          type="datetime-local"
          onChange={(value) => setForm((current) => ({ ...current, endTime: value }))}
        />
        <ScheduleField
          label="面试形式"
          value={form.mode}
          onChange={(value) => setForm((current) => ({ ...current, mode: value }))}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          面试已安排。飞书日程 ID：{result.calendarEventId}
        </div>
      ) : null}

      {partialFailure ? (
        <div className="mt-4 space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p>面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。</p>
          <p className="break-all">飞书日程 ID：{partialFailure.calendarEventId}</p>
          <button
            type="button"
            className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-800 disabled:opacity-50"
            disabled={isRetryingSync}
            onClick={() => void retryBitableSync()}
          >
            {isRetryingSync ? "正在重试同步..." : "重试同步表格"}
          </button>
        </div>
      ) : null}

      {retryResult ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          飞书表格已重新同步。同步记录 ID：{retryResult.syncId}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={isSubmitting}
          onClick={() => void submitSchedule()}
        >
          {isSubmitting ? "正在安排..." : "确认安排面试"}
        </button>
        <p className="text-xs leading-5 text-slate-500">
          App Secret 只由后端环境变量读取，前端不会接触飞书密钥。
        </p>
      </div>
    </section>
  );
}

function ScheduleField({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}): JSX.Element {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type MetaItemProps = {
  label: string;
  value: string | JSX.Element;
};

function MetaItem({ label, value }: MetaItemProps): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <div className="mt-2 break-all text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function createScheduleIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `schedule:${crypto.randomUUID()}`;
  }

  return `schedule:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}
