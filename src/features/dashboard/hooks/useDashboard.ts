"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFunnelStages,
  createRangeOptions,
  createRangeSummaryView,
  filterTrendItems
} from "@/features/dashboard/utils/dashboardView";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardFunnelStageView,
  DashboardRangeOptionView,
  DashboardRangeSummaryView,
  DashboardSummaryResponse,
  DashboardTimeRange,
  DashboardTrendItem,
  DashboardTrendsResponse
} from "@/types/dashboard";

type UseDashboardResult = {
  selectedRange: DashboardTimeRange;
  selectedSummary: DashboardRangeSummaryView | null;
  rangeOptions: DashboardRangeOptionView[];
  trendItems: DashboardTrendItem[];
  funnelStages: DashboardFunnelStageView[];
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  updateRange: (range: DashboardTimeRange) => void;
  refreshDashboard: () => Promise<void>;
};

export function useDashboard(): UseDashboardResult {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [trends, setTrends] = useState<DashboardTrendItem[]>([]);
  const [selectedRange, setSelectedRange] = useState<DashboardTimeRange>("week");
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

  const selectedSummary = useMemo<DashboardRangeSummaryView | null>(() => {
    if (!summary) {
      return null;
    }

    return createRangeSummaryView(selectedRange, summary[selectedRange]);
  }, [selectedRange, summary]);

  const rangeOptions = useMemo<DashboardRangeOptionView[]>(() => {
    if (!summary) {
      return [];
    }

    return createRangeOptions(summary);
  }, [summary]);

  const selectedTrendItems = useMemo<DashboardTrendItem[]>(
    () => filterTrendItems(trends, selectedRange),
    [selectedRange, trends]
  );

  const funnelStages = useMemo<DashboardFunnelStageView[]>(() => {
    if (!summary) {
      return [];
    }

    return createFunnelStages(summary[selectedRange]);
  }, [selectedRange, summary]);

  const isEmpty = useMemo<boolean>(() => {
    if (!summary) {
      return false;
    }

    return summary.all.logCount === 0;
  }, [summary]);

  const updateRange = useCallback((range: DashboardTimeRange): void => {
    setSelectedRange(range);
  }, []);

  return {
    selectedRange,
    selectedSummary,
    rangeOptions,
    trendItems: selectedTrendItems,
    funnelStages,
    isLoading,
    isEmpty,
    errorMessage,
    updateRange,
    refreshDashboard
  };
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
