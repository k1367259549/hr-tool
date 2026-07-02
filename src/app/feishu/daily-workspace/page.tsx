"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { FormField } from "@/components/shared/FormField";
import { SectionCard } from "@/components/shared/SectionCard";
import { useToast } from "@/components/shared/ToastProvider";
import { WorkflowNavigationCard } from "@/components/shared/WorkflowNavigationCard";
import { useDailyWorkspace } from "@/features/daily-workspace/hooks/useDailyWorkspace";
import type {
  DailyInsightsOutput,
  DailySummaryOutput,
  DailyWorkspaceUnifiedOutput,
  ImprovementSuggestionsOutput,
  TomorrowPrioritiesOutput
} from "@/types/dailyWorkspace";
import { parseMultilineList } from "@/utils/textList";

const dailySummaryFields: Array<{
  field: Exclude<keyof DailySummaryOutput, keyof DailyWorkspaceUnifiedOutput | "todaysWorkSummary">;
  label: string;
}> = [
  { field: "jobsWorkedOn", label: "今日涉及岗位" },
  { field: "candidatesProcessed", label: "处理候选人" },
  { field: "phoneScreensCompleted", label: "完成电话初筛" },
  { field: "interviewsCompleted", label: "完成面试" },
  { field: "keyAchievements", label: "关键进展" },
  { field: "pendingWork", label: "待处理工作" }
];

const insightFields: Array<{
  field: Exclude<keyof DailyInsightsOutput, keyof DailyWorkspaceUnifiedOutput>;
  label: string;
}> = [
  { field: "todaysRecruitingInsights", label: "今日招聘洞察" },
  { field: "repeatedCandidateRisks", label: "重复候选人风险" },
  { field: "repeatedMissingInformation", label: "重复缺失信息" },
  { field: "jobUnderstandingImprovements", label: "岗位理解改进点" },
  { field: "candidateUnderstandingImprovements", label: "候选人理解改进点" },
  { field: "recruitingObservations", label: "招聘观察" },
  { field: "evidenceCoverage", label: "证据覆盖" },
  { field: "attentionPoints", label: "注意点" }
];

const priorityFields: Array<{
  field: Exclude<keyof TomorrowPrioritiesOutput, keyof DailyWorkspaceUnifiedOutput>;
  label: string;
}> = [
  { field: "highPriorityTasks", label: "高优先级任务" },
  { field: "candidatesToContact", label: "需联系候选人" },
  { field: "candidatesWaitingFollowUp", label: "待跟进候选人" },
  { field: "missingInformationToVerify", label: "待核实缺失信息" },
  { field: "interviewsToPrepare", label: "需准备面试" },
  { field: "recruiterSuggestions", label: "Recruiter 建议" }
];

const improvementFields: Array<{
  field: Exclude<keyof ImprovementSuggestionsOutput, keyof DailyWorkspaceUnifiedOutput>;
  label: string;
}> = [
  { field: "aiSuggestions", label: "AI 建议" },
  { field: "promptImprovementIdeas", label: "Prompt 改进想法" },
  { field: "workflowImprovementIdeas", label: "Workflow 改进想法" },
  { field: "recruiterEfficiencySuggestions", label: "Recruiter 效率建议" },
  { field: "potentialProductImprovementNotes", label: "产品改进备注" }
];

