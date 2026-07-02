"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CandidateListFilterState } from "@/features/candidate-crm/components/CandidateListFilters";
import type { CandidateListResultDto } from "@/types/candidate";
import type { ApiResponse } from "@/types/api";

const defaultFilters: CandidateListFilterState = {
  owner: "",
  search: "",
  sourceChannel: "",
  status: ""
};

export function useCandidateList(): {
  data: CandidateListResultDto | null;
  error: string | null;
  filters: CandidateListFilterState;
  isLoading: boolean;
  page: number;
  reload: () => Promise<void>;
  setFilters: (filters: CandidateListFilterState) => void;
  setPage: (page: number) => void;
} {
  const [data, setData] = useState<CandidateListResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<CandidateListFilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    appendParam(params, "search", filters.search);
    appendParam(params, "status", filters.status);
    appendParam(params, "sourceChannel", filters.sourceChannel);
    appendParam(params, "owner", filters.owner);

    return params.toString();
  }, [filters, page]);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidates?${queryString}`);
      const json = (await response.json()) as ApiResponse<CandidateListResultDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "候选人列表加载失败。");
      }

      setData(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "候选人列表加载失败。");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  return {
    data,
    error,
    filters,
    isLoading,
    page,
    reload: loadCandidates,
    setFilters: (nextFilters) => {
      setFiltersState(nextFilters);
      setPage(1);
    },
    setPage
  };
}

function appendParam(params: URLSearchParams, key: string, value: string): void {
  if (value.trim()) {
    params.set(key, value.trim());
  }
}
