"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import { SectionCard } from "@/components/shared/SectionCard";
import type { PlannerPlanView, PlanPriorityValue } from "@/types/planner";

type PlannerFocusCardProps = {
  plan: PlannerPlanView;
};

export function PlannerFocusCard({ plan }: PlannerFocusCardProps): JSX.Element {
  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <KpiCard
        title="计划优先级"
        value={getPriorityLabel(plan.priority)}
        description={`${plan.dateLabel} 的计划`}
        footer={`生成时间：${plan.generatedAtLabel}`}
        tone={plan.priorityTone}
      />
      <SectionCard title="重点方向" description={`由 ${plan.modelLabel} 生成。`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <PlannerList title="重点任务" items={plan.priorityTasks} />
          <PlannerList title="目标" items={plan.goals} />
          <PlannerList title="风险" items={plan.risks} tone="risk" />
          <PlannerList title="预期结果" items={plan.expectedOutcomes} />
        </div>
      </SectionCard>
    </div>
  );
}

type PlannerListProps = {
  title: string;
  items: string[];
  tone?: "default" | "risk";
};

function PlannerList({ title, items, tone = "default" }: PlannerListProps): JSX.Element {
  const markerClass = tone === "risk" ? "bg-rose-500" : "bg-slate-400";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${title}-${item}`} className="flex gap-2 text-sm leading-6 text-slate-700">
              <span className={`mt-2 size-1.5 shrink-0 rounded-full ${markerClass}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-slate-500">暂无条目。</p>
      )}
    </div>
  );
}

export function getPriorityBadgeClass(priority: PlanPriorityValue): string {
  if (priority === "HIGH") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (priority === "MEDIUM") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getPriorityLabel(priority: PlanPriorityValue): string {
  const labels: Record<PlanPriorityValue, string> = {
    HIGH: "高",
    LOW: "低",
    MEDIUM: "中"
  };

  return labels[priority];
}
