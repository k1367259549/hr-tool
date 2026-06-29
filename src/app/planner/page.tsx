import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function PlannerPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tomorrow Planner"
        description="Prepare structured next-day recruiting plans with priorities, schedules, goals, risks, and expected outcomes."
      />
      <EmptyState
        title="No plan generated yet"
        description="Plan generation controls and read-only task sections will appear here when planner logic is implemented."
      />
    </div>
  );
}
