"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { ApplicationListResultDto } from "@/types/candidateApplication";

export function useCandidateApplications(candidateId: string): {
  applications: ApplicationListResultDto["applications"];
  error: string | null;
  isLoading: boolean;
  reload: () => Promise<void>;
} {
  const [applications, setApplications] = useState<ApplicationListResultDto["applications"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications?candidateId=${encodeURIComponent(candidateId)}&status=all&pageSize=100`);
      const json = (await response.json()) as ApiResponse<ApplicationListResultDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "候选人招聘流程加载失败。");
      }

      setApplications(json.data.applications);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "候选人招聘流程加载失败。");
    } finally {
      setIsLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  return {
    applications,
    error,
    isLoading,
    reload: loadApplications
  };
}
