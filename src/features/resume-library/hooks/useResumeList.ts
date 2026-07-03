"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResumeIntakeSource } from "@prisma/client";
import type { ApiResponse } from "@/types/api";
import type {
  ResumeFileType,
  ResumeLinkStatus,
  ResumeListResultDto,
  ResumeParsingStatus
} from "@/types/resumeLibrary";

export type ResumeListFilters = {
  search: string;
  fileType: ResumeFileType | "";
  parsingStatus: ResumeParsingStatus | "";
  intakeSource: ResumeIntakeSource | "";
  linkStatus: ResumeLinkStatus;
  page: number;
  pageSize: number;
};

export function useResumeList(initialFilters?: Partial<ResumeListFilters>): {
  error: string | null;
  filters: ResumeListFilters;
  isLoading: boolean;
  result: ResumeListResultDto | null;
  reload: () => Promise<void>;
  setFilters: (nextFilters: Partial<ResumeListFilters>) => void;
} {
  const [filters, setFiltersState] = useState<ResumeListFilters>({
    fileType: "",
    intakeSource: "",
    linkStatus: "all",
    page: 1,
    pageSize: 20,
    parsingStatus: "",
    search: "",
    ...initialFilters
  });
  const [result, setResult] = useState<ResumeListResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    params.set("linkStatus", filters.linkStatus);

    if (filters.search.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.fileType) {
      params.set("fileType", filters.fileType);
    }

    if (filters.parsingStatus) {
      params.set("parsingStatus", filters.parsingStatus);
    }

    if (filters.intakeSource) {
      params.set("intakeSource", filters.intakeSource);
    }

    return params.toString();
  }, [filters]);

  const loadResumes = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();

    requestIdRef.current = requestId;
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resumes?${queryString}`, {
        signal: controller.signal
      });
      const json = (await response.json()) as ApiResponse<ResumeListResultDto>;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "简历库加载失败。");
      }

      setResult(json.data);
    } catch (loadError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "简历库加载失败。");
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryString]);

  useEffect(() => {
    void loadResumes();

    return () => {
      abortRef.current?.abort();
    };
  }, [loadResumes]);

  return {
    error,
    filters,
    isLoading,
    reload: loadResumes,
    result,
    setFilters: (nextFilters) =>
      setFiltersState((current) => ({
        ...current,
        ...nextFilters,
        page: nextFilters.page ?? 1
      }))
  };
}
