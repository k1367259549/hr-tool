"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  EvaluationTemplateDetailDto,
  EvaluationTemplateUpdateInput,
  EvaluationTemplateVersionSummaryDto,
  EvaluationTemplateVersionUpdateInput
} from "@/types/evaluationTemplate";

export function useEvaluationTemplateDetail(templateId: string): {
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  template: EvaluationTemplateDetailDto | null;
  archiveTemplate: () => Promise<void>;
  createNextDraft: () => Promise<void>;
  publishVersion: (versionId: string) => Promise<void>;
  reload: () => Promise<void>;
  restoreTemplate: () => Promise<void>;
  updateDraft: (versionId: string, input: EvaluationTemplateVersionUpdateInput) => Promise<void>;
  updateTemplate: (input: EvaluationTemplateUpdateInput) => Promise<void>;
} {
  const [template, setTemplate] = useState<EvaluationTemplateDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/evaluation-templates/${templateId}`, {
        signal: controller.signal
      });
      const json = (await response.json()) as ApiResponse<EvaluationTemplateDetailDto>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "评价标准详情加载失败。");
      }

      setTemplate(json.data);
    } catch (loadError) {
      if (controller.signal.aborted) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "评价标准详情加载失败。");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [templateId]);

  useEffect(() => {
    void reload();

    return () => {
      abortRef.current?.abort();
    };
  }, [reload]);

  async function runMutation<TData>(
    request: () => Promise<Response>,
    applyData?: (data: TData) => void
  ): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const response = await request();
      const json = (await response.json()) as ApiResponse<TData>;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "操作失败。");
      }

      if (applyData) {
        applyData(json.data);
      } else {
        await reload();
      }
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "操作失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    archiveTemplate: () =>
      runMutation<EvaluationTemplateDetailDto>(
        () =>
          fetch(`/api/evaluation-templates/${templateId}/archive`, {
            method: "POST"
          }),
        setTemplate
      ),
    createNextDraft: () =>
      runMutation<EvaluationTemplateVersionSummaryDto>(
        () =>
          fetch(`/api/evaluation-templates/${templateId}/versions`, {
            method: "POST"
          }),
        () => void reload()
      ),
    error,
    isLoading,
    isSaving,
    publishVersion: (versionId) =>
      runMutation<EvaluationTemplateVersionSummaryDto>(
        () =>
          fetch(`/api/evaluation-template-versions/${versionId}/publish`, {
            method: "POST"
          }),
        () => void reload()
      ),
    reload,
    restoreTemplate: () =>
      runMutation<EvaluationTemplateDetailDto>(
        () =>
          fetch(`/api/evaluation-templates/${templateId}/restore`, {
            method: "POST"
          }),
        setTemplate
      ),
    template,
    updateDraft: (versionId, input) =>
      runMutation<EvaluationTemplateVersionSummaryDto>(
        () =>
          fetch(`/api/evaluation-template-versions/${versionId}`, {
            body: JSON.stringify(input),
            headers: {
              "Content-Type": "application/json"
            },
            method: "PATCH"
          }),
        () => void reload()
      ),
    updateTemplate: (input) =>
      runMutation<EvaluationTemplateDetailDto>(
        () =>
          fetch(`/api/evaluation-templates/${templateId}`, {
            body: JSON.stringify(input),
            headers: {
              "Content-Type": "application/json"
            },
            method: "PATCH"
          }),
        setTemplate
      )
  };
}
