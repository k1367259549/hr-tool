"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  DailyPlanDto,
  PlannerPlanView,
  PlanPriorityValue,
  PlanScheduleItem,
  PlanScheduleTime
} from "@/types/planner";

type UsePlannerResult = {
  selectedDate: string;
  plan: PlannerPlanView | null;
  isLoading: boolean;
  isGenerating: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  hasPlan: boolean;
  updateDate: (date: string) => void;
  loadPlan: () => Promise<void>;
  generatePlan: () => Promise<void>;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
};

const scheduleTimes: PlanScheduleTime[] = ["morning", "afternoon", "evening"];
const priorities: PlanPriorityValue[] = ["LOW", "MEDIUM", "HIGH"];

export function usePlanner(): UsePlannerResult {
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowInputDate());
  const [plan, setPlan] = useState<PlannerPlanView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasPlan = useMemo<boolean>(() => plan !== null, [plan]);

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

  const loadPlanForDate = useCallback(async (date: string): Promise<void> => {
    if (!date) {
      setPlan(null);
      setErrorMessage("日期为必填项。");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextPlan = await requestApi<DailyPlanDto>(`/api/planner/date/${encodeURIComponent(date)}`);
      setPlan(createPlannerPlanView(nextPlan, date));
    } catch (error) {
      if (isNotFoundError(error)) {
        setPlan(null);
      } else {
        setPlan(null);
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlanForDate(selectedDate);
  }, [loadPlanForDate, selectedDate]);

  const updateDate = useCallback((date: string): void => {
    setSelectedDate(date);
  }, []);

  const loadPlan = useCallback(async (): Promise<void> => {
    await loadPlanForDate(selectedDate);
  }, [loadPlanForDate, selectedDate]);

  const generatePlan = useCallback(async (): Promise<void> => {
    if (!selectedDate) {
      setErrorMessage("日期为必填项。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const nextPlan = await requestApi<DailyPlanDto>("/api/planner/generate", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate
        })
      });
      setPlan(createPlannerPlanView(nextPlan, selectedDate));
      setSuccessMessage("计划已生成。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDate]);

  return {
    selectedDate,
    plan,
    isLoading,
    isGenerating,
    errorMessage,
    successMessage,
    hasPlan,
    updateDate,
    loadPlan,
    generatePlan,
    consumeSuccessMessage,
    dismissError
  };
}

function getTomorrowInputDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return toInputDate(tomorrow);
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createPlannerPlanView(plan: DailyPlanDto, selectedDate: string): PlannerPlanView {
  return {
    id: plan.id,
    dateLabel: formatDate(selectedDate),
    generatedAtLabel: formatDateTime(plan.createdAt),
    priority: normalizePriority(plan.priority),
    priorityTone: getPriorityTone(normalizePriority(plan.priority)),
    modelLabel: `${plan.provider} / ${plan.model}`,
    schedule: readSchedule(plan.schedule),
    priorityTasks: readStringArray(plan.priorityTasks),
    goals: readStringArray(plan.goals),
    risks: readStringArray(plan.risks),
    expectedOutcomes: readStringArray(plan.expectedOutcomes)
  };
}

function readSchedule(value: unknown): PlanScheduleItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isScheduleItem).map((item) => ({
    time: item.time,
    content: item.content,
    priority: item.priority
  }));
}

function isScheduleItem(value: unknown): value is PlanScheduleItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.content === "string" &&
    isScheduleTime(item.time) &&
    isPriority(item.priority)
  );
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function normalizePriority(value: unknown): PlanPriorityValue {
  return isPriority(value) ? value : "MEDIUM";
}

function isPriority(value: unknown): value is PlanPriorityValue {
  return typeof value === "string" && priorities.includes(value as PlanPriorityValue);
}

function isScheduleTime(value: unknown): value is PlanScheduleTime {
  return typeof value === "string" && scheduleTimes.includes(value as PlanScheduleTime);
}

function getPriorityTone(priority: PlanPriorityValue): "neutral" | "success" | "warning" | "danger" {
  if (priority === "HIGH") {
    return "danger";
  }

  if (priority === "MEDIUM") {
    return "warning";
  }

  return "success";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

async function requestApi<TData>(path: string, init: RequestInit = {}): Promise<TData> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new PlannerRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class PlannerRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PlannerRequestError";
    this.code = code;
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof PlannerRequestError &&
    (error.code === "PLAN_NOT_FOUND" || error.code === "NOT_FOUND")
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
