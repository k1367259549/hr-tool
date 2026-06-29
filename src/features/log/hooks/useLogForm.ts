"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type { RecruitLogCountField, RecruitLogDto, RecruitLogFormValues } from "@/types/log";

type UseLogFormResult = {
  logs: RecruitLogDto[];
  formValues: RecruitLogFormValues;
  selectedLog: RecruitLogDto | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  canDelete: boolean;
  updateField: (field: keyof RecruitLogFormValues, value: string | number) => void;
  resetForm: () => void;
  selectLog: (log: RecruitLogDto) => void;
  loadLogByDate: () => Promise<void>;
  saveLog: () => Promise<void>;
  deleteSelectedLog: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  dismissSuccessMessage: () => void;
};

const numericFields: RecruitLogCountField[] = ["resumeCount", "screenCount", "phoneCount", "interviewCount", "offerCount", "entryCount"];

const initialFormValues: RecruitLogFormValues = {
  date: getTodayInputDate(),
  position: "",
  resumeCount: 0,
  screenCount: 0,
  phoneCount: 0,
  interviewCount: 0,
  offerCount: 0,
  entryCount: 0,
  summary: "",
  problems: "",
  reflection: ""
};

export function useLogForm(): UseLogFormResult {
  const [logs, setLogs] = useState<RecruitLogDto[]>([]);
  const [formValues, setFormValues] = useState<RecruitLogFormValues>(initialFormValues);
  const [selectedLog, setSelectedLog] = useState<RecruitLogDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canDelete = useMemo<boolean>(() => selectedLog !== null, [selectedLog]);

  const dismissSuccessMessage = useCallback((): void => {
    setSuccessMessage(null);
  }, []);

  const refreshLogs = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextLogs = await requestApi<RecruitLogDto[]>("/api/log");
      setLogs(nextLogs);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const updateField = useCallback(
    (field: keyof RecruitLogFormValues, value: string | number): void => {
      setFormValues((currentValues) => ({
        ...currentValues,
        [field]: value
      }));
    },
    []
  );

  const resetForm = useCallback((): void => {
    setSelectedLog(null);
    setFormValues({
      ...initialFormValues,
      date: getTodayInputDate()
    });
    setErrorMessage(null);
  }, []);

  const selectLog = useCallback((log: RecruitLogDto): void => {
    setSelectedLog(log);
    setFormValues(toFormValues(log));
    setErrorMessage(null);
  }, []);

  const loadLogByDate = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    const validationError = validateFormValues(formValues);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      const log = await requestApi<RecruitLogDto>(
        `/api/log/date/${encodeURIComponent(formValues.date)}`
      );
      selectLog(log);
    } catch (error) {
      resetFormForDate(formValues.date, setFormValues, setSelectedLog);
      setErrorMessage(getErrorMessage(error));
    }
  }, [formValues, selectLog]);

  const saveLog = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    const validationError = validateFormValues(formValues);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = toApiPayload(formValues);
      const savedLog = selectedLog
        ? await requestApi<RecruitLogDto>(`/api/log/${selectedLog.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          })
        : await requestApi<RecruitLogDto>("/api/log", {
            method: "POST",
            body: JSON.stringify(payload)
          });

      setSelectedLog(savedLog);
      setFormValues(toFormValues(savedLog));
      setSuccessMessage("Daily log saved.");
      await refreshLogs();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [formValues, refreshLogs, selectedLog]);

  const deleteSelectedLog = useCallback(async (): Promise<void> => {
    if (!selectedLog) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    try {
      await requestApi<RecruitLogDto>(`/api/log/${selectedLog.id}`, {
        method: "DELETE"
      });
      resetForm();
      setSuccessMessage("Daily log deleted.");
      await refreshLogs();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }, [refreshLogs, resetForm, selectedLog]);

  return {
    logs,
    formValues,
    selectedLog,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    successMessage,
    canDelete,
    updateField,
    resetForm,
    selectLog,
    loadLogByDate,
    saveLog,
    deleteSelectedLog,
    refreshLogs,
    dismissSuccessMessage
  };
}

function getTodayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value: string): string {
  return value.slice(0, 10);
}

function toFormValues(log: RecruitLogDto): RecruitLogFormValues {
  return {
    date: toInputDate(log.date),
    position: log.position ?? "",
    resumeCount: log.resumeCount,
    screenCount: log.screenCount,
    phoneCount: log.phoneCount,
    interviewCount: log.interviewCount,
    offerCount: log.offerCount,
    entryCount: log.entryCount,
    summary: log.summary ?? "",
    problems: log.problems ?? "",
    reflection: log.reflection ?? ""
  };
}

function toApiPayload(values: RecruitLogFormValues): RecruitLogFormValues {
  return {
    ...values,
    position: values.position.trim(),
    summary: values.summary.trim(),
    problems: values.problems.trim(),
    reflection: values.reflection.trim()
  };
}

function validateFormValues(values: RecruitLogFormValues): string | null {
  if (!values.date) {
    return "Date is required.";
  }

  for (const field of numericFields) {
    if (!Number.isInteger(values[field]) || values[field] < 0) {
      return `${field} must be a non-negative integer.`;
    }
  }

  return null;
}

function resetFormForDate(
  date: string,
  setFormValues: (values: RecruitLogFormValues) => void,
  setSelectedLog: (log: RecruitLogDto | null) => void
): void {
  setSelectedLog(null);
  setFormValues({
    ...initialFormValues,
    date
  });
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
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}
