import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { CandidateStatusBadge } from "@/features/candidate-crm/components/CandidateStatusBadge";
import type { CandidateListItemDto } from "@/types/candidate";

type CandidateListProps = {
  candidates: CandidateListItemDto[];
};

export function CandidateList({ candidates }: CandidateListProps): JSX.Element {
  if (candidates.length === 0) {
    return (
      <EmptyState
        title="暂无候选人"
        description="创建第一位候选人后，这里会展示候选人来源、状态、负责人和最近活动。"
        action={
          <Link
            href="/feishu/candidates/new"
            className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            新建候选人
          </Link>
        }
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">候选人</th>
              <th className="px-4 py-3">公司 / 职位</th>
              <th className="px-4 py-3">目标岗位</th>
              <th className="px-4 py-3">来源</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">标签</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">最近活动</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/feishu/candidates/${candidate.id}`} className="font-semibold text-slate-950">
                    {candidate.fullName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {candidate.maskedEmail ?? "无邮箱"} · {candidate.maskedPhone ?? "无手机号"}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <p>{candidate.currentCompany ?? "未填写公司"}</p>
                  <p className="text-xs text-slate-500">{candidate.currentTitle ?? "未填写职位"}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {candidate.targetRoles.length > 0 ? candidate.targetRoles.join("、") : "未填写"}
                </td>
                <td className="px-4 py-3 text-slate-700">{candidate.sourceChannel ?? "未填写"}</td>
                <td className="px-4 py-3 text-slate-700">{candidate.owner ?? "未分配"}</td>
                <td className="px-4 py-3">
                  <div className="flex max-w-56 flex-wrap gap-1">
                    {candidate.tags.length > 0 ? (
                      candidate.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">无标签</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CandidateStatusBadge status={candidate.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <p>{formatDate(candidate.latestActivityAt)}</p>
                  <p className="text-xs text-slate-500">创建 {formatDate(candidate.createdAt)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
