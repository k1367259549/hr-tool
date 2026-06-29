import type {
  DashboardKpiRates,
  DashboardKpiSummary,
  DashboardKpiTotals,
  DashboardTrendItem
} from "@/types/dashboard";
import type { RecruitLog } from "@/types/log";

const emptyTotals: DashboardKpiTotals = {
  resumeCount: 0,
  screenCount: 0,
  phoneCount: 0,
  interviewCount: 0,
  offerCount: 0,
  entryCount: 0
};

function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(4));
}

export function calculateKpiTotals(logs: RecruitLog[]): DashboardKpiTotals {
  return logs.reduce<DashboardKpiTotals>(
    (totals, log) => ({
      resumeCount: totals.resumeCount + log.resumeCount,
      screenCount: totals.screenCount + log.screenCount,
      phoneCount: totals.phoneCount + log.phoneCount,
      interviewCount: totals.interviewCount + log.interviewCount,
      offerCount: totals.offerCount + log.offerCount,
      entryCount: totals.entryCount + log.entryCount
    }),
    { ...emptyTotals }
  );
}

export function calculateKpiRates(totals: DashboardKpiTotals): DashboardKpiRates {
  return {
    screenRate: calculateRate(totals.screenCount, totals.resumeCount),
    interviewRate: calculateRate(totals.interviewCount, totals.screenCount),
    offerRate: calculateRate(totals.offerCount, totals.interviewCount),
    entryRate: calculateRate(totals.entryCount, totals.offerCount)
  };
}

export function calculateKpiSummary(logs: RecruitLog[]): DashboardKpiSummary {
  const totals = calculateKpiTotals(logs);

  return {
    ...totals,
    ...calculateKpiRates(totals),
    logCount: logs.length
  };
}

export function createDashboardTrendItem(log: RecruitLog): DashboardTrendItem {
  const totals: DashboardKpiTotals = {
    resumeCount: log.resumeCount,
    screenCount: log.screenCount,
    phoneCount: log.phoneCount,
    interviewCount: log.interviewCount,
    offerCount: log.offerCount,
    entryCount: log.entryCount
  };

  return {
    date: log.date.toISOString().slice(0, 10),
    ...totals,
    ...calculateKpiRates(totals)
  };
}
