"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  EvaluationTemplateListResultDto,
  EvaluationTemplateStatus
} from "@/types/evaluationTemplate";

export type EvaluationTemplateListFilters = {
  search: string;
  status: EvaluationTemplateStatus | "";
  page: number;
  pageSize: number;
};

export function useEvaluationTemplateList(initialFilters?: Partial<EvaluationTemplateListFilters>): {
  error: string | null;
  filters: EvaluationTemplateListFilters;
  isLoading: boolean;
  result: EvaluationTemplateListResultDto | null;
  reload: () => Promise<void>;
  setFilters: (nextFilters: Partial<EvaluationTemplateListFilters>) => void;
} {
  const [filters, setFiltersState] = useState<EvaluationTemplateListFilters>({
    page: 1,
    pageSize: 20,
    search: "",
    status: "",
    ...initialFilters
  });
  const [result, setResult] = useState<EvaluationTemplateListResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));

    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    return params.toString();
  }, [filters]);

  const loadTemplates = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();

    requestIdRef.current = requestId;
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/evaluation-templates?${queryString}`, {
        signal: controller.signal
      });
      const json = (await response.json()) as ApiResponse<EvaluationTemplateListResultDto>;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "评价标准加载失败。");
      }

      setResult(json.data);
    } catch (loadError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "评价标准加载失败。");
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryString]);

  useEffect(() => {
    void loadTemplates();

    return () => {
      abortRef.current?.abort();
    };
  }, [loadTemplates]);

  return {
    error,
    filters,
    isLoading,
    reload: loadTemplates,
    result,
    setFilters: (nextFilters) =>
      setFiltersState((current) => ({
        ...current,
        ...nextFilters,
        page: nextFilters.page ?? 1
      }))
  };
}
