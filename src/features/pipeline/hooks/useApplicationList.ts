"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  ApplicationListQuery,
  ApplicationListResultDto,
  ApplicationStage
} from "@/types/candidateApplication";

export type ApplicationListFilters = {
  search: string;
  stage: ApplicationStage | "";
  jobProfileId: string;
  owner: string;
  status: ApplicationListQuery["status"];
  page: number;
  pageSize: number;
};

export function useApplicationList(initialFilters?: Partial<ApplicationListFilters>): {
  error: string | null;
  filters: ApplicationListFilters;
  isLoading: boolean;
  result: ApplicationListResultDto | null;
  reload: () => Promise<void>;
  setFilters: (nextFilters: Partial<ApplicationListFilters>) => void;
} {
  const [filters, setFiltersState] = useState<ApplicationListFilters>({
    jobProfileId: "",
    owner: "",
    page: 1,
    pageSize: 20,
    search: "",
    stage: "",
    status: "open",
    ...initialFilters
  });
  const [result, setResult] = useState<ApplicationListResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    params.set("status", filters.status);

    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.stage) {
      params.set("stage", filters.stage);
    }

    if (filters.jobProfileId.trim()) {
      params.set("jobProfileId", filters.jobProfileId.trim());
    }

    if (filters.owner.trim()) {
      params.set("owner", filters.owner.trim());
    }

    return params.toString();
  }, [filters]);

  const loadApplications = useCallback(async () => {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications?${queryString}`);
      const json = (await response.json()) as ApiResponse<ApplicationListResultDto>;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "招聘流程加载失败。");
      }

      setResult(json.data);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "招聘流程加载失败。");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryString]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  return {
    error,
    filters,
    isLoading,
    reload: loadApplications,
    result,
    setFilters: (nextFilters) =>
      setFiltersState((current) => ({
        ...current,
        ...nextFilters,
        page: nextFilters.page ?? 1
      }))
  };
}
