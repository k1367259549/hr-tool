"use client";

import { FormField } from "@/components/shared/FormField";
import { PageActions } from "@/components/shared/PageActions";
import { SectionCard } from "@/components/shared/SectionCard";

type PlannerGeneratePanelProps = {
  selectedDate: string;
  isLoading: boolean;
  isGenerating: boolean;
  hasPlan: boolean;
  onDateChange: (date: string) => void;
  onLoadPlan: () => Promise<void>;
  onGeneratePlan: () => Promise<void>;
};

export function PlannerGeneratePanel({
  selectedDate,
  isLoading,
  isGenerating,
  hasPlan,
  onDateChange,
  onLoadPlan,
  onGeneratePlan
}: PlannerGeneratePanelProps): JSX.Element {
  return (
    <SectionCard
      title="明日计划"
      description="选择目标日期，加载已保存的计划，或生成新的次日计划。"
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onLoadPlan()}
            disabled={isLoading || isGenerating}
          >
            {isLoading ? "加载中..." : "加载"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onGeneratePlan()}
            disabled={isLoading || isGenerating || !selectedDate}
          >
            {isGenerating ? "生成中..." : hasPlan ? "重新生成计划" : "生成计划"}
          </button>
        </PageActions>
      }
    >
      <FormField id="planner-date" label="目标日期" required>
        <input
          id="planner-date"
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 sm:max-w-xs"
        />
      </FormField>
    </SectionCard>
  );
}
