import type { CandidateStatus } from "@/types/candidate";

type CandidateStatusBadgeProps = {
  status: CandidateStatus;
};

const statusMeta: Record<CandidateStatus, { label: string; className: string }> = {
  ACTIVE: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "活跃"
  },
  ARCHIVED: {
    className: "border-slate-200 bg-slate-100 text-slate-600",
    label: "已归档"
  },
  TALENT_POOL: {
    className: "border-blue-200 bg-blue-50 text-blue-700",
    label: "人才池"
  }
};

export function CandidateStatusBadge({ status }: CandidateStatusBadgeProps): JSX.Element {
  const meta = statusMeta[status];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function getCandidateStatusLabel(status: CandidateStatus): string {
  return statusMeta[status].label;
}
