"use client";

import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { CandidateDetail } from "@/features/candidate-crm/components/CandidateDetail";
import { useCandidateDetail } from "@/features/candidate-crm/hooks/useCandidateDetail";
import { useCandidateResumes } from "@/features/candidate-crm/hooks/useCandidateResumes";
import { useCandidateApplications } from "@/features/pipeline/hooks/useCandidateApplications";

type CandidateDetailPageProps = {
  candidateId: string;
};

export function CandidateDetailPage({ candidateId }: CandidateDetailPageProps): JSX.Element {
  const {
    archiveCandidate,
    candidate,
    error,
    isLoading,
    isSaving,
    reloadCandidate,
    restoreCandidate,
    updateCandidate
  } = useCandidateDetail(candidateId);
  const resumeLinkState = useCandidateResumes(candidateId, reloadCandidate);
  const applicationState = useCandidateApplications(candidateId);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-medium uppercase text-slate-500">Candidate CRM</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">候选人详情</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          查看和维护候选人资料、关联简历数量与审计时间线。
        </p>
      </header>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? (
        <LoadingState title="正在加载候选人" description="读取候选人详情与审计记录。" />
      ) : candidate ? (
        <CandidateDetail
          candidate={candidate}
          isSaving={isSaving}
          onArchive={archiveCandidate}
          onRestore={restoreCandidate}
          onUpdate={updateCandidate}
          applicationState={applicationState}
          resumeLinkState={resumeLinkState}
        />
      ) : null}
    </div>
  );
}
