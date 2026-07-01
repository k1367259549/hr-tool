"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  RecruitmentTaskActionInput,
  RecruitmentTaskCenterData,
  RecruitmentTaskDto,
  RecruitmentTaskPriority
} from "@/types/recruitmentTask";

type EditableTask = {
  id: string;
  title: string;
  priority: RecruitmentTaskPriority;
  priorityReason: string;
  reason: string;
  dueTime: string;
  recommendedNextAction: string;
};

type UseRecruitmentTaskCenterResult = {
  data: RecruitmentTaskCenterData | null;
  editingTask: EditableTask | null;
  isLoading: boolean;
  isUpdating: boolean;
  errorMessage: string | null;
  reload: () => Promise<void>;
  startEdit: (task: RecruitmentTaskDto) => void;
  cancelEdit: () => void;
  updateEditingTask: (field: keyof EditableTask, value: string) => void;
  applyAction: (input: RecruitmentTaskActionInput) => Promise<void>;
  saveEdit: () => Promise<void>;
  dismissError: () => void;
};

export function useRecruitmentTaskCenter(): UseRecruitmentTaskCenterResult {
  const [data, setData] = useState<RecruitmentTaskCenterData | null>(null);
  const [editingTask, setEditingTask] = useState<EditableTask | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextData = await requestJson<RecruitmentTaskCenterData>("/api/recruitment-tasks");

      setData(nextData);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyAction = useCallback(async (input: RecruitmentTaskActionInput): Promise<void> => {
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const task = await requestJson<RecruitmentTaskDto>("/api/recruitment-tasks", {
        body: JSON.stringify(input),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });

      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              counts: recalculateCounts(currentData.tasks.map((item) => (item.id === task.id ? task : item))),
              tasks: currentData.tasks.map((item) => (item.id === task.id ? task : item))
            }
          : currentData
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const startEdit = useCallback((task: RecruitmentTaskDto): void => {
    setEditingTask({
      dueTime: task.dueTime ? task.dueTime.slice(0, 16) : "",
      id: task.id,
      priority: task.priority,
      priorityReason: task.priorityReason,
      reason: task.reason,
      recommendedNextAction: task.recommendedNextAction,
      title: task.title
    });
  }, []);

  const cancelEdit = useCallback((): void => {
    setEditingTask(null);
  }, []);

  const updateEditingTask = useCallback((field: keyof EditableTask, value: string): void => {
    setEditingTask((currentTask) => (currentTask ? { ...currentTask, [field]: value } : currentTask));
  }, []);

  const saveEdit = useCallback(async (): Promise<void> => {
    if (!editingTask) {
      return;
    }

    await applyAction({
      action: "MODIFY",
      patch: {
        dueTime: editingTask.dueTime ? new Date(editingTask.dueTime) : null,
        priority: editingTask.priority,
        priorityReason: editingTask.priorityReason,
        reason: editingTask.reason,
        recommendedNextAction: editingTask.recommendedNextAction,
        title: editingTask.title
      },
      taskId: editingTask.id
    });
    setEditingTask(null);
  }, [applyAction, editingTask]);

  const dismissError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  return {
    applyAction,
    cancelEdit,
    data,
    dismissError,
    editingTask,
    errorMessage,
    isLoading,
    isUpdating,
    reload,
    saveEdit,
    startEdit,
    updateEditingTask
  };
}

async function requestJson<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new RecruitmentTaskRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class RecruitmentTaskRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RecruitmentTaskRequestError";
    this.code = code;
  }
}

function recalculateCounts(tasks: RecruitmentTaskDto[]): RecruitmentTaskCenterData["counts"] {
  return {
    cancelled: tasks.filter((task) => task.status === "CANCELLED").length,
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
    deferred: tasks.filter((task) => task.status === "DEFERRED").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    todo: tasks.filter((task) => task.status === "TODO").length,
    total: tasks.length
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
