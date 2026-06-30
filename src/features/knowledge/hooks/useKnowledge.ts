"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  getKnowledgeEntries,
  getKnowledgeEntry,
  updateKnowledgeEntry
} from "@/features/knowledge/services/knowledgeClient";
import { createKnowledgeListItem } from "@/features/knowledge/utils/knowledgeView";
import type {
  KnowledgeCreateInput,
  KnowledgeFilterValues,
  KnowledgeFormMode,
  KnowledgeFormValues,
  KnowledgeListItem,
  KnowledgeUpdateInput
} from "@/types/knowledge";
import type { KnowledgeType } from "@prisma/client";

type UseKnowledgeResult = {
  entries: KnowledgeListItem[];
  filters: KnowledgeFilterValues;
  formValues: KnowledgeFormValues;
  formMode: KnowledgeFormMode;
  selectedEntry: KnowledgeListItem | null;
  deleteCandidate: KnowledgeListItem | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isFormOpen: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  typeOptions: KnowledgeType[];
  updateFilter: (field: keyof KnowledgeFilterValues, value: string) => void;
  updateFormField: (field: keyof KnowledgeFormValues, value: string) => void;
  openCreateForm: () => void;
  openEditForm: (entry: KnowledgeListItem) => Promise<void>;
  closeForm: () => void;
  saveForm: () => Promise<void>;
  requestDelete: (entry: KnowledgeListItem) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  refreshEntries: () => Promise<void>;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
  dismissSuccessMessage: () => void;
};

const knowledgeTypes: KnowledgeType[] = ["EXPERIENCE", "TEMPLATE", "POSITION", "NOTE"];

const initialFilters: KnowledgeFilterValues = {
  keyword: "",
  type: "",
  tag: ""
};

const initialFormValues: KnowledgeFormValues = {
  title: "",
  content: "",
  type: "NOTE",
  source: "USER",
  tagsText: ""
};

export function useKnowledge(): UseKnowledgeResult {
  const [entries, setEntries] = useState<KnowledgeListItem[]>([]);
  const [filters, setFilters] = useState<KnowledgeFilterValues>(initialFilters);
  const [formValues, setFormValues] = useState<KnowledgeFormValues>(initialFormValues);
  const [formMode, setFormMode] = useState<KnowledgeFormMode>("create");
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeListItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<KnowledgeListItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const typeOptions = useMemo<KnowledgeType[]>(() => knowledgeTypes, []);

  const loadEntries = useCallback(async (nextFilters: KnowledgeFilterValues): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getKnowledgeEntries(nextFilters);
      setEntries(data.map(createKnowledgeListItem));
    } catch (error) {
      setEntries([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries(filters);
  }, [filters, loadEntries]);

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

  const updateFilter = useCallback((field: keyof KnowledgeFilterValues, value: string): void => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value
    }));
  }, []);

  const updateFormField = useCallback((field: keyof KnowledgeFormValues, value: string): void => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  }, []);

  const openCreateForm = useCallback((): void => {
    setFormMode("create");
    setSelectedEntry(null);
    setFormValues(initialFormValues);
    setErrorMessage(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback(async (entry: KnowledgeListItem): Promise<void> => {
    setErrorMessage(null);

    try {
      const latestEntry = createKnowledgeListItem(await getKnowledgeEntry(entry.id));

      setFormMode("edit");
      setSelectedEntry(latestEntry);
      setFormValues({
        title: latestEntry.title,
        content: latestEntry.content,
        type: latestEntry.type,
        source: latestEntry.source === "USER" || latestEntry.source === "AI" ? latestEntry.source : "AI",
        tagsText: latestEntry.tags.join(", ")
      });
      setIsFormOpen(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }, []);

  const closeForm = useCallback((): void => {
    setIsFormOpen(false);
    setSelectedEntry(null);
    setFormValues(initialFormValues);
  }, []);

  const refreshEntries = useCallback(async (): Promise<void> => {
    await loadEntries(filters);
  }, [filters, loadEntries]);

  const saveForm = useCallback(async (): Promise<void> => {
    const validationError = validateFormValues(formValues);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = createKnowledgePayload(formValues);
      const savedEntry =
        formMode === "edit" && selectedEntry
          ? await updateKnowledgeEntry(selectedEntry.id, payload satisfies KnowledgeUpdateInput)
          : await createKnowledgeEntry(payload satisfies KnowledgeCreateInput);

      setSelectedEntry(createKnowledgeListItem(savedEntry));
      setSuccessMessage(formMode === "edit" ? "知识条目已更新。" : "知识条目已创建。");
      setIsFormOpen(false);
      await refreshEntries();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [formMode, formValues, refreshEntries, selectedEntry]);

  const requestDelete = useCallback((entry: KnowledgeListItem): void => {
    setDeleteCandidate(entry);
    setErrorMessage(null);
  }, []);

  const cancelDelete = useCallback((): void => {
    setDeleteCandidate(null);
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!deleteCandidate) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteKnowledgeEntry(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccessMessage("知识条目已删除。");
      await refreshEntries();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteCandidate, refreshEntries]);

  const dismissError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  const dismissSuccessMessage = useCallback((): void => {
    setSuccessMessage(null);
  }, []);

  const consumeSuccessMessage = useCallback((): string | null => {
    let consumedMessage: string | null = null;

    setSuccessMessage((currentMessage) => {
      consumedMessage = currentMessage;

      return null;
    });

    return consumedMessage;
  }, []);

  return {
    entries,
    filters,
    formValues,
    formMode,
    selectedEntry,
    deleteCandidate,
    isLoading,
    isSaving,
    isDeleting,
    isFormOpen,
    errorMessage,
    successMessage,
    typeOptions,
    updateFilter,
    updateFormField,
    openCreateForm,
    openEditForm,
    closeForm,
    saveForm,
    requestDelete,
    cancelDelete,
    confirmDelete,
    refreshEntries,
    consumeSuccessMessage,
    dismissError,
    dismissSuccessMessage
  };
}

function validateFormValues(values: KnowledgeFormValues): string | null {
  if (values.title.trim().length === 0) {
    return "标题为必填项。";
  }

  if (values.content.trim().length === 0) {
    return "内容为必填项。";
  }

  return null;
}

function createKnowledgePayload(values: KnowledgeFormValues): KnowledgeCreateInput {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    type: values.type,
    source: values.source,
    tags: parseTagsText(values.tagsText)
  };
}

function parseTagsText(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
