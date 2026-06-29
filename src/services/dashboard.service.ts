import { logRepository } from "@/repositories/log.repository";
import type {
  DashboardKpiSummary,
  DashboardSummaryResponse,
  DashboardTrendsResponse
} from "@/types/dashboard";
import { calculateKpiSummary, createDashboardTrendItem } from "@/utils/kpi";

const dashboardTrendLimit = 30;

type DateRange = {
  startDate: Date;
  endDate: Date;
};

function getUtcDayRange(date: Date): DateRange {
  const startDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 1);

  return {
    startDate,
    endDate
  };
}

function getUtcWeekRange(date: Date): DateRange {
  const dayRange = getUtcDayRange(date);
  const dayOfWeek = dayRange.startDate.getUTCDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const startDate = new Date(dayRange.startDate);
  startDate.setUTCDate(dayRange.startDate.getUTCDate() - daysFromMonday);
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 7);

  return {
    startDate,
    endDate
  };
}

function getUtcMonthRange(date: Date): DateRange {
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

  return {
    startDate,
    endDate
  };
}

async function getSummaryForRange(range: DateRange): Promise<DashboardKpiSummary> {
  const logs = await logRepository.findMany(range);

  return calculateKpiSummary(logs);
}

export const dashboardService = {
  async getSummary(referenceDate: Date = new Date()): Promise<DashboardSummaryResponse> {
    const [today, week, month] = await Promise.all([
      getSummaryForRange(getUtcDayRange(referenceDate)),
      getSummaryForRange(getUtcWeekRange(referenceDate)),
      getSummaryForRange(getUtcMonthRange(referenceDate))
    ]);

    return {
      today,
      week,
      month
    };
  },

  async getTrends(limit: number = dashboardTrendLimit): Promise<DashboardTrendsResponse> {
    const logs = await logRepository.findMany({
      limit
    });
    const items = [...logs].reverse().map(createDashboardTrendItem);

    return {
      items
    };
  }
};
