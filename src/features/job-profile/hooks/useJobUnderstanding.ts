"use client";

import { useCallback, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  JobProfileDto,
  JobUnderstandingFormValues,
  JobUnderstandingInput,
  JobUnderstandingOutput,
  JobUnderstandingResult
} from "@/types/jobProfile";

type UseJobUnderstandingResult = {
  formValues: JobUnderstandingFormValues;
  result: JobUnderstandingResult | null;
  reviewedOutput: JobUnderstandingOutput | null;
  savedProfile: JobProfileDto | null;
  isGenerating: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  canSave: boolean;
  updateField: (field: keyof JobUnderstandingFormValues, value: string) => void;
  updateReviewedField: (field: keyof JobUnderstandingOutput, value: string | string[]) => void;
  generate: () => Promise<void>;
  regenerate: () => Promise<void>;
  cancelReview: () => void;
  save: () => Promise<void>;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
};

const initialFormValues: JobUnderstandingFormValues = {
  hiringGoal: "",
  jd: "",
  jobTitle: "",
  leaderRequirements: "",
  notes: "",
  teamBackground: ""
};

export function useJobUnderstanding(): UseJobUnderstandingResult {
  const [formValues, setFormValues] = useState<JobUnderstandingFormValues>(initialFormValues);
  const [result, setResult] = useState<JobUnderstandingResult | null>(null);
  const [reviewedOutput, setReviewedOutput] = useState<JobUnderstandingOutput | null>(null);
  const [savedProfile, setSavedProfile] = useState<JobProfileDto | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateField = useCallback(
    (field: keyof JobUnderstandingFormValues, value: string): void => {
      setFormValues((currentValues) => ({
        ...currentValues,
        [field]: value
      }));
    },
    []
  );

  const updateReviewedField = useCallback(
    (field: keyof JobUnderstandingOutput, value: string | string[]): void => {
      setReviewedOutput((currentOutput) => {
        if (!currentOutput) {
          return currentOutput;
        }

        return {
          ...currentOutput,
          [field]: value
        };
      });
    },
    []
  );

  const generate = useCallback(async (): Promise<void> => {
    const validationError = validateFormValues(formValues);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSavedProfile(null);

    try {
      const nextResult = await requestApi<JobUnderstandingResult>(
        "/api/job-understanding/generate",
        {
          body: JSON.stringify(toJobUnderstandingInput(formValues)),
          method: "POST"
        }
      );

      setResult(nextResult);
      setReviewedOutput(createOutputFromResult(nextResult));
      setSuccessMessage("岗位理解已生成，请人工确认后保存。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }, [formValues]);

  const regenerate = useCallback(async (): Promise<void> => {
    await generate();
  }, [generate]);

  const cancelReview = useCallback((): void => {
    setResult(null);
    setReviewedOutput(null);
    setSavedProfile(null);
    setErrorMessage(null);
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (!result || !reviewedOutput) {
      setErrorMessage("请先生成并确认岗位理解。");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const profile = await requestApi<JobProfileDto>("/api/job-profiles", {
        body: JSON.stringify({
          ...toJobUnderstandingInput(formValues),
          ...reviewedOutput,
          aiModel: result.aiModel,
          aiProvider: result.aiProvider,
          generationTimeMs: result.generationTimeMs,
          promptFile: result.promptFile,
          promptVersion: result.promptVersion,
          workflowId: result.workflowId
        }),
        method: "POST"
      });

      setSavedProfile(profile);
      setSuccessMessage("已保存人工确认的岗位画像。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [formValues, result, reviewedOutput]);

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

  return {
    canSave: result !== null && reviewedOutput !== null && savedProfile === null,
    cancelReview,
    consumeSuccessMessage,
    dismissError,
    errorMessage,
    formValues,
    generate,
    isGenerating,
    isSaving,
    regenerate,
    result,
    reviewedOutput,
    save,
    savedProfile,
    successMessage,
    updateField,
    updateReviewedField
  };
}

function validateFormValues(values: JobUnderstandingFormValues): string | null {
  if (values.jobTitle.trim().length === 0) {
    return "岗位名称为必填项。";
  }

  if (values.jd.trim().length === 0) {
    return "JD 为必填项。";
  }

  return null;
}

function toJobUnderstandingInput(values: JobUnderstandingFormValues): JobUnderstandingInput {
  return {
    hiringGoal: normalizeOptionalText(values.hiringGoal),
    jd: values.jd.trim(),
    jobTitle: values.jobTitle.trim(),
    leaderRequirements: normalizeOptionalText(values.leaderRequirements),
    notes: normalizeOptionalText(values.notes),
    teamBackground: normalizeOptionalText(values.teamBackground)
  };
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length === 0 ? undefined : trimmedValue;
}

function createOutputFromResult(result: JobUnderstandingResult): JobUnderstandingOutput {
  return {
    coreResponsibilities: result.coreResponsibilities,
    hiringFocus: result.hiringFocus,
    interviewFocus: result.interviewFocus,
    jobSummary: result.jobSummary,
    missingInformation: result.missingInformation,
    potentialRisks: result.potentialRisks,
    preferredCompetencies: result.preferredCompetencies,
    requiredCompetencies: result.requiredCompetencies,
    suggestedFollowUpQuestions: result.suggestedFollowUpQuestions
  };
}

async function requestApi<TData>(path: string, init: RequestInit): Promise<TData> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new JobUnderstandingRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class JobUnderstandingRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "JobUnderstandingRequestError";
    this.code = code;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
