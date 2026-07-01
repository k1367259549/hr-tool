"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  RecruiterWorkspaceData,
  RecruiterWorkspaceNoteDto,
  RecruiterWorkspaceScheduleItemDto,
  RecruiterWorkspaceScheduleItemInput
} from "@/types/recruiterWorkspace";

type UseRecruiterWorkspaceResult = {
  date: string;
  data: RecruiterWorkspaceData | null;
  scheduleDraft: RecruiterWorkspaceScheduleItemInput[];
  noteContent: string;
  noteCategory: string;
  isLoading: boolean;
  isSavingNote: boolean;
  isSavingSchedule: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  setDate: (value: string) => void;
  setNoteContent: (value: string) => void;
  setNoteCategory: (value: string) => void;
  reload: () => Promise<void>;
  addNote: () => Promise<void>;
  addScheduleItem: (itemType: RecruiterWorkspaceScheduleItemInput["itemType"]) => void;
  updateScheduleItem: (
    index: number,
    field: keyof RecruiterWorkspaceScheduleItemInput,
    value: string | boolean
  ) => void;
  removeScheduleItem: (index: number) => void;
  saveSchedule: () => Promise<void>;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
};

export function useRecruiterWorkspace(): UseRecruiterWorkspaceResult {
  const [date, setDateState] = useState<string>(todayString());
  const [data, setData] = useState<RecruiterWorkspaceData | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<RecruiterWorkspaceScheduleItemInput[]>([]);
  const [noteContent, setNoteContent] = useState<string>("");
  const [noteCategory, setNoteCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const workspace = await requestJson<RecruiterWorkspaceData>(
        `/api/recruiter-workspace?date=${encodeURIComponent(date)}`
      );

      setData(workspace);
      setScheduleDraft(workspace.schedule.map(toScheduleInput));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setDate = useCallback((value: string): void => {
    setDateState(value);
  }, []);

  const addNote = useCallback(async (): Promise<void> => {
    if (noteContent.trim().length === 0) {
      setErrorMessage("请先输入 Recruiter Note。");
      return;
    }

    setIsSavingNote(true);
    setErrorMessage(null);

    try {
      const note = await requestJson<RecruiterWorkspaceNoteDto>("/api/recruiter-workspace/notes", {
        body: JSON.stringify({
          category: normalizeOptionalText(noteCategory),
          content: noteContent,
          date
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              notes: [note, ...currentData.notes]
            }
          : currentData
      );
      setNoteCategory("");
      setNoteContent("");
      setSuccessMessage("Recruiter Note 已保存。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingNote(false);
    }
  }, [date, noteCategory, noteContent]);

  const addScheduleItem = useCallback(
    (itemType: RecruiterWorkspaceScheduleItemInput["itemType"]): void => {
      setScheduleDraft((currentItems) => [
        ...currentItems,
        {
          completed: false,
          itemType,
          order: currentItems.length,
          title: defaultTitleByType[itemType]
        }
      ]);
    },
    []
  );

  const updateScheduleItem = useCallback(
    (
      index: number,
      field: keyof RecruiterWorkspaceScheduleItemInput,
      value: string | boolean
    ): void => {
      setScheduleDraft((currentItems) =>
        currentItems.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value
              }
            : item
        )
      );
    },
    []
  );

  const removeScheduleItem = useCallback((index: number): void => {
    setScheduleDraft((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order }))
    );
  }, []);

  const saveSchedule = useCallback(async (): Promise<void> => {
    setIsSavingSchedule(true);
    setErrorMessage(null);

    try {
      const schedule = await requestJson<RecruiterWorkspaceScheduleItemDto[]>(
        "/api/recruiter-workspace/schedule",
        {
          body: JSON.stringify({
            date,
            items: scheduleDraft
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              schedule
            }
          : currentData
      );
      setScheduleDraft(schedule.map(toScheduleInput));
      setSuccessMessage("今日日程已保存。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingSchedule(false);
    }
  }, [date, scheduleDraft]);

  const dismissError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  const consumeSuccessMessage = useCallback((): string | null => {
    const message = successMessage;
    setSuccessMessage(null);

    return message;
  }, [successMessage]);

  return {
    addNote,
    addScheduleItem,
    consumeSuccessMessage,
    data,
    date,
    dismissError,
    errorMessage,
    isLoading,
    isSavingNote,
    isSavingSchedule,
    noteCategory,
    noteContent,
    reload,
    removeScheduleItem,
    saveSchedule,
    scheduleDraft,
    setDate,
    setNoteCategory,
    setNoteContent,
    successMessage,
    updateScheduleItem
  };
}

const defaultTitleByType: Record<RecruiterWorkspaceScheduleItemInput["itemType"], string> = {
  INTERVIEW: "面试准备",
  LEADER_MEETING: "业务方沟通",
  PHONE_SCREEN: "电话初筛",
  RECRUITING_TASK: "招聘任务"
};

async function requestJson<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new RecruiterWorkspaceRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class RecruiterWorkspaceRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RecruiterWorkspaceRequestError";
    this.code = code;
  }
}

function toScheduleInput(
  item: RecruiterWorkspaceScheduleItemDto
): RecruiterWorkspaceScheduleItemInput {
  return {
    completed: item.completed,
    itemType: item.itemType,
    notes: item.notes,
    order: item.order,
    relatedName: item.relatedName,
    startTime: item.startTime,
    title: item.title
  };
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
