"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ActionCard } from "@/components/shared/ActionCard";
import { AttentionCard } from "@/components/shared/AttentionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { EvidenceCard } from "@/components/shared/EvidenceCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { InsightCard } from "@/components/shared/InsightCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import { TimelineCard } from "@/components/shared/TimelineCard";
import { useToast } from "@/components/shared/ToastProvider";
import { WorkflowNavigationCard } from "@/components/shared/WorkflowNavigationCard";
import { WorkflowProgress } from "@/components/shared/WorkflowProgress";
import { useRecruiterWorkspace } from "@/features/recruiter-workspace/hooks/useRecruiterWorkspace";
import type {
  RecruiterWorkspaceActionCard,
  RecruiterWorkspaceAiSuggestions,
  RecruiterWorkspaceCandidateGroup,
  RecruiterWorkspaceJobCard,
  RecruiterWorkspaceScheduleItemInput
} from "@/types/recruiterWorkspace";

const scheduleTypeLabels: Record<RecruiterWorkspaceScheduleItemInput["itemType"], string> = {
  INTERVIEW: "面试",
  LEADER_MEETING: "业务方会议",
  PHONE_SCREEN: "电话初筛",
  RECRUITING_TASK: "招聘任务"
};

const milestoneFlow = [
  { href: "/feishu/job-profile/new", label: "Job", title: "岗位理解" },
  { href: "/feishu/candidate-understanding/new", label: "Resume", title: "简历与候选人" },
  { href: "/feishu/recruit-together", label: "Phone", title: "电话初筛" },
  { href: "/feishu/recruit-together", label: "Interview", title: "面试准备" },
  { href: "/feishu/daily-workspace", label: "Daily Review", title: "每日复盘" },
  { href: "/feishu/tasks", label: "Next Action", title: "任务中心" }
];

