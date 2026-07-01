"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  CandidateInsightDetails,
  CandidateInsightDto,
  CandidateInsightEvidence,
  CandidateInsightOutput,
  CandidateInsightSummary,
  CandidateUnderstandingFormValues,
  CandidateUnderstandingResult
} from "@/types/candidateUnderstanding";
import type { JobProfileDto } from "@/types/jobProfile";

type UseCandidateUnderstandingResult = {
  formValues: CandidateUnderstandingFormValues;
  jobProfiles: JobProfileDto[];
  result: CandidateUnderstandingResult | null;
  reviewedOutput: CandidateInsightOutput | null;
  savedInsight: CandidateInsightDto | null;
  isLoadingProfiles: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  updateField: (field: keyof Omit<CandidateUnderstandingFormValues, "file">, value: string) => void;
  selectFile: (file: File | null) => void;
  updateSummaryField: (field: keyof CandidateInsightSummary, value: string) => void;
  updateInsightList: (field: keyof CandidateInsightDetails, value: string[]) => void;
  updateOutputList: (
    field: Exclude<keyof CandidateInsightOutput, "summary" | "insights" | "evidence">,
    value: string[]
  ) => void;
  updateEvidence: (value: CandidateInsightEvidence[]) => void;
  generate: () => Promise<void>;
  regenerate: () => Promise<void>;
  cancelReview: () => void;
  save: () => Promise<void>;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
};

const initialFormValues: CandidateUnderstandingFormValues = {
  candidateSource: "",
  file: null,
  jobProfileId: "",
  notes: ""
};

