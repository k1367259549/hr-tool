"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { ResumeEvaluationDetailDto } from "@/types/resumeEvaluationResult";

export function useEvaluationDetail(evaluationId: string): {
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  evaluation: ResumeEvaluationDetailDto | null;
  reload: () => Promise<void>;
  review: (actor?: string) => Promise<void>;
  reopen: (actor?: string, note?: string) => Promise<void>;
} {
  const [evaluation, setEvaluation] = useState<ResumeEvaluationDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();

    requestIdRef.current = requestId;
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resume-evaluations/${evaluationId}`, {
        signal: controller.signal
      });
      const json = (await response.json()) as ApiResponse<ResumeEvaluationDetailDto>;

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "评估详情加载失败。");
      }

      setEvaluation(json.data);
    } catch (loadError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "评估详情加载失败。");
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [evaluationId]);

  useEffect(() => {
    void load();

    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const review = useCallback(
    async (actor?: string) => {
      if (!evaluation) {
        return;
      }

      setIsSaving(true);

      try {
        const response = await fetch(`/api/resume-evaluations/${evaluationId}/review`, {
          body: JSON.stringify({ actor: actor ?? null, expectedRevision: evaluation.revision }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });
        const json = (await response.json()) as ApiResponse<ResumeEvaluationDetailDto>;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message ?? "标记审阅失败。");
        }

        setEvaluation(json.data);
      } finally {
        setIsSaving(false);
      }
    },
    [evaluation, evaluationId]
  );

  const reopen = useCallback(
    async (actor?: string, note = "重新开放评估。") => {
      if (!evaluation) {
        return;
      }

      setIsSaving(true);

      try {
        const response = await fetch(`/api/resume-evaluations/${evaluationId}/reopen`, {
          body: JSON.stringify({
            actor: actor ?? null,
            expectedRevision: evaluation.revision,
            note
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });
        const json = (await response.json()) as ApiResponse<ResumeEvaluationDetailDto>;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message ?? "重新开放失败。");
        }

        setEvaluation(json.data);
      } finally {
        setIsSaving(false);
      }
    },
    [evaluation, evaluationId]
  );

  return { error, evaluation, isLoading, isSaving, reload: load, reopen, review };
}
