"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardFunnelStageView,
  DashboardKpiSummary,
  DashboardMetricCardView,
  DashboardRangeSummaryView,
  DashboardSummaryResponse,
  DashboardTimeRange,
  DashboardTrendItem,
  DashboardTrendsResponse
} from "@/types/dashboard";

type UseDashboardResult = {
  rangeSummaries: DashboardRangeSummaryView[];
  trendItems: DashboardTrendItem[];
  funnelStages: DashboardFunnelStageView[];
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  refreshDashboard: () => Promise<void>;
};

type MetricDefinition = {
  id: keyof Omit<DashboardKpiSummary, "logCount">;
  title: string;
  description: string;
  format: "number" | "rate";
};

const metricDefinitions: MetricDefinition[] = [
  {
    id: "resumeCount",
    title: "Resume Count",
    description: "Total resumes received.",
    format: "number"
  },
  {
    id: "screenCount",
    title: "Screen Count",
    description: "Candidates screened.",
    format: "number"
  },
  {
    id: "phoneCount",
    title: "Phone Count",
    description: "Phone communications completed.",
    format: "number"
  },
  {
    id: "interviewCount",
    title: "Interview Count",
    description: "Interviews completed.",
    format: "number"
  },
  {
    id: "offerCount",
    title: "Offer Count",
    description: "Offers sent.",
    format: "number"
  },
  {
    id: "entryCount",
    title: "Entry Count",
    description: "Entries completed.",
    format: "number"
  },
  {
    id: "screenRate",
    title: "Screen Rate",
    description: "Screened resumes divided by resumes.",
    format: "rate"
  },
  {
    id: "interviewRate",
    title: "Interview Rate",
    description: "Interviews divided by screened candidates.",
    format: "rate"
  },
  {
    id: "offerRate",
    title: "Offer Rate",
    description: "Offers divided by interviews.",
    format: "rate"
  },
  {
    id: "entryRate",
    title: "Entry Rate",
    description: "Entries divided by offers.",
    format: "rate"
  }
];

const rangeLabels: Record<
  DashboardTimeRange,
  {
    title: string;
    description: string;
  }
> = {
  today: {
    title: "Today Summary",
    description: "Current UTC day recruiting performance."
  },
  week: {
    title: "Weekly Summary",
    description: "Current UTC week recruiting performance."
  },
  month: {
    title: "Monthly Summary",
    description: "Current UTC month recruiting performance."
  }
};

const rangeOrder: DashboardTimeRange[] = ["today", "week", "month"];

const numberFormatter = new Intl.NumberFormat("en");
const rateFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
  style: "percent"
});

export function useDashboard(): UseDashboardResult {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [trends, setTrends] = useState<DashboardTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDashboard = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextSummary, nextTrends] = await Promise.all([
        requestApi<DashboardSummaryResponse>("/api/dashboard/summary"),
        requestApi<DashboardTrendsResponse>("/api/dashboard/trends")
      ]);

      setSummary(nextSummary);
      setTrends(nextTrends.items);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const rangeSummaries = useMemo<DashboardRangeSummaryView[]>(() => {
    if (!summary) {
      return [];
    }

    return rangeOrder.map((range) => createRangeSummaryView(range, summary[range]));
  }, [summary]);

  const funnelStages = useMemo<DashboardFunnelStageView[]>(() => {
    if (!summary) {
      return [];
    }

    return createFunnelStages(summary.month);
  }, [summary]);

  const isEmpty = useMemo<boolean>(() => {
    if (!summary) {
      return false;
    }

    return summary.today.logCount === 0 && summary.week.logCount === 0 && summary.month.logCount === 0;
  }, [summary]);

  return {
    rangeSummaries,
    trendItems: trends,
    funnelStages,
    isLoading,
    isEmpty,
    errorMessage,
    refreshDashboard
  };
}

function createRangeSummaryView(
  range: DashboardTimeRange,
  summary: DashboardKpiSummary
): DashboardRangeSummaryView {
  return {
    id: range,
    title: rangeLabels[range].title,
    description: rangeLabels[range].description,
    logCountLabel: `${formatNumber(summary.logCount)} logs`,
    metrics: metricDefinitions.map((definition) => createMetricCardView(definition, summary))
  };
}

function createMetricCardView(
  definition: MetricDefinition,
  summary: DashboardKpiSummary
): DashboardMetricCardView {
  const rawValue = summary[definition.id];

  return {
    id: definition.id,
    title: definition.title,
    value: definition.format === "rate" ? formatRate(rawValue) : formatNumber(rawValue),
    description: definition.description
  };
}

function createFunnelStages(summary: DashboardKpiSummary): DashboardFunnelStageView[] {
  const maxValue = Math.max(summary.resumeCount, 1);

  return [
    {
      id: "resume",
      label: "Resumes",
      value: summary.resumeCount,
      valueLabel: formatNumber(summary.resumeCount),
      rateLabel: "Base",
      maxValue
    },
    {
      id: "screen",
      label: "Screens",
      value: summary.screenCount,
      valueLabel: formatNumber(summary.screenCount),
      rateLabel: formatRate(summary.screenRate),
      maxValue
    },
    {
      id: "phone",
      label: "Phone",
      value: summary.phoneCount,
      valueLabel: formatNumber(summary.phoneCount),
      rateLabel: "Contact",
      maxValue
    },
    {
      id: "interview",
      label: "Interviews",
      value: summary.interviewCount,
      valueLabel: formatNumber(summary.interviewCount),
      rateLabel: formatRate(summary.interviewRate),
      maxValue
    },
    {
      id: "offer",
      label: "Offers",
      value: summary.offerCount,
      valueLabel: formatNumber(summary.offerCount),
      rateLabel: formatRate(summary.offerRate),
      maxValue
    },
    {
      id: "entry",
      label: "Entries",
      value: summary.entryCount,
      valueLabel: formatNumber(summary.entryCount),
      rateLabel: formatRate(summary.entryRate),
      maxValue
    }
  ];
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatRate(value: number): string {
  return rateFormatter.format(value);
}

async function requestApi<TData>(path: string): Promise<TData> {
  const response = await fetch(path);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}
