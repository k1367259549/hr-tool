"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  DailyInsightsOutput,
  DailyRecruitingWorkspaceDto,
  DailySummaryOutput,
  DailyWorkspaceActivitySnapshot,
  DailyWorkspaceGenerateResult,
  ImprovementSuggestionsOutput,
  TomorrowPrioritiesOutput
} from "@/types/dailyWorkspace";

type UseDailyWorkspaceResult = {
  date: string;
  manualNotes: string;
  activitySnapshot: DailyWorkspaceActivitySnapshot | null;
  result: DailyWorkspaceGenerateResult | null;
  dailySummary: DailySummaryOutput | null;
  recruitingInsights: DailyInsightsOutput | null;
  tomorrowPriorities: TomorrowPrioritiesOutput | null;
  improvementSuggestions: ImprovementSuggestionsOutput | null;
  savedWorkspace: DailyRecruitingWorkspaceDto | null;
  isLoadingSnapshot: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  setDate: (value: string) => void;
  setManualNotes: (value: string) => void;
  updateDailySummary: (field: keyof DailySummaryOutput, value: string | string[]) => void;
  updateRecruitingInsights: (field: keyof DailyInsightsOutput, value: string | string[]) => void;
  updateTomorrowPriorities: (field: keyof TomorrowPrioritiesOutput, value: string | string[]) => void;
  updateImprovementSuggestions: (
    field: keyof ImprovementSuggestionsOutput,
    value: string | string[]
  ) => void;
  reloadSnapshot: () => Promise<void>;
  generate: () => Promise<void>;
  save: () => Promise<void>;
  cancel: () => void;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
};

export function useDailyWorkspace(): UseDailyWorkspaceResult {
  const [date, setDateState] = useState<string>(todayString());
  const [manualNotes, setManualNotes] = useState<string>("");
  const [activitySnapshot, setActivitySnapshot] = useState<DailyWorkspaceActivitySnapshot | null>(
    null
  );
  const [result, setResult] = useState<DailyWorkspaceGenerateResult | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummaryOutput | null>(null);
  const [recruitingInsights, setRecruitingInsights] = useState<DailyInsightsOutput | null>(null);
  const [tomorrowPriorities, setTomorrowPriorities] = useState<TomorrowPrioritiesOutput | null>(
    null
  );
  const [improvementSuggestions, setImprovementSuggestions] =
    useState<ImprovementSuggestionsOutput | null>(null);
  const [savedWorkspace, setSavedWorkspace] = useState<DailyRecruitingWorkspaceDto | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reloadSnapshot = useCallback(async (): Promise<void> => {
    setIsLoadingSnapshot(true);
    setErrorMessage(null);

    try {
      const snapshot = await requestJson<DailyWorkspaceActivitySnapshot>(
        `/api/daily-workspace?date=${encodeURIComponent(date)}`
      );

      setActivitySnapshot(snapshot);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingSnapshot(false);
    }
  }, [date]);

  useEffect(() => {
    void reloadSnapshot();
  }, [reloadSnapshot]);

  const setDate = useCallback((value: string): void => {
    setDateState(value);
    resetGeneratedState();
  }, []);

  const updateDailySummary = useCallback(
    (field: keyof DailySummaryOutput, value: string | string[]): void => {
      setDailySummary((currentOutput) =>
        currentOutput ? ({ ...currentOutput, [field]: value } as DailySummaryOutput) : currentOutput
      );
    },
    []
  );

  const updateRecruitingInsights = useCallback(
    (field: keyof DailyInsightsOutput, value: string | string[]): void => {
      setRecruitingInsights((currentOutput) =>
        currentOutput ? ({ ...currentOutput, [field]: value } as DailyInsightsOutput) : currentOutput
      );
    },
    []
  );

  const updateTomorrowPriorities = useCallback(
    (field: keyof TomorrowPrioritiesOutput, value: string | string[]): void => {
      setTomorrowPriorities((currentOutput) =>
        currentOutput ? ({ ...currentOutput, [field]: value } as TomorrowPrioritiesOutput) : currentOutput
      );
    },
    []
  );

  const updateImprovementSuggestions = useCallback(
    (field: keyof ImprovementSuggestionsOutput, value: string | string[]): void => {
      setImprovementSuggestions((currentOutput) =>
        currentOutput
          ? ({ ...currentOutput, [field]: value } as ImprovementSuggestionsOutput)
          : currentOutput
      );
    },
    []
  );

  const generate = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSavedWorkspace(null);

    try {
      const nextResult = await requestJson<DailyWorkspaceGenerateResult>("/api/daily-workspace", {
        body: JSON.stringify({
          date,
          manualNotes: normalizeOptionalText(manualNotes)
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      setResult(nextResult);
      setActivitySnapshot(nextResult.activitySnapshot);
      setDailySummary(nextResult.dailySummary);
      setRecruitingInsights(nextResult.recruitingInsights);
      setTomorrowPriorities(nextResult.tomorrowPriorities);
      setImprovementSuggestions(nextResult.improvementSuggestions);
      setSuccessMessage("每日招聘工作区已生成，请人工确认或编辑。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }, [date, manualNotes]);

  const save = useCallback(async (): Promise<void> => {
    if (!result || !dailySummary || !recruitingInsights || !tomorrowPriorities || !improvementSuggestions) {
      setErrorMessage("请先生成并确认每日工作区内容。");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const workspace = await requestJson<DailyRecruitingWorkspaceDto>("/api/daily-workspace/save", {
        body: JSON.stringify({
          ...result,
          dailySummary,
          improvementSuggestions,
          manualNotes: normalizeOptionalText(manualNotes),
          recruitingInsights,
          tomorrowPriorities
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      setSavedWorkspace(workspace);
      setSuccessMessage("每日招聘工作区已保存。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [dailySummary, improvementSuggestions, manualNotes, recruitingInsights, result, tomorrowPriorities]);

  const cancel = useCallback((): void => {
    resetGeneratedState();
    setErrorMessage(null);
  }, []);

  const dismissError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  const consumeSuccessMessage = useCallback((): string | null => {
    let consumedMessage: string | null = null;

    setSuccessMessage((currentMessage) => {
      consumedMessage = currentMessage;

      return null;
    });

    return consumedMessage;
  }, []);

  function resetGeneratedState(): void {
    setResult(null);
    setDailySummary(null);
    setRecruitingInsights(null);
    setTomorrowPriorities(null);
    setImprovementSuggestions(null);
    setSavedWorkspace(null);
  }

  return {
    activitySnapshot,
    cancel,
    consumeSuccessMessage,
    dailySummary,
    date,
    dismissError,
    errorMessage,
    generate,
    improvementSuggestions,
    isGenerating,
    isLoadingSnapshot,
    isSaving,
    manualNotes,
    recruitingInsights,
    reloadSnapshot,
    result,
    save,
    savedWorkspace,
    setDate,
    setManualNotes,
    successMessage,
    tomorrowPriorities,
    updateDailySummary,
    updateImprovementSuggestions,
    updateRecruitingInsights,
    updateTomorrowPriorities
  };
}

async function requestJson<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new DailyWorkspaceRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class DailyWorkspaceRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DailyWorkspaceRequestError";
    this.code = code;
  }
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length === 0 ? undefined : trimmedValue;
}

function todayString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
