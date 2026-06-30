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
        title="仪表盘"
        description="查看招聘 KPI 汇总、漏斗转化和近期表现趋势。"
      />

      {dashboard.isLoading ? (
        <LoadingState
          title="正在加载仪表盘"
          description="正在获取 KPI 汇总和近期趋势。"
        />
      ) : dashboard.errorMessage ? (
        <ErrorState
          title="无法加载仪表盘"
          message={dashboard.errorMessage}
          actionLabel="重试"
          onAction={() => void dashboard.refreshDashboard()}
        />
      ) : dashboard.isEmpty ? (
        <EmptyState
          title="暂无仪表盘数据"
          description="创建每日记录后，这里会显示 KPI 汇总、趋势图和漏斗概览。"
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
              rangeLabel={dashboard.selectedSummary?.title ?? "所选范围"}
            />
            <DashboardFunnel
              stages={dashboard.funnelStages}
              rangeLabel={dashboard.selectedSummary?.title ?? "所选范围"}
            />
          </div>
        </>
      )}
    </div>
  );
}
