"use client";

import Link from "next/link";
import { ActionCard } from "@/components/shared/ActionCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { WorkflowNavigationCard } from "@/components/shared/WorkflowNavigationCard";
import { useRecruitmentTaskCenter } from "@/features/recruitment-task-center/hooks/useRecruitmentTaskCenter";
import type {
  RecruitmentTaskCategory,
  RecruitmentTaskDto,
  RecruitmentTaskPriority,
  RecruitmentTaskStatus
} from "@/types/recruitmentTask";

const priorityLabels: Record<RecruitmentTaskPriority, string> = {
  HIGH: "High",
  LOW: "Low",
  MEDIUM: "Medium"
};

const statusLabels: Record<RecruitmentTaskStatus, string> = {
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  DEFERRED: "Deferred",
  IN_PROGRESS: "In Progress",
  TODO: "Todo"
};

const categoryLabels: Record<RecruitmentTaskCategory, string> = {
  CANDIDATE_REVIEW: "Candidate Review",
  FOLLOW_UP: "Follow-up",
  INTERVIEW_PREPARATION: "Interview Preparation",
  JOB_CLARIFICATION: "Job Clarification",
  LEADER_CONFIRMATION: "Leader Confirmation",
  MISSING_INFORMATION: "Missing Information",
  PHONE_SCREEN: "Phone Screen",
  RECRUITER_REMINDER: "Recruiter Reminder"
};

