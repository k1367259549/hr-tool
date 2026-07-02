import Link from "next/link";
import { applicationStageLabels } from "@/features/pipeline/applicationStage";
import type { useCandidateApplications } from "@/features/pipeline/hooks/useCandidateApplications";

type CandidateApplicationsPanelProps = {
  candidateId: string;
  applicationState: ReturnType<typeof useCandidateApplications>;
};

export function CandidateApplicationsPanel({
  applicationState,
  candidateId
}: CandidateApplicationsPanelProps): JSX.Element {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">招聘流程</h2>
          <p className="mt-1 text-sm text-slate-500">
            Candidate 可同时参与多个岗位；阶段记录保存在 Candidate Application 中。
          </p>
        </div>
        <Link
          href={`/feishu/pipeline/new?candidateId=${encodeURIComponent(candidateId)}`}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white"
        >
          创建招聘流程
        </Link>
      </div>
      {applicationState.error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {applicationState.error}
        </p>
      ) : null}
      {applicationState.isLoading ? (
        <p className="text-sm text-slate-500">正在加载招聘流程...</p>
      ) : applicationState.applications.length > 0 ? (
        <div className="space-y-3">
          {applicationState.applications.map((application) => (
            <Link
              key={application.id}
              href={`/feishu/pipeline/${application.id}`}
              className="block rounded-md border border-slate-200 p-3 text-sm hover:border-slate-400"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-950">{application.jobProfile.jobTitle}</p>
                <p className="text-xs text-slate-500">
                  {applicationStageLabels[application.currentStage]}
                </p>
              </div>
              <p className="mt-1 text-slate-500">Owner: {application.owner ?? "未填写"}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
          暂无招聘流程。可以手动为该候选人创建岗位申请。
        </p>
      )}
    </section>
  );
}