export default function DailyWorkspacePage(): JSX.Element {
  const workspace = useDailyWorkspace();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = workspace;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Recruiter Daily Workspace"
        description="每日入口：自动汇总今日招聘活动，生成可人工编辑的总结、洞察、明日优先级和改进建议。"
      />

      <WorkflowNavigationCard
        currentWorkflow="Workflow-04 · Daily Workspace"
        currentStatus={workspace.savedWorkspace ? "COMPLETED" : workspace.improvementSuggestions ? "NEEDS_REVIEW" : "IN_PROGRESS"}
        previousWorkflow={{
          description: "先完成 Recruit Together，再做当日招聘工作复盘。",
          href: "/feishu/recruit-together",
          label: "Recruit Together"
        }}
        recommendedNextAction={{
          description: "保存每日工作区后，打开任务中心处理下一步动作。",
          href: "/feishu/tasks",
          label: "Open Task Center"
        }}
      />

      {workspace.errorMessage ? (
        <ErrorState
          title="Daily Workspace 无法继续"
          message={workspace.errorMessage}
          actionLabel="关闭"
          onAction={workspace.dismissError}
        />
      ) : null}

      {workspace.savedWorkspace ? (
        <SectionCard title="Workflow 已完成" description="每日工作区已保存；没有自动创建 Learning Assets。">
          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <Info label="Workflow ID" value={workspace.savedWorkspace.workflowId} />
              <Info label="日期" value={workspace.savedWorkspace.date} />
              <Info label="Learning Assets" value="未创建" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/feishu"
                className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back To Workspace
              </Link>
              <Link
                href="/feishu/tasks"
                className="rounded-md bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open Task Center
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="今日工作采集" description="系统会按日期自动采集 V2 工作流活动，可补充 Recruiter 手工备注。">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <FormField id="daily-date" label="日期">
            <input
              id="daily-date"
              type="date"
              value={workspace.date}
              onChange={(event) => workspace.setDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>

          <FormField id="daily-manual-notes" label="Recruiter 手工备注">
            <textarea
              id="daily-manual-notes"
              value={workspace.manualNotes}
              onChange={(event) => workspace.setManualNotes(event.target.value)}
              rows={4}
              placeholder="补充今天的临时沟通、未进入系统的上下文或明天需要特别注意的事项。"
              className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </FormField>
        </div>

        {workspace.activitySnapshot ? (
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-5">
            <Info label="岗位画像" value={`${workspace.activitySnapshot.counts.jobProfiles}`} />
            <Info label="候选人洞察" value={`${workspace.activitySnapshot.counts.candidateInsights}`} />
            <Info label="电话初筛" value={`${workspace.activitySnapshot.counts.phoneScreens}`} />
            <Info label="面试记录" value={`${workspace.activitySnapshot.counts.interviews}`} />
            <Info
              label="协作流程"
              value={`${workspace.activitySnapshot.counts.recruitTogetherWorkflows}`}
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void workspace.reloadSnapshot()}
            disabled={workspace.isLoadingSnapshot || workspace.isGenerating}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {workspace.isLoadingSnapshot ? "正在刷新..." : "刷新今日活动"}
          </button>
          <button
            type="button"
            onClick={() => void workspace.generate()}
            disabled={workspace.isGenerating}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {workspace.isGenerating ? "正在生成..." : "生成 Daily Workspace"}
          </button>
        </div>
      </SectionCard>

      {workspace.dailySummary ? (
        <SectionCard title="Daily Summary" description="今日招聘工作总结，可人工编辑后保存。">
          <UnifiedOutputEditor
            idPrefix="daily-summary"
            output={workspace.dailySummary}
            onChange={workspace.updateDailySummary}
          />
          <TextAreaField
            id="todays-work-summary"
            label="Today's Work Summary"
            value={workspace.dailySummary.todaysWorkSummary}
            onChange={(value) => workspace.updateDailySummary("todaysWorkSummary", value)}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {dailySummaryFields.map((item) => (
              <ListField
                key={item.field}
                id={`daily-summary-${item.field}`}
                label={item.label}
                value={workspace.dailySummary?.[item.field] ?? []}
                onChange={(value) => workspace.updateDailySummary(item.field, value)}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {workspace.recruitingInsights ? (
        <SectionCard title="Recruiting Insights" description="今日招聘质量观察，只作为建议，不自动更新任何资产。">
          <UnifiedOutputEditor
            idPrefix="daily-insights"
            output={workspace.recruitingInsights}
            onChange={workspace.updateRecruitingInsights}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {insightFields.map((item) => (
              <ListField
                key={item.field}
                id={`daily-insights-${item.field}`}
                label={item.label}
                value={workspace.recruitingInsights?.[item.field] ?? []}
                onChange={(value) => workspace.updateRecruitingInsights(item.field, value)}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {workspace.tomorrowPriorities ? (
        <SectionCard title="Tomorrow Priorities" description="明日优先级建议，所有执行动作仍由 Recruiter 控制。">
          <UnifiedOutputEditor
            idPrefix="tomorrow-priorities"
            output={workspace.tomorrowPriorities}
            onChange={workspace.updateTomorrowPriorities}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {priorityFields.map((item) => (
              <ListField
                key={item.field}
                id={`tomorrow-priorities-${item.field}`}
                label={item.label}
                value={workspace.tomorrowPriorities?.[item.field] ?? []}
                onChange={(value) => workspace.updateTomorrowPriorities(item.field, value)}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {workspace.improvementSuggestions ? (
        <SectionCard title="Improvement Suggestions" description="改进建议只进入当前 Workspace，不会自动修改 Prompt 或创建 Learning Assets。">
          <UnifiedOutputEditor
            idPrefix="improvement-suggestions"
            output={workspace.improvementSuggestions}
            onChange={workspace.updateImprovementSuggestions}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {improvementFields.map((item) => (
              <ListField
                key={item.field}
                id={`improvement-suggestions-${item.field}`}
                label={item.label}
                value={workspace.improvementSuggestions?.[item.field] ?? []}
                onChange={(value) => workspace.updateImprovementSuggestions(item.field, value)}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={workspace.cancel}
              disabled={workspace.isSaving}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void workspace.generate()}
              disabled={workspace.isGenerating || workspace.isSaving}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workspace.isGenerating ? "正在重新生成..." : "重新生成"}
            </button>
            <button
              type="button"
              onClick={() => void workspace.save()}
              disabled={workspace.isSaving}
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workspace.isSaving ? "正在保存..." : "确认并保存 Daily Workspace"}
            </button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function UnifiedOutputEditor<TOutput extends DailyWorkspaceUnifiedOutput>({
  idPrefix,
  output,
  onChange
}: {
  idPrefix: string;
  output: TOutput;
  onChange: (field: keyof TOutput, value: string | string[]) => void;
}): JSX.Element {
  return (
    <div className="space-y-4">
      <TextAreaField
        id={`${idPrefix}-summary`}
        label="Summary"
        value={output.summary}
        onChange={(value) => onChange("summary", value)}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ListField
          id={`${idPrefix}-insights`}
          label="Insights"
          value={output.insights}
          onChange={(value) => onChange("insights", value)}
        />
        <ListField
          id={`${idPrefix}-evidence`}
          label="Evidence"
          value={output.evidence}
          onChange={(value) => onChange("evidence", value)}
        />
        <ListField
          id={`${idPrefix}-attention`}
          label="Attention"
          value={output.attention}
          onChange={(value) => onChange("attention", value)}
        />
        <ListField
          id={`${idPrefix}-suggested-actions`}
          label="Suggested Actions"
          value={output.suggestedActions}
          onChange={(value) => onChange("suggestedActions", value)}
        />
        <TextAreaField
          id={`${idPrefix}-confidence`}
          label="Confidence"
          value={output.confidence}
          onChange={(value) => onChange("confidence", value)}
        />
        <ListField
          id={`${idPrefix}-audit`}
          label="Audit"
          value={output.audit}
          onChange={(value) => onChange("audit", value)}
        />
      </div>
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
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
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
