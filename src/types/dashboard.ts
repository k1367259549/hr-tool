export type DashboardTimeRange = "today" | "week" | "month";

export type DashboardKpiTotals = {
  resumeCount: number;
  screenCount: number;
  phoneCount: number;
  interviewCount: number;
  offerCount: number;
  entryCount: number;
};

export type DashboardKpiRates = {
  screenRate: number;
  interviewRate: number;
  offerRate: number;
  entryRate: number;
};

export type DashboardKpiSummary = DashboardKpiTotals &
  DashboardKpiRates & {
    logCount: number;
  };

export type DashboardSummaryResponse = Record<DashboardTimeRange, DashboardKpiSummary>;

export type DashboardTrendItem = DashboardKpiTotals &
  DashboardKpiRates & {
    date: string;
  };

export type DashboardTrendsResponse = {
  items: DashboardTrendItem[];
};

export type DashboardMetricCardView = {
  id: string;
  title: string;
  value: string;
  description: string;
};

export type DashboardRangeSummaryView = {
  id: DashboardTimeRange;
  title: string;
  description: string;
  logCountLabel: string;
  metrics: DashboardMetricCardView[];
};

export type DashboardFunnelStageView = {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  rateLabel: string;
  maxValue: number;
};
