"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { DashboardFunnel } from "@/features/dashboard/components/DashboardFunnel";
import { DashboardSummary } from "@/features/dashboard/components/DashboardSummary";
import { DashboardTrendChart } from "@/features/dashboard/components/DashboardTrendChart";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

export default function DashboardPage(): JSX.Element {
  const dashboard = useDashboard();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visualize recruiting KPI summaries, funnel movement, and recent performance trends."
      />

      {dashboard.isLoading ? (
        <LoadingState
          title="Loading dashboard"
          description="Fetching KPI summaries and recent trends."
        />
      ) : dashboard.errorMessage ? (
        <ErrorState
          title="Unable to load dashboard"
          message={dashboard.errorMessage}
          actionLabel="Retry"
          onAction={() => void dashboard.refreshDashboard()}
        />
      ) : dashboard.isEmpty ? (
        <EmptyState
          title="No dashboard data yet"
          description="Create daily logs to populate KPI summaries, trend charts, and funnel overview."
        />
      ) : (
        <>
          {dashboard.selectedSummary ? (
            <DashboardSummary
              summary={dashboard.selectedSummary}
              rangeOptions={dashboard.rangeOptions}
              selectedRange={dashboard.selectedRange}
              onRangeChange={dashboard.updateRange}
            />
          ) : null}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
            <DashboardTrendChart
              items={dashboard.trendItems}
              rangeLabel={dashboard.selectedSummary?.title ?? "selected range"}
            />
            <DashboardFunnel
              stages={dashboard.funnelStages}
              rangeLabel={dashboard.selectedSummary?.title ?? "selected range"}
            />
          </div>
        </>
      )}
    </div>
  );
}
