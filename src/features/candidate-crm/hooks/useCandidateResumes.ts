"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  AvailableResumeListDto,
  SafeCandidateResumeDto
} from "@/types/candidateResumeLink";

type AvailableResumeFilters = {
  search: string;
  fileType: string;
  page: number;
  pageSize: number;
};

export function useCandidateResumes(
  candidateId: string,
  onChanged: () => Promise<void>
): {
  availableError: string | null;
  availableFilters: AvailableResumeFilters;
  availableResult: AvailableResumeListDto | null;
  candidateResumes: SafeCandidateResumeDto[];
  conflictMessage: string | null;
  isLoadingAvailable: boolean;
  isLoadingLinked: boolean;
  isMutating: boolean;
  linkedError: string | null;
  linkResume: (resumeId: string) => Promise<void>;
  loadAvailableResumes: () => Promise<void>;
  loadCandidateResumes: () => Promise<void>;
  setAvailableFilters: (filters: AvailableResumeFilters) => void;
  unlinkResume: (resumeId: string) => Promise<void>;
} {
  const [candidateResumes, setCandidateResumes] = useState<SafeCandidateResumeDto[]>([]);
  const [availableResult, setAvailableResult] = useState<AvailableResumeListDto | null>(null);
  const [availableFilters, setAvailableFilters] = useState<AvailableResumeFilters>({
    fileType: "",
    page: 1,
    pageSize: 5,
    search: ""
  });
  const [isLoadingLinked, setIsLoadingLinked] = useState(true);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [linkedError, setLinkedError] = useState<string | null>(null);
  const [availableError, setAvailableError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const loadCandidateResumes = useCallback(async () => {
    setIsLoadingLinked(true);
    setLinkedError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/resumes`);
      const json = (await response.json()) as ApiResponse<SafeCandidateResumeDto[]>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "候选人关联简历加载失败。");
      }

      setCandidateResumes(json.data);
    } catch (error) {
      setLinkedError(error instanceof Error ? error.message : "候选人关联简历加载失败。");
    } finally {
      setIsLoadingLinked(false);
    }
  }, [candidateId]);

  const loadAvailableResumes = useCallback(async () => {
    setIsLoadingAvailable(true);
    setAvailableError(null);

    try {
      const params = new URLSearchParams({
        page: String(availableFilters.page),
        pageSize: String(availableFilters.pageSize)
      });

      if (availableFilters.search.trim()) {
        params.set("search", availableFilters.search.trim());
      }

      if (availableFilters.fileType) {
        params.set("fileType", availableFilters.fileType);
      }

      const response = await fetch(`/api/resumes/available?${params.toString()}`);
      const json = (await response.json()) as ApiResponse<AvailableResumeListDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "可关联简历加载失败。");
      }

      setAvailableResult(json.data);
    } catch (error) {
      setAvailableError(error instanceof Error ? error.message : "可关联简历加载失败。");
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [availableFilters]);

  useEffect(() => {
    void loadCandidateResumes();
  }, [loadCandidateResumes]);

  useEffect(() => {
    void loadAvailableResumes();
  }, [loadAvailableResumes]);

  async function mutateResumeLink(request: () => Promise<Response>, successMessage: string): Promise<void> {
    setIsMutating(true);
    setConflictMessage(null);
    setLinkedError(null);

    try {
      const response = await request();
      const json = (await response.json()) as ApiResponse<SafeCandidateResumeDto>;

      if (!json.success || !json.data) {
        if (json.error?.code === "CONFLICT") {
          setConflictMessage(json.error.message);
        }

        throw new Error(json.error?.message ?? "简历关联操作失败。");
      }

      await Promise.all([loadCandidateResumes(), loadAvailableResumes(), onChanged()]);
      window.alert(successMessage);
    } catch (error) {
      setLinkedError(error instanceof Error ? error.message : "简历关联操作失败。");
    } finally {
      setIsMutating(false);
    }
  }

  return {
    availableError,
    availableFilters,
    availableResult,
    candidateResumes,
    conflictMessage,
    isLoadingAvailable,
    isLoadingLinked,
    isMutating,
    linkedError,
    linkResume: async (resumeId) =>
      mutateResumeLink(
        () =>
          fetch(`/api/candidates/${candidateId}/resumes`, {
            body: JSON.stringify({
              resumeId
            }),
            headers: {
              "content-type": "application/json"
            },
            method: "POST"
          }),
        "简历已关联。"
      ),
    loadAvailableResumes,
    loadCandidateResumes,
    setAvailableFilters,
    unlinkResume: async (resumeId) =>
      mutateResumeLink(
        () =>
          fetch(`/api/candidates/${candidateId}/resumes/${resumeId}`, {
            method: "DELETE"
          }),
        "简历关联已解除。"
      )
  };
}