export function useCandidateUnderstanding(): UseCandidateUnderstandingResult {
  const [formValues, setFormValues] =
    useState<CandidateUnderstandingFormValues>(initialFormValues);
  const [jobProfiles, setJobProfiles] = useState<JobProfileDto[]>([]);
  const [result, setResult] = useState<CandidateUnderstandingResult | null>(null);
  const [reviewedOutput, setReviewedOutput] = useState<CandidateInsightOutput | null>(null);
  const [savedInsight, setSavedInsight] = useState<CandidateInsightDto | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadJobProfiles(): Promise<void> {
      setIsLoadingProfiles(true);

      try {
        const profiles = await requestJson<JobProfileDto[]>("/api/job-profiles");

        if (!isActive) {
          return;
        }

        setJobProfiles(profiles);
        setFormValues((currentValues) => ({
          ...currentValues,
          jobProfileId: currentValues.jobProfileId || profiles[0]?.id || ""
        }));
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoadingProfiles(false);
        }
      }
    }

    void loadJobProfiles();

    return () => {
      isActive = false;
    };
  }, []);

  const updateField = useCallback(
    (field: keyof Omit<CandidateUnderstandingFormValues, "file">, value: string): void => {
      setFormValues((currentValues) => ({
        ...currentValues,
        [field]: value
      }));
    },
    []
  );

  const selectFile = useCallback((file: File | null): void => {
    setFormValues((currentValues) => ({
      ...currentValues,
      file
    }));
    setResult(null);
    setReviewedOutput(null);
    setSavedInsight(null);
  }, []);

  const updateSummaryField = useCallback(
    (field: keyof CandidateInsightSummary, value: string): void => {
      setReviewedOutput((currentOutput) =>
        currentOutput
          ? {
              ...currentOutput,
              summary: {
                ...currentOutput.summary,
                [field]: value
              }
            }
          : currentOutput
      );
    },
    []
  );

  const updateInsightList = useCallback(
    (field: keyof CandidateInsightDetails, value: string[]): void => {
      setReviewedOutput((currentOutput) =>
        currentOutput
          ? {
              ...currentOutput,
              insights: {
                ...currentOutput.insights,
                [field]: value
              }
            }
          : currentOutput
      );
    },
    []
  );

  const updateOutputList = useCallback(
    (
      field: Exclude<keyof CandidateInsightOutput, "summary" | "insights" | "evidence">,
      value: string[]
    ): void => {
      setReviewedOutput((currentOutput) =>
        currentOutput
          ? {
              ...currentOutput,
              [field]: value
            }
          : currentOutput
      );
    },
    []
  );

  const updateEvidence = useCallback((value: CandidateInsightEvidence[]): void => {
    setReviewedOutput((currentOutput) =>
      currentOutput
        ? {
            ...currentOutput,
            evidence: value
          }
        : currentOutput
    );
  }, []);

  const generate = useCallback(async (): Promise<void> => {
    const validationError = validateFormValues(formValues);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSavedInsight(null);

    try {
      const formData = new FormData();
      formData.set("jobProfileId", formValues.jobProfileId);

      if (formValues.file) {
        formData.set("file", formValues.file);
      }

      if (formValues.candidateSource.trim().length > 0) {
        formData.set("candidateSource", formValues.candidateSource.trim());
      }

      if (formValues.notes.trim().length > 0) {
        formData.set("notes", formValues.notes.trim());
      }

      const nextResult = await requestJson<CandidateUnderstandingResult>(
        "/api/candidate-understanding/generate",
        {
          body: formData,
          method: "POST"
        }
      );

      setResult(nextResult);
      setReviewedOutput(createOutputFromResult(nextResult));
      setSuccessMessage("候选人理解已生成，请人工确认后保存。");
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
    setSavedInsight(null);
    setErrorMessage(null);
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (!result || !reviewedOutput) {
      setErrorMessage("请先生成并确认候选人理解。");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const insight = await requestJson<CandidateInsightDto>("/api/candidate-insights", {
        body: JSON.stringify({
          ...reviewedOutput,
          aiModel: result.aiModel,
          aiProvider: result.aiProvider,
          candidateSource: normalizeOptionalText(formValues.candidateSource),
          generationTimeMs: result.generationTimeMs,
          jobProfileId: result.jobProfileId,
          jobProfileVersion: result.jobProfileVersion,
          notes: normalizeOptionalText(formValues.notes),
          promptFile: result.promptFile,
          promptVersion: result.promptVersion,
          resumeId: result.resumeId,
          resumeVersion: result.resumeVersion,
          workflowId: result.workflowId
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      setSavedInsight(insight);
      setSuccessMessage("已保存人工确认的候选人洞察。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [formValues.candidateSource, formValues.notes, result, reviewedOutput]);

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
    cancelReview,
    consumeSuccessMessage,
    dismissError,
    errorMessage,
    formValues,
    generate,
    isGenerating,
    isLoadingProfiles,
    isSaving,
    jobProfiles,
    regenerate,
    result,
    reviewedOutput,
    save,
    savedInsight,
    selectFile,
    successMessage,
    updateEvidence,
    updateField,
    updateInsightList,
    updateOutputList,
    updateSummaryField
  };
}

function validateFormValues(values: CandidateUnderstandingFormValues): string | null {
  if (values.jobProfileId.trim().length === 0) {
    return "请选择已确认的岗位画像。";
  }

  if (!values.file) {
    return "请上传候选人简历。";
  }

  return null;
}

function createOutputFromResult(result: CandidateUnderstandingResult): CandidateInsightOutput {
  return {
    evidence: result.evidence,
    insights: result.insights,
    missingInformation: result.missingInformation,
    potentialRisks: result.potentialRisks,
    strengths: result.strengths,
    suggestedInterviewQuestions: result.suggestedInterviewQuestions,
    suggestedNextActions: result.suggestedNextActions,
    suggestedPhoneScreenQuestions: result.suggestedPhoneScreenQuestions,
    summary: result.summary
  };
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length === 0 ? undefined : trimmedValue;
}

async function requestJson<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new CandidateUnderstandingRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class CandidateUnderstandingRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CandidateUnderstandingRequestError";
    this.code = code;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
