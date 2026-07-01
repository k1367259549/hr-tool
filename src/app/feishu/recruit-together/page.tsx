"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { FormField } from "@/components/shared/FormField";
import { SectionCard } from "@/components/shared/SectionCard";
import { useToast } from "@/components/shared/ToastProvider";
import { WorkflowNavigationCard } from "@/components/shared/WorkflowNavigationCard";
import { useRecruitTogether } from "@/features/recruit-together/hooks/useRecruitTogether";
import type {
  InterviewNotes,
  InterviewPreparationOutput,
  PhoneNotes,
  PhoneScreenPreparationOutput,
  RecruiterSummaryOutput
} from "@/types/recruitTogether";
import { parseMultilineList } from "@/utils/textList";

const phonePreparationFields: Array<{
  field: Exclude<keyof PhoneScreenPreparationOutput, "suggestedOpening">;
  label: string;
}> = [
  { field: "conversationGoals", label: "沟通目标" },
  { field: "keyVerificationQuestions", label: "关键核实问题" },
  { field: "riskVerificationQuestions", label: "风险核实问题" },
  { field: "informationToConfirm", label: "待确认信息" },
  { field: "conversationChecklist", label: "沟通清单" },
  { field: "thingsToAvoid", label: "避免事项" }
];

const interviewPreparationFields: Array<{
  field: keyof InterviewPreparationOutput;
  label: string;
}> = [
  { field: "interviewFocus", label: "面试关注点" },
  { field: "suggestedQuestions", label: "建议问题" },
  { field: "evidenceToVerify", label: "待验证证据" },
  { field: "missingInformation", label: "缺失信息" },
  { field: "highPriorityTopics", label: "高优先级话题" },
  { field: "possibleFollowUpQuestions", label: "可能追问" }
];

const recruiterSummaryFields: Array<{
  field: Exclude<keyof RecruiterSummaryOutput, "recruiterNotesSummary">;
  label: string;
}> = [
  { field: "candidateTimeline", label: "候选人时间线" },
  { field: "confirmedFacts", label: "已确认事实" },
  { field: "unconfirmedFacts", label: "未确认事实" },
  { field: "suggestedNextRecruiterActions", label: "建议 Recruiter 下一步" },
  { field: "openQuestions", label: "开放问题" }
];

