"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  ApplicationStage,
  ApplicationTransitionInput,
  ApplicationUpdateInput,
  CandidateApplicationDetailDto
} from "@/types/candidateApplication";

export function useApplicationDetail(applicationId: string): {
  application: CandidateApplicationDetailDto | null;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => Promise<void>;
  transitionStage: (toStage: ApplicationStage, note?: string) => Promise<void>;
  updateMetadata: (input: ApplicationUpdateInput) => Promise<void>;
} {
  const [application, setApplication] = useState<CandidateApplicationDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadApplication = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}`);
      const json = (await response.json()) as ApiResponse<CandidateApplicationDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "招聘流程详情加载失败。");
      }

      setApplication(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "招聘流程详情加载失败。");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  async function mutateApplication(
    request: () => Promise<Response>,
    successMessage: string
  ): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await request();
      const json = (await response.json()) as ApiResponse<CandidateApplicationDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "招聘流程保存失败。");
      }

      setApplication(json.data);
      window.alert(successMessage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "招聘流程保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    application,
    error,
    isLoading,
    isSaving,
    reload: loadApplication,
    transitionStage: async (toStage, note) =>
      mutateApplication(
        () =>
          fetch(`/api/applications/${applicationId}/transition`, {
            body: JSON.stringify({
              note,
              toStage
            } satisfies ApplicationTransitionInput),
            headers: {
              "content-type": "application/json"
            },
            method: "POST"
          }),
        "招聘阶段已更新。"
      ),
    updateMetadata: async (input) =>
      mutateApplication(
        () =>
          fetch(`/api/applications/${applicationId}`, {
            body: JSON.stringify(input),
            headers: {
              "content-type": "application/json"
            },
            method: "PATCH"
          }),
        "招聘流程已保存。"
      )
  };
}
