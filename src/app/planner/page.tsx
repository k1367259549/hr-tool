import { PageHeader } from "@/components/layout/PageHeader";

export default function PlannerPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tomorrow Planner"
        description="Prepare structured next-day recruiting plans with priorities, schedules, goals, risks, and expected outcomes."
      />
      <section className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="max-w-lg text-sm leading-6 text-slate-500">
          Plan generation controls and read-only task sections will appear here when planner logic is implemented.
        </p>
      </section>
    </div>
  );
}
