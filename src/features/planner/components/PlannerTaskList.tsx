"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import type { PlanScheduleItem, PlanScheduleTime } from "@/types/planner";
import { getPriorityBadgeClass, getPriorityLabel } from "./PlannerFocusCard";

type PlannerTaskListProps = {
  schedule: PlanScheduleItem[];
};

const timeSections: Array<{
  time: PlanScheduleTime;
  title: string;
}> = [
  {
    time: "morning",
    title: "上午任务"
  },
  {
    time: "afternoon",
    title: "下午任务"
  },
  {
    time: "evening",
    title: "晚上任务"
  }
];

export function PlannerTaskList({ schedule }: PlannerTaskListProps): JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {timeSections.map((section) => (
        <PlannerTimeSection
          key={section.time}
          title={section.title}
          tasks={schedule.filter((task) => task.time === section.time)}
        />
      ))}
    </div>
  );
}

type PlannerTimeSectionProps = {
  title: string;
  tasks: PlanScheduleItem[];
};

function PlannerTimeSection({ title, tasks }: PlannerTimeSectionProps): JSX.Element {
  return (
    <SectionCard title={title}>
      {tasks.length > 0 ? (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={`${task.time}-${task.priority}-${task.content}`} className="space-y-2">
              <span
                className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                  task.priority
                )}`}
              >
                {getPriorityLabel(task.priority)}
              </span>
              <p className="text-sm leading-6 text-slate-700">{task.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-slate-500">暂无已安排任务。</p>
      )}
    </SectionCard>
  );
}
