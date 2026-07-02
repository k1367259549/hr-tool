"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { useToast } from "@/components/shared/ToastProvider";
import { WorkflowNavigationCard } from "@/components/shared/WorkflowNavigationCard";
import { CandidateUnderstandingForm } from "@/features/candidate-understanding/components/CandidateUnderstandingForm";
import { CandidateUnderstandingReviewPanel } from "@/features/candidate-understanding/components/CandidateUnderstandingReviewPanel";
import { useCandidateUnderstanding } from "@/features/candidate-understanding/hooks/useCandidateUnderstanding";

export default function NewCandidateUnderstandingPage(): JSX.Element {
  const workflow = useCandidateUnderstanding();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = workflow;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="新建候选人理解"
        description="选择已确认岗位画像，上传简历，生成可人工 Review 的候选人洞察。"
      />

      <WorkflowNavigationCard
        currentWorkflow="Workflow-02 · Candidate Understanding"
        currentStatus={workflow.savedInsight ? "COMPLETED" : workflow.result ? "NEEDS_REVIEW" : "IN_PROGRESS"}
        previousWorkflow={{
          description: "先确认岗位理解，再围绕岗位理解候选人。",
          href: "/feishu/job-profile/new",
          label: "Job Understanding"
        }}
        recommendedNextAction={{
          description: "基于已确认岗位画像和候选人洞察准备电话初筛与面试。",
          href: "/feishu/recruit-together",
          label: "Start Recruit Together"
        }}
      />

      {workflow.errorMessage ? (
        <ErrorState
          title="Workflow 无法继续"
          message={workflow.errorMessage}
          actionLabel="关闭"
          onAction={workflow.dismissError}
        />
      ) : null}

      {workflow.savedInsight ? (
        <SectionCard title="Workflow 已完成" description="候选人洞察已由 Recruiter 人工确认并保存。">
          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <Info label="Workflow ID" value={workflow.savedInsight.workflowId} />
              <Info label="Resume ID" value={workflow.savedInsight.resumeId} />
              <Info label="确认时间" value={formatDateTime(workflow.savedInsight.reviewedAt)} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/feishu"
                className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back To Workspace
              </Link>
              <Link
                href="/feishu/recruit-together"
                className="rounded-md bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start Recruit Together
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {workflow.jobProfiles.length === 0 && !workflow.isLoadingProfiles ? (
        <EmptyState
          title="暂无已确认岗位画像"
          description="请先在岗位理解 Workflow 中保存一个 Job Profile，再生成候选人理解。"
        />
      ) : null}

      <SectionCard title="候选人输入" description="简历会先被解析并切分为结构 Chunk 和语义 Chunk，再进入 AI 生成。">
        <CandidateUnderstandingForm
          values={workflow.formValues}
          jobProfiles={workflow.jobProfiles}
          isLoadingProfiles={workflow.isLoadingProfiles}
          isGenerating={workflow.isGenerating}
          onChange={workflow.updateField}
          onSelectFile={workflow.selectFile}
          onGenerate={workflow.generate}
        />
      </SectionCard>

      {workflow.result && workflow.reviewedOutput ? (
        <SectionCard title="人工 Review" description="请检查、编辑、重新生成或拒绝。保存前必须由 Recruiter 明确确认。">
          <CandidateUnderstandingReviewPanel
            result={workflow.result}
            reviewedOutput={workflow.reviewedOutput}
            isGenerating={workflow.isGenerating}
            isSaving={workflow.isSaving}
            onSummaryChange={workflow.updateSummaryField}
            onInsightListChange={workflow.updateInsightList}
            onOutputListChange={workflow.updateOutputList}
            onEvidenceChange={workflow.updateEvidence}
            onRegenerate={workflow.regenerate}
            onCancel={workflow.cancelReview}
            onSave={workflow.save}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-950">{value}</p>
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "尚未确认";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
