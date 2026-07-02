"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { CandidateDto, CandidateUpdateInput } from "@/types/candidate";

export function useCandidateDetail(candidateId: string): {
  archiveCandidate: () => Promise<void>;
  candidate: CandidateDto | null;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  restoreCandidate: () => Promise<void>;
  updateCandidate: (input: CandidateUpdateInput) => Promise<void>;
} {
  const [candidate, setCandidate] = useState<CandidateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCandidate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      const json = (await response.json()) as ApiResponse<CandidateDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "候选人详情加载失败。");
      }

      setCandidate(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "候选人详情加载失败。");
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    void loadCandidate();
  }, [loadCandidate]);

  async function mutateCandidate(
    request: () => Promise<Response>,
    successMessage: string
  ): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await request();
      const json = (await response.json()) as ApiResponse<CandidateDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "候选人保存失败。");
      }

      setCandidate(json.data);
      window.alert(successMessage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "候选人保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    archiveCandidate: async () =>
      mutateCandidate(
        () =>
          fetch(`/api/candidates/${candidateId}`, {
            method: "DELETE"
          }),
        "候选人已归档。"
      ),
    candidate,
    error,
    isLoading,
    isSaving,
    restoreCandidate: async () =>
      mutateCandidate(
        () =>
          fetch(`/api/candidates/${candidateId}/restore`, {
            method: "POST"
          }),
        "候选人已恢复。"
      ),
    updateCandidate: async (input) =>
      mutateCandidate(
        () =>
          fetch(`/api/candidates/${candidateId}`, {
            body: JSON.stringify(input),
            headers: {
              "content-type": "application/json"
            },
            method: "PATCH"
          }),
        "候选人已保存。"
      )
  };
}
