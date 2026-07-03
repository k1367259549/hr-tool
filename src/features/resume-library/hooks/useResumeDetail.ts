"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { ResumeDetailDto, ResumeMetadataUpdateInput } from "@/types/resumeLibrary";

export function useResumeDetail(resumeId: string): {
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  reload: () => Promise<void>;
  resume: ResumeDetailDto | null;
  updateMetadata: (input: ResumeMetadataUpdateInput) => Promise<void>;
} {
  const [resume, setResume] = useState<ResumeDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadResume = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        cache: "no-store"
      });
      const json = (await response.json()) as ApiResponse<ResumeDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "简历详情加载失败。");
      }

      setResume(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "简历详情加载失败。");
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    void loadResume();
  }, [loadResume]);

  async function updateMetadata(input: ResumeMetadataUpdateInput): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        body: JSON.stringify(input),
        headers: {
          "content-type": "application/json"
        },
        method: "PATCH"
      });
      const json = (await response.json()) as ApiResponse<ResumeDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "简历元数据保存失败。");
      }

      setResume(json.data);
      window.alert("简历元数据已保存。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "简历元数据保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    error,
    isLoading,
    isSaving,
    reload: loadResume,
    resume,
    updateMetadata
  };
}
