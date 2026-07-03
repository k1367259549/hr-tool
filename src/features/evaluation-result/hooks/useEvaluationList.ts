"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  ResumeEvaluationListResultDto,
  ResumeEvaluationStatus
} from "@/types/resumeEvaluationResult";

export type EvaluationListFilters = {
  resumeId: string;
  jobProfileId: string;
  templateVersionId: string;
  status: ResumeEvaluationStatus | "";
  page: number;
  pageSize: number;
};

export function useEvaluationList(
  initialFilters?: Partial<EvaluationListFilters>
): {
  error: string | null;
  filters: EvaluationListFilters;
  isLoading: boolean;
  result: ResumeEvaluationListResultDto | null;
  reload: () => Promise<void>;
  setFilters: (nextFilters: Partial<EvaluationListFilters>) => void;
} {
  const [filters, setFiltersState] = useState<EvaluationListFilters>({
    jobProfileId: "",
    page: 1,
    pageSize: 20,
    resumeId: "",
    status: "",
    templateVersionId: "",
    ...initialFilters
  });
  const [result, setResult] = useState<ResumeEvaluationListResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));

    if (filters.resumeId.trim()) {
      params.set("resumeId", filters.resumeId.trim());
    }

    if (filters.jobProfileId.trim()) {
      params.set("jobProfileId", filters.jobProfileId.trim());
    }

    if (filters.templateVersionId.trim()) {
      params.set("templateVersionId", filters.templateVersionId.trim());
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    return params.toString();
  }, [filters]);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();

    requestIdRef.current = requestId;
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resume-evaluations?${queryString}`, {
        signal: controller.signal
      });
      const json = (await response.json()) as ApiResponse<ResumeEvaluationListResultDto>;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "评估列表加载失败。");
      }

      setResult(json.data);
    } catch (loadError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "评估列表加载失败。");
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryString]);

  useEffect(() => {
    void load();

    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  return {
    error,
    filters,
    isLoading,
    reload: load,
    result,
    setFilters: (nextFilters) =>
      setFiltersState((current) => ({
        ...current,
        ...nextFilters,
        page: nextFilters.page ?? 1
      }))
  };
}
