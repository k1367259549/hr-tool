import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visualize recruiting KPIs, funnel movement, and performance trends once data features are implemented."
      />
      <EmptyState
        title="No dashboard data yet"
        description="Dashboard summary cards, trend charts, and funnel views will appear here in a future task."
      />
    </div>
  );
}