export function RecruitmentTaskCenter(): JSX.Element {
  const taskCenter = useRecruitmentTaskCenter();
  const tasks = taskCenter.data?.tasks ?? [];
  const activeTasks = tasks.filter((task) => task.status !== "COMPLETED" && task.status !== "CANCELLED");

  return (
    <div className="space-y-6">
      <header className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Workflow-06
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Recruitment Task Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              持续整理下一步 Recruiter 动作。任务只提供建议和证据，不自动执行、不移动 Pipeline、不发送消息。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void taskCenter.reload()}
            disabled={taskCenter.isLoading}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {taskCenter.isLoading ? "同步中..." : "同步任务"}
          </button>
        </div>
      </header>

      <WorkflowNavigationCard
        currentWorkflow="Workflow-06 · Recruitment Task Center"
        currentStatus={activeTasks.length > 0 ? "IN_PROGRESS" : "NOT_STARTED"}
        previousWorkflow={{
          description: "每日复盘会生成明日优先级和待处理上下文。",
          href: "/feishu/daily-workspace",
          label: "Daily Workspace"
        }}
        recommendedNextAction={{
          description: "处理或同步任务后，回到 Workspace 查看今日整体工作。",
          href: "/feishu",
          label: "Return To Workspace"
        }}
      />

      {taskCenter.errorMessage ? (
        <ErrorState
          title="Task Center 无法继续"
          message={taskCenter.errorMessage}
          actionLabel="关闭"
          onAction={taskCenter.dismissError}
        />
      ) : null}

      <section className="grid gap-3 md:grid-cols-5">
        <Counter label="Todo" value={taskCenter.data?.counts.todo ?? 0} />
        <Counter label="In Progress" value={taskCenter.data?.counts.inProgress ?? 0} />
        <Counter label="Deferred" value={taskCenter.data?.counts.deferred ?? 0} />
        <Counter label="Completed" value={taskCenter.data?.counts.completed ?? 0} />
        <Counter label="Cancelled" value={taskCenter.data?.counts.cancelled ?? 0} />
      </section>

      <SectionCard title="Quick Start" description="一键打开前序 Workflow，执行动作仍由 Recruiter 控制。">
        <div className="grid gap-3 md:grid-cols-4">
          {(taskCenter.data?.quickStarts ?? []).map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Return To Workspace" description="任务处理后回到 AI Recruiter Workspace 查看进度。">
        <Link
          href="/feishu"
          className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back To Workspace
        </Link>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Next Recruiter Actions"
          description="按优先级和状态展示任务。每张卡都解释 Why、Evidence 和 Next Action。"
        >
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isUpdating={taskCenter.isUpdating}
                onAction={taskCenter.applyAction}
                onEdit={taskCenter.startEdit}
              />
            ))}
            {activeTasks.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                当前没有待处理任务。同步后如仍为空，说明已有 Workflow 输出中暂无可生成动作。
              </p>
            ) : null}
          </div>
        </SectionCard>

        <aside className="space-y-6">
          <SectionCard title="Human Control" description="所有任务都需要人工确认。">
            <ul className="space-y-2 text-sm leading-6 text-slate-700">
              <li>Accept：确认任务进入 Todo。</li>
              <li>Modify：人工修改标题、优先级、原因或下一步动作。</li>
              <li>Dismiss：取消任务，不执行任何外部动作。</li>
              <li>Reschedule：延期任务，不自动创建日程。</li>
              <li>Complete：仅标记完成。</li>
            </ul>
          </SectionCard>

          {taskCenter.editingTask ? (
            <SectionCard title="Modify Task" description="人工覆盖会写入 Task Audit。">
              <div className="space-y-3">
                <input
                  value={taskCenter.editingTask.title}
                  onChange={(event) => taskCenter.updateEditingTask("title", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                />
                <select
                  value={taskCenter.editingTask.priority}
                  onChange={(event) => taskCenter.updateEditingTask("priority", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <textarea
                  value={taskCenter.editingTask.priorityReason}
                  onChange={(event) => taskCenter.updateEditingTask("priorityReason", event.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                />
                <textarea
                  value={taskCenter.editingTask.reason}
                  onChange={(event) => taskCenter.updateEditingTask("reason", event.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                />
                <textarea
                  value={taskCenter.editingTask.recommendedNextAction}
                  onChange={(event) =>
                    taskCenter.updateEditingTask("recommendedNextAction", event.target.value)
                  }
                  rows={3}
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                />
                <input
                  type="datetime-local"
                  value={taskCenter.editingTask.dueTime}
                  onChange={(event) => taskCenter.updateEditingTask("dueTime", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void taskCenter.saveEdit()}
                    className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                  >
                    保存修改
                  </button>
                  <button
                    type="button"
                    onClick={taskCenter.cancelEdit}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    取消
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Completed / Cancelled" description="已结束任务保留审计，不自动删除。">
            <div className="space-y-2">
              {tasks
                .filter((task) => task.status === "COMPLETED" || task.status === "CANCELLED")
                .slice(0, 8)
                .map((task) => (
                  <div key={task.id} className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{statusLabels[task.status]}</p>
                  </div>
                ))}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TaskCard({
  isUpdating,
  onAction,
  onEdit,
  task
}: {
  task: RecruitmentTaskDto;
  isUpdating: boolean;
  onAction: (input: {
    taskId: string;
    action: "ACCEPT" | "START" | "COMPLETE" | "DISMISS" | "DEFER" | "RESCHEDULE";
    patch?: {
      dueTime?: Date;
    };
  }) => Promise<void>;
  onEdit: (task: RecruitmentTaskDto) => void;
}): JSX.Element {
  return (
    <ActionCard
      actionLabel="Quick Start"
      badges={[
        priorityLabels[task.priority],
        `Confidence ${priorityLabels[task.confidence]}`,
        categoryLabels[task.category],
        statusLabels[task.status]
      ]}
      evidence={task.evidence}
      href={task.quickStartHref ?? undefined}
      metadata={[
        { label: "Priority Why", value: task.priorityReason },
        { label: "Related Workflow", value: task.relatedWorkflow ?? "N/A" },
        { label: "Related Candidate", value: task.relatedCandidate ?? "N/A" },
        { label: "Related Job", value: task.relatedJob ?? "N/A" },
        {
          label: "Due Time",
          value: task.dueTime ? new Date(task.dueTime).toLocaleString() : "未设置"
        }
      ]}
      nextAction={task.recommendedNextAction}
      reason={task.reason}
      title={task.title}
      footer={
        <div className="flex flex-wrap gap-2">
        <button type="button" disabled={isUpdating} onClick={() => void onAction({ action: "ACCEPT", taskId: task.id })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          Accept
        </button>
        <button type="button" disabled={isUpdating} onClick={() => void onAction({ action: "START", taskId: task.id })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          Start
        </button>
        <button type="button" disabled={isUpdating} onClick={() => onEdit(task)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          Modify
        </button>
        <button type="button" disabled={isUpdating} onClick={() => void onAction({ action: "RESCHEDULE", patch: { dueTime: createTomorrowDueTime() }, taskId: task.id })} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          Reschedule
        </button>
        <button type="button" disabled={isUpdating} onClick={() => void onAction({ action: "COMPLETE", taskId: task.id })} className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
          Complete
        </button>
        <button type="button" disabled={isUpdating} onClick={() => void onAction({ action: "DISMISS", taskId: task.id })} className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60">
          Dismiss
        </button>
        </div>
      }
    />
  );
}

function createTomorrowDueTime(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);

  return date;
}
