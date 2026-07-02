import Link from "next/link";
import { CandidateForm } from "@/features/candidate-crm/components/CandidateForm";
import { CandidateStatusBadge } from "@/features/candidate-crm/components/CandidateStatusBadge";
import type { CandidateDto, CandidateUpdateInput } from "@/types/candidate";

type CandidateDetailProps = {
  candidate: CandidateDto;
  isSaving: boolean;
  onArchive: () => Promise<void>;
  onRestore: () => Promise<void>;
  onUpdate: (input: CandidateUpdateInput) => Promise<void>;
};

export function CandidateDetail({
  candidate,
  isSaving,
  onArchive,
  onRestore,
  onUpdate
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