export function RecruiterWorkspaceHome(): JSX.Element {
  const workspace = useRecruiterWorkspace();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = workspace;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  if (workspace.isLoading && !workspace.data) {
    return (
      <LoadingState
        title="正在加载 AI Recruiter Workspace"
        description="正在整理岗位、候选人、任务、日程和最近活动。"
      />
    );
  }

  return (
    <div className="space-y-6">
      {workspace.errorMessage ? (
        <ErrorState
          title="AI Recruiter Workspace 暂时无法继续"
          message={workspace.errorMessage}
          actionLabel="关闭"
          onAction={workspace.dismissError}
        />
      ) : null}

      <header className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              AI Recruiter Workspace
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              Today&apos;s Recruiting Command Center
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {workspace.data?.overview.greeting ?? "Good Morning"}，{workspace.data?.overview.recruiterName ?? "Recruiter"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.data?.overview.overview ?? "正在整理今天的招聘工作。"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>当前日期</span>
              <input
                type="date"
                value={workspace.date}
                onChange={(event) => workspace.setDate(event.target.value)}
                className="block rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <button
              type="button"
              onClick={() => void workspace.reload()}
              disabled={workspace.isLoading}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workspace.isLoading ? "刷新中..." : "刷新工作台"}
            </button>
          </div>
        </div>
      </header>

      <WorkflowNavigationCard
        currentWorkflow="Workflow-05 · AI Recruiter Workspace"
        currentStatus="IN_PROGRESS"
        previousWorkflow={{
          description: "每日工作区沉淀今日总结和明日优先级。",
          href: "/feishu/daily-workspace",
          label: "Daily Workspace"
        }}
        recommendedNextAction={{
          description: "打开任务中心，处理 Next Best Action Cards。",
          href: "/feishu/tasks",
          label: "Open Task Center"
        }}
      />

      <SectionCard title="Today's Focus" description="今天最值得先处理的招聘动作。">
        <div className="space-y-4">
          {(workspace.data?.focusItems ?? []).map((card) => (
            <WorkspaceActionCard key={card.sourceKey} card={card} />
          ))}
          {workspace.data?.focusItems.length === 0 ? (
            <EmptyState
              title="暂时没有高优先级焦点"
              description="可以先创建岗位画像，或进入任务中心同步下一步动作。"
              action={
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link
                    href="/feishu/job-profile/new"
                    className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Create Job Profile
                  </Link>
                  <Link
                    href="/feishu/tasks"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    打开 Task Center
                  </Link>
                </div>
              }
            />
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Today's Workflow Progress" description="连续招聘流程进度，点击任一步即可继续。">
        <WorkflowProgress items={workspace.data?.workflowProgress ?? []} />
      </SectionCard>

      <SectionCard title="End-to-End Recruiting Flow" description="从岗位到每日复盘的连续工作路径。">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {milestoneFlow.map((step, index) => (
            <Link
              key={step.label}
              href={step.href}
              className="rounded-md border border-slate-200 bg-slate-50 p-3 hover:bg-white"
            >
              <p className="text-xs font-medium text-slate-500">{`Step ${index + 1} · ${step.label}`}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{step.title}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <SectionCard title="Today's Jobs" description="当前优先处理的已确认岗位画像。">
            <div className="grid gap-3 lg:grid-cols-2">
              {(workspace.data?.todaysJobs ?? []).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {workspace.data?.todaysJobs.length === 0 ? (
                <div className="lg:col-span-2">
                  <EmptyState
                    title="还没有已确认岗位画像"
                    description="先粘贴 JD 生成岗位理解，AI Recruiter 才能围绕岗位组织候选人和下一步动作。"
                    action={
                      <Link
                        href="/feishu/job-profile/new"
                        className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Create Job Understanding
                      </Link>
                    }
                  />
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Today's Candidates" description="按下一步动作组织候选人，不做评分或录用建议。">
            <div className="space-y-5">
              {(workspace.data?.candidateGroups ?? []).map((group) => (
                <CandidateGroup key={group.group} group={group} />
              ))}
              {workspace.data?.candidateGroups.every((group) => group.candidates.length === 0) ? (
                <EmptyState
                  title="还没有今日候选人动作"
                  description="上传简历并生成候选人理解后，这里会按电话初筛、面试准备、跟进和缺失信息分组。"
                  action={
                    <Link
                      href="/feishu/candidate-understanding/new"
                      className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Start Candidate Understanding
                    </Link>
                  }
                />
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="AI Today's Suggestions"
            description="来自 NextBestActionService 的证据型 Action Cards，所有动作仍由 Recruiter 决定。"
          >
            <div className="space-y-4">
              {(workspace.data?.actionCards ?? []).slice(0, 6).map((card) => (
                <WorkspaceActionCard key={card.sourceKey} card={card} />
              ))}
              {workspace.data?.actionCards.length === 0 ? (
                <AiSuggestions suggestions={workspace.data?.aiSuggestions} />
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity" description="今日与最近的 Workflow 历史、AI 输出和人工编辑。">
            <TimelineCard
              emptyText="还没有今日活动。"
              items={(workspace.data?.recentActivity ?? []).map((activity) => ({
                badge: activity.source,
                description: activity.description,
                href: activity.href,
                id: `${activity.source}-${activity.id}`,
                status: activity.status,
                time: formatDateTime(activity.time),
                title: activity.title
              }))}
            />
          </SectionCard>
        </main>

        <aside className="space-y-6">
          <SectionCard title="Today's Schedule" description="手动调整电话、面试、会议和招聘任务。">
            <div className="space-y-3">
              {workspace.scheduleDraft.map((item, index) => (
                <ScheduleItemEditor
                  key={`${item.itemType}-${index}`}
                  index={index}
                  item={item}
                  onChange={workspace.updateScheduleItem}
                  onRemove={workspace.removeScheduleItem}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(scheduleTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    workspace.addScheduleItem(type as RecruiterWorkspaceScheduleItemInput["itemType"])
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  添加{label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void workspace.saveSchedule()}
              disabled={workspace.isSavingSchedule}
              className="mt-4 w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {workspace.isSavingSchedule ? "保存中..." : "保存日程"}
            </button>
          </SectionCard>

          <SectionCard title="Quick Actions" description="常用 Workflow 一键进入。">
            <div className="space-y-2">
              {(workspace.data?.quickActions ?? []).map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block rounded-md border border-slate-200 px-3 py-3 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-950">{action.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recruiter Notes" description="快速记录业务反馈、招聘想法和紧急提醒。">
            <div className="space-y-3">
              <input
                value={workspace.noteCategory}
                onChange={(event) => workspace.setNoteCategory(event.target.value)}
                placeholder="分类，例如 Leader feedback"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <textarea
                value={workspace.noteContent}
                onChange={(event) => workspace.setNoteContent(event.target.value)}
                rows={4}
                placeholder="记录今天需要记住的上下文。"
                className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={() => void workspace.addNote()}
                disabled={workspace.isSavingNote}
                className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workspace.isSavingNote ? "保存中..." : "保存 Note"}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(workspace.data?.notes ?? []).slice(0, 5).map((note) => (
                <div key={note.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">{note.category ?? "Note"}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{note.content}</p>
                </div>
              ))}
              {workspace.data?.notes.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                  今天还没有 Recruiter Note。
                </p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="End-of-Day Shortcut" description="复用 Workflow-04 生成每日招聘工作区。">
            <Link
              href="/feishu/daily-workspace"
              className="block rounded-md bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Generate Daily Workspace
            </Link>
          </SectionCard>

          <SectionCard title="Future Placeholder" description="预留后续智能资产能力，不在本页实现。">
            <div className="space-y-2">
              {(workspace.data?.futurePlaceholders ?? []).map((placeholder) => (
                <div key={placeholder.title} className="rounded-md border border-dashed border-slate-300 p-3">
                  <p className="text-sm font-semibold text-slate-950">{placeholder.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{placeholder.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function WorkspaceActionCard({ card }: { card: RecruiterWorkspaceActionCard }): JSX.Element {
  return (
    <ActionCard
      actionLabel="Open"
      badges={[
        card.priority,
        `Confidence ${card.confidence}`,
        card.category,
        card.status
      ]}
      evidence={card.evidence}
      href={card.quickStartHref}
      metadata={[
        { label: "Priority Why", value: card.priorityReason },
        { label: "Related Workflow", value: card.relatedWorkflow ?? "N/A" },
        { label: "Related Job", value: card.relatedJob ?? "N/A" },
        { label: "Related Candidate", value: card.relatedCandidate ?? "N/A" },
        { label: "Due Time", value: card.dueTime ? formatDateTime(card.dueTime) : "未设置" }
      ]}
      nextAction={card.recommendedNextAction}
      reason={card.reason}
      title={card.title}
    />
  );
}

function JobCard({ job }: { job: RecruiterWorkspaceJobCard }): JSX.Element {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{job.jobTitle}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{job.hiringGoal}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {job.currentStage}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">今日候选人：{job.candidatesToday}</p>
      <ul className="mt-3 space-y-2">
        {job.pendingActions.map((action) => (
          <li key={action} className="text-sm leading-6 text-slate-700">
            {action}
          </li>
        ))}
      </ul>
      <Link href={job.href} className="mt-4 inline-flex text-sm font-medium text-slate-950 underline">
        Open Job
      </Link>
    </article>
  );
}

function CandidateGroup({ group }: { group: RecruiterWorkspaceCandidateGroup }): JSX.Element {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-950">{group.title}</h3>
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        {group.candidates.slice(0, 4).map((candidate) => (
          <article key={`${group.group}-${candidate.id}`} className="rounded-md border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-950">{candidate.candidateName}</p>
            <p className="mt-1 text-xs text-slate-500">{candidate.relatedJob}</p>
            <p className="mt-2 text-sm text-slate-700">{candidate.currentWorkflow}</p>
            <p className="mt-2 text-sm font-medium text-slate-950">{candidate.nextAction}</p>
            {candidate.attention.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {candidate.attention.slice(0, 2).map((attention) => (
                  <li key={attention} className="text-xs leading-5 text-amber-700">
                    {attention}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href={candidate.href} className="mt-3 inline-flex text-sm font-medium text-slate-950 underline">
              打开
            </Link>
          </article>
        ))}
        {group.candidates.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            暂无候选人。
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AiSuggestions({
  suggestions
}: {
  suggestions: RecruiterWorkspaceAiSuggestions | undefined;
}): JSX.Element {
  if (!suggestions) {
    return <p className="text-sm text-slate-500">正在整理建议。</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InsightCard title="今日优先级" items={suggestions.priorities} />
      <AttentionCard title="潜在风险" items={suggestions.potentialRisks} />
      <AttentionCard title="需关注候选人" items={suggestions.candidatesRequiringAttention} />
      <AttentionCard title="需澄清岗位" items={suggestions.jobsRequiringClarification} tone="neutral" />
      <AttentionCard title="缺失信息" items={suggestions.missingInformation} />
      <EvidenceCard title="证据" items={suggestions.evidence} />
    </div>
  );
}

function ScheduleItemEditor({
  index,
  item,
  onChange,
  onRemove
}: {
  index: number;
  item: RecruiterWorkspaceScheduleItemInput;
  onChange: (
    index: number,
    field: keyof RecruiterWorkspaceScheduleItemInput,
    value: string | boolean
  ) => void;
  onRemove: (index: number) => void;
}): JSX.Element {
  const actionHref = getScheduleActionHref(item.itemType);

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid gap-2">
        <select
          value={item.itemType}
          onChange={(event) => onChange(index, "itemType", event.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-950"
        >
          {Object.entries(scheduleTypeLabels).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={item.startTime ?? ""}
          onChange={(event) => onChange(index, "startTime", event.target.value)}
          placeholder="时间，例如 10:30"
          className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-950"
        />
        <input
          value={item.title}
          onChange={(event) => onChange(index, "title", event.target.value)}
          placeholder="事项"
          className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-950"
        />
        <input
          value={item.relatedName ?? ""}
          onChange={(event) => onChange(index, "relatedName", event.target.value)}
          placeholder="关联候选人 / 岗位"
          className="rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-950"
        />
        <textarea
          value={item.notes ?? ""}
          onChange={(event) => onChange(index, "notes", event.target.value)}
          placeholder="备注"
          rows={2}
          className="resize-y rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-950"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={item.completed ?? false}
            onChange={(event) => onChange(index, "completed", event.target.checked)}
          />
          已完成
        </label>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-sm font-medium text-rose-700 underline"
        >
          删除
        </button>
      </div>
      <Link href={actionHref} className="mt-3 inline-flex text-sm font-medium text-slate-950 underline">
        开始处理
      </Link>
    </div>
  );
}

function getScheduleActionHref(itemType: RecruiterWorkspaceScheduleItemInput["itemType"]): string {
  if (itemType === "PHONE_SCREEN" || itemType === "INTERVIEW") {
    return "/feishu/recruit-together";
  }

  if (itemType === "LEADER_MEETING") {
    return "/feishu/job-profile/new";
  }

  return "/feishu/tasks";
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
