"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ExportMarkdownButton } from "@/components/shared/ExportMarkdownButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/components/shared/ToastProvider";
import { PlannerFocusCard } from "@/features/planner/components/PlannerFocusCard";
import { PlannerGeneratePanel } from "@/features/planner/components/PlannerGeneratePanel";
import { PlannerTaskList } from "@/features/planner/components/PlannerTaskList";
import { usePlanner } from "@/features/planner/hooks/usePlanner";

export default function PlannerPage(): JSX.Element {
  const planner = usePlanner();
  const { showToast } = useToast();
  const { consumeSuccessMessage, successMessage } = planner;

  useEffect(() => {
    const message = consumeSuccessMessage();

    if (message) {
      showToast(message, "success");
    }
  }, [consumeSuccessMessage, showToast, successMessage]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tomorrow Planner"
        description="Generate and view structured next-day recruiting plans."
      />
      <div className="flex justify-end">
        <ExportMarkdownButton date={getReportDateForPlan(planner.selectedDate)} />
      </div>
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
          actionLabel="Dismiss"
          onAction={planner.dismissError}
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

function getReportDateForPlan(planDate: string): string {
  if (!planDate) {
    return "";
  }

  const date = new Date(`${planDate}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}