export default function RecruitTogetherPage(): JSX.Element {
  const workflow = useRecruitTogether();
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
        title="Recruit Together"
        description="让 AI 在电话初筛、面试准备和招聘总结中作为 Recruiter Copilot，但所有内容都由 Recruiter 人工确认。"
      />

      <WorkflowNavigationCard
        currentWorkflow="Workflow-03 · Recruit Together"
        currentStatus={getWorkflowStatus(workflow)}
        previousWorkflow={{
          description: "先生成并保存候选人洞察，再进入协作准备。",
          href: "/feishu/candidate-understanding/new",
          label: "Candidate Understanding"
        }}
        recommendedNextAction={{
          description: "完成电话和面试协作记录后，汇总今日招聘工作。",
          href: "/feishu/daily-workspace",
          label: "Generate Daily Workspace"
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

      {workflow.savedWorkflow ? (
        <SectionCard title="Workflow 已完成" description="招聘协作记录已保存，包含人工笔记和已确认的 AI 协作输出。">
          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <Info label="Workflow ID" value={workflow.savedWorkflow.workflowId} />
              <Info label="Provider" value={workflow.savedWorkflow.aiProvider} />
              <Info label="保存时间" value={formatDateTime(workflow.savedWorkflow.createdAt)} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/feishu"
                className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back To Workspace
              </Link>
              <Link
                href="/feishu/daily-workspace"
                className="rounded-md bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Generate Daily Workspace
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {!workflow.isLoading &&
      (workflow.jobProfiles.length === 0 || workflow.candidateInsights.length === 0) ? (
        <EmptyState
          title="需要先完成前置 Workflow"
          description="请先保存 Job Profile 和 Candidate Insight，再进入 Recruit Together。"
        />
      ) : null}

      <SectionCard title="选择上下文" description="Recruit Together 必须基于已确认的岗位画像和候选人洞察。">
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField id="recruit-job-profile" label="Reviewed Job Profile" required>
            <select
              id="recruit-job-profile"
              value={workflow.formValues.jobProfileId}
              onChange={(event) => workflow.updateField("jobProfileId", event.target.value)}
              disabled={workflow.isLoading || workflow.busyStep !== null}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workflow.jobProfiles.length === 0 ? (
                <option value="">暂无岗位画像</option>
              ) : (
                workflow.jobProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.jobTitle}
                  </option>
                ))
              )}
            </select>
          </FormField>

          <FormField id="recruit-candidate-insight" label="Reviewed Candidate Insight" required>
            <select
              id="recruit-candidate-insight"
              value={workflow.formValues.candidateInsightId}
              onChange={(event) => workflow.updateField("candidateInsightId", event.target.value)}
              disabled={workflow.isLoading || workflow.busyStep !== null}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workflow.filteredCandidateInsights.length === 0 ? (
                <option value="">暂无候选人洞察</option>
              ) : (
                workflow.filteredCandidateInsights.map((insight) => (
                  <option key={insight.id} value={insight.id}>
                    {insight.title}
                  </option>
                ))
              )}
            </select>
          </FormField>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => void workflow.generatePhonePreparation()}
            disabled={workflow.busyStep !== null || workflow.filteredCandidateInsights.length === 0}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {workflow.busyStep === "phone" ? "正在生成..." : "生成电话初筛准备"}
          </button>
        </div>
      </SectionCard>

      {workflow.reviewedPhonePreparation ? (
        <SectionCard title="电话初筛准备" description="AI 提供准备草稿，Recruiter 可编辑后再进入电话记录。">
          <div className="space-y-4">
            <FormField id="phone-opening" label="建议开场">
              <textarea
                id="phone-opening"
                value={workflow.reviewedPhonePreparation.suggestedOpening}
                onChange={(event) =>
                  workflow.updatePhonePreparation("suggestedOpening", event.target.value)
                }
                rows={4}
                className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </FormField>

            <div className="grid gap-4 lg:grid-cols-2">
              {phonePreparationFields.map((item) => (
                <ListField
                  key={item.field}
                  id={`phone-${item.field}`}
                  label={item.label}
                  value={workflow.reviewedPhonePreparation?.[item.field] ?? []}
                  onChange={(value) => workflow.updatePhonePreparation(item.field, value)}
                />
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}

      {workflow.reviewedPhonePreparation ? (
        <SectionCard title="电话沟通记录" description="这些内容是人工笔记，会作为后续面试准备上下文。">
          <PhoneNotesEditor notes={workflow.phoneNotes} onChange={workflow.updatePhoneNotes} />
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void workflow.generateInterviewPreparation()}
              disabled={workflow.busyStep !== null}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workflow.busyStep === "interview" ? "正在生成..." : "生成面试准备"}
            </button>
          </div>
        </SectionCard>
      ) : null}

      {workflow.reviewedInterviewPreparation ? (
        <SectionCard title="面试准备" description="AI 根据已确认上下文和电话笔记生成可编辑面试准备。">
          <div className="grid gap-4 lg:grid-cols-2">
            {interviewPreparationFields.map((item) => (
              <ListField
                key={item.field}
                id={`interview-${item.field}`}
                label={item.label}
                value={workflow.reviewedInterviewPreparation?.[item.field] ?? []}
                onChange={(value) => workflow.updateInterviewPreparation(item.field, value)}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {workflow.reviewedInterviewPreparation ? (
        <SectionCard title="面试记录" description="记录 Recruiter 或面试后的人工观察，不自动形成录用判断。">
          <InterviewNotesEditor
            notes={workflow.interviewNotes}
            onChange={workflow.updateInterviewNotes}
          />
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void workflow.generateRecruiterSummary()}
              disabled={workflow.busyStep !== null}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workflow.busyStep === "summary" ? "正在生成..." : "生成 Recruiter Summary"}
            </button>
          </div>
        </SectionCard>
      ) : null}

      {workflow.reviewedRecruiterSummary ? (
        <SectionCard title="Recruiter Summary" description="最终总结仍是人工可编辑的协作记录，不包含自动决策。">
          <div className="space-y-4">
            <FormField id="notes-summary" label="Recruiter 笔记总结">
              <textarea
                id="notes-summary"
                value={workflow.reviewedRecruiterSummary.recruiterNotesSummary}
                onChange={(event) =>
                  workflow.updateRecruiterSummary("recruiterNotesSummary", event.target.value)
                }
                rows={5}
                className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </FormField>

            <div className="grid gap-4 lg:grid-cols-2">
              {recruiterSummaryFields.map((item) => (
                <ListField
                  key={item.field}
                  id={`summary-${item.field}`}
                  label={item.label}
                  value={workflow.reviewedRecruiterSummary?.[item.field] ?? []}
                  onChange={(value) => workflow.updateRecruiterSummary(item.field, value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={workflow.cancelWorkflow}
              disabled={workflow.busyStep !== null}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void workflow.saveWorkflow()}
              disabled={workflow.busyStep !== null}
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workflow.busyStep === "save" ? "正在保存..." : "确认并保存 Workflow"}
            </button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function PhoneNotesEditor({
  notes,
  onChange
}: {
  notes: PhoneNotes;
  onChange: (field: keyof PhoneNotes, value: string | string[]) => void;
}): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ListField
        id="phone-key-facts"
        label="关键事实"
        value={notes.keyFacts}
        onChange={(value) => onChange("keyFacts", value)}
      />
      <TextAreaField
        id="phone-motivation"
        label="候选人动机"
        value={notes.candidateMotivation}
        onChange={(value) => onChange("candidateMotivation", value)}
      />
      <TextAreaField
        id="phone-salary"
        label="薪资期望"
        value={notes.salaryExpectation}
        onChange={(value) => onChange("salaryExpectation", value)}
      />
      <TextAreaField
        id="phone-availability"
        label="可到岗时间"
        value={notes.availability}
        onChange={(value) => onChange("availability", value)}
      />
      <TextAreaField
        id="phone-communication"
        label="沟通质量"
        value={notes.communicationQuality}
        onChange={(value) => onChange("communicationQuality", value)}
      />
      <ListField
        id="phone-open-questions"
        label="开放问题"
        value={notes.openQuestions}
        onChange={(value) => onChange("openQuestions", value)}
      />
      <div className="lg:col-span-2">
        <TextAreaField
          id="phone-free-notes"
          label="自由备注"
          value={notes.freeNotes}
          onChange={(value) => onChange("freeNotes", value)}
          rows={5}
        />
      </div>
    </div>
  );
}

function InterviewNotesEditor({
  notes,
  onChange
}: {
  notes: InterviewNotes;
  onChange: (field: keyof InterviewNotes, value: string | string[]) => void;
}): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TextAreaField
        id="interview-summary"
        label="面试摘要"
        value={notes.interviewSummary}
        onChange={(value) => onChange("interviewSummary", value)}
      />
      <TextAreaField
        id="interview-impression"
        label="整体印象"
        value={notes.overallImpression}
        onChange={(value) => onChange("overallImpression", value)}
      />
      <ListField
        id="interview-strengths"
        label="优势"
        value={notes.strengths}
        onChange={(value) => onChange("strengths", value)}
      />
      <ListField
        id="interview-weaknesses"
        label="不足"
        value={notes.weaknesses}
        onChange={(value) => onChange("weaknesses", value)}
      />
      <ListField
        id="interview-new-evidence"
        label="新增证据"
        value={notes.newEvidence}
        onChange={(value) => onChange("newEvidence", value)}
      />
      <ListField
        id="interview-concerns"
        label="顾虑"
        value={notes.concerns}
        onChange={(value) => onChange("concerns", value)}
      />
    </div>
  );
}

function ListField({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}): JSX.Element {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        value={value.join("\n")}
        onChange={(event) => onChange(parseMultilineList(event.target.value))}
        rows={5}
        className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </FormField>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 4
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}): JSX.Element {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </FormField>
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

function getWorkflowStatus(workflow: ReturnType<typeof useRecruitTogether>):
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_REVIEW" {
  if (workflow.savedWorkflow) {
    return "COMPLETED";
  }

  if (workflow.reviewedRecruiterSummary) {
    return "NEEDS_REVIEW";
  }

  if (workflow.reviewedPhonePreparation || workflow.reviewedInterviewPreparation) {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
