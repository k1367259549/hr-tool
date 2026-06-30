"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PlannerFocusCard } from "@/features/planner/components/PlannerFocusCard";
import { PlannerGeneratePanel } from "@/features/planner/components/PlannerGeneratePanel";
import { PlannerTaskList } from "@/features/planner/components/PlannerTaskList";
import { usePlanner } from "@/features/planner/hooks/usePlanner";

export default function PlannerPage(): JSX.Element {
  const planner = usePlanner();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tomorrow Planner"
        description="Generate and view structured next-day recruiting plans."
      />
      <PlannerGeneratePanel
        selectedDate={planner.selectedDate}
        isLoading={planner.isLoading}
        isGenerating={planner.isGenerating}
        hasPlan={planner.hasPlan}
        onDateChange={planner.updateDate}
        onLoadPlan={planner.loadPlan}
        onGeneratePlan={planner.generatePlan}
      />
      {planner.errorMessage ? (
        <ErrorState
          title="Unable to load planner"
          message={planner.errorMessage}
          action={
            <button
              type="button"
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={planner.dismissError}
            >
              Dismiss
            </button>
          }
        />
      ) : null}
      {planner.isLoading ? (
        <LoadingState title="Loading plan" description="Checking for a saved plan." />
      ) : planner.isGenerating ? (
        <LoadingState
          title="Generating plan"
          description="AI is creating the selected next-day recruiting plan."
        />
      ) : planner.plan ? (
        <div className="space-y-6">
          <PlannerFocusCard plan={planner.plan} />
          <PlannerTaskList schedule={planner.plan.schedule} />
        </div>
      ) : (
        <EmptyState
          title="No plan for this date"
          description="Select a target date with previous-day recruiting data, then generate a plan."
        />
      )}
    </div>
  );
}
