"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { DailyReviewDto, ReviewResultView } from "@/types/review";

type UseReviewResult = {
  selectedDate: string;
  review: ReviewResultView | null;
  isLoading: boolean;
  isGenerating: boolean;
  errorMessage: string | null;
  hasReview: boolean;
  updateDate: (date: string) => void;
  loadReview: () => Promise<void>;
  generateReview: () => Promise<void>;
  dismissError: () => void;
};

export function useReview(): UseReviewResult {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayInputDate());
  const [review, setReview] = useState<ReviewResultView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasReview = useMemo<boolean>(() => review !== null, [review]);

  const dismissError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  const loadReviewForDate = useCallback(async (date: string): Promise<void> => {
    if (!date) {
      setReview(null);
      setErrorMessage("Date is required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextReview = await requestApi<DailyReviewDto>(
        `/api/review/date/${encodeURIComponent(date)}`
      );
      setReview(createReviewResultView(nextReview, date));
    } catch (error) {
      if (isNotFoundError(error)) {
        setReview(null);
      } else {
        setReview(null);
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviewForDate(selectedDate);
  }, [loadReviewForDate, selectedDate]);

  const updateDate = useCallback((date: string): void => {
    setSelectedDate(date);
  }, []);

  const loadReview = useCallback(async (): Promise<void> => {
    await loadReviewForDate(selectedDate);
  }, [loadReviewForDate, selectedDate]);

  const generateReview = useCallback(async (): Promise<void> => {
    if (!selectedDate) {
      setErrorMessage("Date is required.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const nextReview = await requestApi<DailyReviewDto>("/api/review/generate", {
        method: "POST",
        body: JSON.stringify({
          date: selectedDate
        })
      });
      setReview(createReviewResultView(nextReview, selectedDate));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDate]);

  return {
    selectedDate,
    review,
    isLoading,
    isGenerating,
    errorMessage,
    hasReview,
    updateDate,
    loadReview,
    generateReview,
    dismissError
  };
}

function getTodayInputDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createReviewResultView(review: DailyReviewDto, selectedDate: string): ReviewResultView {
  return {
    id: review.id,
    dateLabel: formatDate(selectedDate),
    generatedAtLabel: formatDateTime(review.createdAt),
    summary: review.summary,
    strengths: formatJsonText(review.strengths),
    weaknesses: formatJsonText(review.weaknesses),
    suggestions: formatJsonText(review.suggestions),
    score: review.score,
    scoreLabel: `${review.score}/100`,
    scoreTone: getScoreTone(review.score),
    modelLabel: `${review.provider} / ${review.model}`
  };
}

function formatJsonText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatJsonText(item)).join("\n");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return "";
}

function getScoreTone(score: number): "success" | "warning" | "danger" {
  if (score >= 80) {
    return "success";
  }

  if (score >= 60) {
    return "warning";
  }

  return "danger";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
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
    throw new ReviewRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class ReviewRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ReviewRequestError";
    this.code = code;
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof ReviewRequestError &&
    (error.code === "REVIEW_NOT_FOUND" || error.code === "NOT_FOUND")
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}
