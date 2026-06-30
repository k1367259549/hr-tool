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
      title="Tomorrow Planner"
      description="Select a target date, load any saved plan, or generate a fresh next-day plan."
      actions={
        <PageActions>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onLoadPlan()}
            disabled={isLoading || isGenerating}
          >
            {isLoading ? "Loading..." : "Load"}
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void onGeneratePlan()}
            disabled={isLoading || isGenerating || !selectedDate}
          >
            {isGenerating ? "Generating..." : hasPlan ? "Regenerate Plan" : "Generate Plan"}
          </button>
        </PageActions>
      }
    >
      <FormField id="planner-date" label="Target date" required>
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
