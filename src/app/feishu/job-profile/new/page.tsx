"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { useToast } from "@/components/shared/ToastProvider";
import { WorkflowNavigationCard } from "@/components/shared/WorkflowNavigationCard";
import { JobUnderstandingForm } from "@/features/job-profile/components/JobUnderstandingForm";
import { JobUnderstandingReviewPanel } from "@/features/job-profile/components/JobUnderstandingReviewPanel";
import { useJobUnderstanding } from "@/features/job-profile/hooks/useJobUnderstanding";

export default function NewJobProfilePage(): JSX.Element {
  const workflow = useJobUnderstanding();
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
        title="新建岗位理解"
        description="粘贴 JD 和业务背景，让 AI 先帮助你理解岗位，再由 Recruiter 人工确认后保存岗位画像。"
      />

      <WorkflowNavigationCard
        currentWorkflow="Workflow-01 · Job Understanding"
        currentStatus={workflow.savedProfile ? "COMPLETED" : workflow.result ? "NEEDS_REVIEW" : "IN_PROGRESS"}
        previousWorkflow={{
          description: "从 AI Recruiter Workspace 查看今日整体进度。",
          href: "/feishu",
          label: "AI Recruiter Workspace"
        }}
        recommendedNextAction={{
          description: "使用已确认岗位画像上传简历并生成候选人理解。",
          href: "/feishu/candidate-understanding/new",
          label: "Start Candidate Understanding"
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

      {workflow.savedProfile ? (
        <SectionCard title="Workflow 已完成" description="岗位画像已保存，可作为后续候选人理解和筛选准备的上下文。">
          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <Info label="岗位" value={workflow.savedProfile.jobTitle} />
              <Info label="Workflow ID" value={workflow.savedProfile.workflowId} />
              <Info label="确认时间" value={formatDateTime(workflow.savedProfile.reviewedAt)} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/feishu"
                className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back To Workspace
              </Link>
              <Link
                href="/feishu/candidate-understanding/new"
                className="rounded-md bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start Candidate Understanding
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="岗位输入" description="JD 是必填项，其他信息可用于补足业务方真实要求。">
        <JobUnderstandingForm
          values={workflow.formValues}
          isGenerating={workflow.isGenerating}
          onChange={workflow.updateField}
          onGenerate={workflow.generate}
        />
      </SectionCard>

      {workflow.result && workflow.reviewedOutput ? (
        <SectionCard title="人工 Review" description="请检查、编辑、重新生成或取消。保存前必须由 Recruiter 明确确认。">
          <JobUnderstandingReviewPanel
            result={workflow.result}
            reviewedOutput={workflow.reviewedOutput}
            isGenerating={workflow.isGenerating}
            isSaving={workflow.isSaving}
            onChange={workflow.updateReviewedField}
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
