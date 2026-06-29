import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visualize recruiting KPIs, funnel movement, and performance trends once data features are implemented."
      />
      <section className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="max-w-lg text-sm leading-6 text-slate-500">
          Dashboard summary cards, trend charts, and funnel views will appear here in a future task.
        </p>
      </section>
    </div>
  );
}
