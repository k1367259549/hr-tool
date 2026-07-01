"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  CandidateInsightOption,
  InterviewNotes,
  InterviewPreparationOutput,
  InterviewPreparationResult,
  PhoneNotes,
  PhonePreparationResult,
  PhoneScreenPreparationOutput,
  RecruiterSummaryOutput,
  RecruiterSummaryResult,
  RecruitTogetherPageData,
  RecruitTogetherWorkflowDto
} from "@/types/recruitTogether";
import type { JobProfileDto } from "@/types/jobProfile";

type RecruitTogetherFormValues = {
  jobProfileId: string;
  candidateInsightId: string;
};

type UseRecruitTogetherResult = {
  formValues: RecruitTogetherFormValues;
  jobProfiles: JobProfileDto[];
  candidateInsights: CandidateInsightOption[];
  filteredCandidateInsights: CandidateInsightOption[];
  phonePreparation: PhonePreparationResult | null;
  reviewedPhonePreparation: PhoneScreenPreparationOutput | null;
  phoneNotes: PhoneNotes;
  interviewPreparation: InterviewPreparationResult | null;
  reviewedInterviewPreparation: InterviewPreparationOutput | null;
  interviewNotes: InterviewNotes;
  recruiterSummary: RecruiterSummaryResult | null;
  reviewedRecruiterSummary: RecruiterSummaryOutput | null;
  savedWorkflow: RecruitTogetherWorkflowDto | null;
  isLoading: boolean;
  busyStep: string | null;
  errorMessage: string | null;
  successMessage: string | null;
  updateField: (field: keyof RecruitTogetherFormValues, value: string) => void;
  updatePhonePreparation: (field: keyof PhoneScreenPreparationOutput, value: string | string[]) => void;
  updatePhoneNotes: (field: keyof PhoneNotes, value: string | string[]) => void;
  updateInterviewPreparation: (
    field: keyof InterviewPreparationOutput,
    value: string[]
  ) => void;
  updateInterviewNotes: (field: keyof InterviewNotes, value: string | string[]) => void;
  updateRecruiterSummary: (field: keyof RecruiterSummaryOutput, value: string | string[]) => void;
  generatePhonePreparation: () => Promise<void>;
  generateInterviewPreparation: () => Promise<void>;
  generateRecruiterSummary: () => Promise<void>;
  saveWorkflow: () => Promise<void>;
  cancelWorkflow: () => void;
  consumeSuccessMessage: () => string | null;
  dismissError: () => void;
};

const initialFormValues: RecruitTogetherFormValues = {
  candidateInsightId: "",
  jobProfileId: ""
};

const initialPhoneNotes: PhoneNotes = {
  availability: "",
  candidateMotivation: "",
  communicationQuality: "",
  freeNotes: "",
  keyFacts: [],
  openQuestions: [],
  salaryExpectation: ""
};

const initialInterviewNotes: InterviewNotes = {
  concerns: [],
  interviewSummary: "",
  newEvidence: [],
  overallImpression: "",
  strengths: [],
  weaknesses: []
};

export function useRecruitTogether(): UseRecruitTogetherResult {
  const [formValues, setFormValues] = useState<RecruitTogetherFormValues>(initialFormValues);
  const [jobProfiles, setJobProfiles] = useState<JobProfileDto[]>([]);
  const [candidateInsights, setCandidateInsights] = useState<CandidateInsightOption[]>([]);
  const [phonePreparation, setPhonePreparation] = useState<PhonePreparationResult | null>(null);
  const [reviewedPhonePreparation, setReviewedPhonePreparation] =
    useState<PhoneScreenPreparationOutput | null>(null);
  const [phoneNotes, setPhoneNotes] = useState<PhoneNotes>(initialPhoneNotes);
  const [interviewPreparation, setInterviewPreparation] =
    useState<InterviewPreparationResult | null>(null);
  const [reviewedInterviewPreparation, setReviewedInterviewPreparation] =
    useState<InterviewPreparationOutput | null>(null);
  const [interviewNotes, setInterviewNotes] = useState<InterviewNotes>(initialInterviewNotes);
  const [recruiterSummary, setRecruiterSummary] = useState<RecruiterSummaryResult | null>(null);
  const [reviewedRecruiterSummary, setReviewedRecruiterSummary] =
    useState<RecruiterSummaryOutput | null>(null);
  const [savedWorkflow, setSavedWorkflow] = useState<RecruitTogetherWorkflowDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredCandidateInsights = useMemo(
    () =>
      candidateInsights.filter((insight) => insight.jobProfileId === formValues.jobProfileId),
    [candidateInsights, formValues.jobProfileId]
  );

  useEffect(() => {
    let isActive = true;

    async function loadData(): Promise<void> {
      setIsLoading(true);

      try {
        const data = await requestJson<RecruitTogetherPageData>("/api/recruit-together");

        if (!isActive) {
          return;
        }

        setJobProfiles(data.jobProfiles);
        setCandidateInsights(data.candidateInsights);
        setFormValues(resolveInitialFormValues(data));
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const updateField = useCallback((field: keyof RecruitTogetherFormValues, value: string): void => {
    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [field]: value
      };

      if (field === "jobProfileId") {
        const firstMatchingInsight = candidateInsights.find(
          (insight) => insight.jobProfileId === value
        );
        nextValues.candidateInsightId = firstMatchingInsight?.id ?? "";
      }

      return nextValues;
    });
    resetGeneratedState();
  }, [candidateInsights]);

  const updatePhonePreparation = useCallback(
    (field: keyof PhoneScreenPreparationOutput, value: string | string[]): void => {
      setReviewedPhonePreparation((currentOutput) =>
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

  const updatePhoneNotes = useCallback((field: keyof PhoneNotes, value: string | string[]): void => {
    setPhoneNotes((currentNotes) => ({
      ...currentNotes,
      [field]: value
    }));
  }, []);

  const updateInterviewPreparation = useCallback(
    (field: keyof InterviewPreparationOutput, value: string[]): void => {
      setReviewedInterviewPreparation((currentOutput) =>
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

  const updateInterviewNotes = useCallback(
    (field: keyof InterviewNotes, value: string | string[]): void => {
      setInterviewNotes((currentNotes) => ({
        ...currentNotes,
        [field]: value
      }));
    },
    []
  );

  const updateRecruiterSummary = useCallback(
    (field: keyof RecruiterSummaryOutput, value: string | string[]): void => {
      setReviewedRecruiterSummary((currentOutput) =>
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

  const generatePhonePreparation = useCallback(async (): Promise<void> => {
    const validationError = validateSelection(formValues);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setBusyStep("phone");
    setErrorMessage(null);

    try {
      const result = await requestJson<PhonePreparationResult>(
        "/api/recruit-together/phone-preparation",
        {
          body: JSON.stringify(formValues),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      setPhonePreparation(result);
      setReviewedPhonePreparation(copyPhonePreparation(result));
      setSuccessMessage("电话初筛准备已生成，请人工确认或编辑。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyStep(null);
    }
  }, [formValues]);

  const generateInterviewPreparation = useCallback(async (): Promise<void> => {
    if (!reviewedPhonePreparation) {
      setErrorMessage("请先生成并确认电话初筛准备。");
      return;
    }

    setBusyStep("interview");
    setErrorMessage(null);

    try {
      const result = await requestJson<InterviewPreparationResult>(
        "/api/recruit-together/interview-preparation",
        {
          body: JSON.stringify({
            ...formValues,
            phoneNotes,
            phonePreparation: reviewedPhonePreparation,
            workflowId: phonePreparation?.workflowId
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );

      setInterviewPreparation(result);
      setReviewedInterviewPreparation(copyInterviewPreparation(result));
      setSuccessMessage("面试准备已生成，请人工确认或编辑。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyStep(null);
    }
  }, [formValues, phoneNotes, phonePreparation?.workflowId, reviewedPhonePreparation]);

  const generateRecruiterSummary = useCallback(async (): Promise<void> => {
    if (!reviewedPhonePreparation || !reviewedInterviewPreparation) {
      setErrorMessage("请先完成电话初筛准备和面试准备。");
      return;
    }

    setBusyStep("summary");
    setErrorMessage(null);

    try {
      const result = await requestJson<RecruiterSummaryResult>("/api/recruit-together/summary", {
        body: JSON.stringify({
          ...formValues,
          interviewNotes,
          interviewPreparation: reviewedInterviewPreparation,
          phoneNotes,
          phonePreparation: reviewedPhonePreparation,
          workflowId: phonePreparation?.workflowId ?? interviewPreparation?.workflowId
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      setRecruiterSummary(result);
      setReviewedRecruiterSummary(copyRecruiterSummary(result));
      setSuccessMessage("招聘协作总结已生成，请人工确认或编辑。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyStep(null);
    }
  }, [
    formValues,
    interviewNotes,
    interviewPreparation?.workflowId,
    phoneNotes,
    phonePreparation?.workflowId,
    reviewedInterviewPreparation,
    reviewedPhonePreparation
  ]);

  const saveWorkflow = useCallback(async (): Promise<void> => {
    if (
      !reviewedPhonePreparation ||
      !reviewedInterviewPreparation ||
      !reviewedRecruiterSummary ||
      !phonePreparation ||
      !interviewPreparation ||
      !recruiterSummary
    ) {
      setErrorMessage("请先完成全部生成和人工确认。");
      return;
    }

    setBusyStep("save");
    setErrorMessage(null);

    try {
      const workflow = await requestJson<RecruitTogetherWorkflowDto>("/api/recruit-together", {
        body: JSON.stringify({
          ...formValues,
          aiModel: recruiterSummary.aiModel,
          aiProvider: recruiterSummary.aiProvider,
          generationTimes: {
            interviewPreparation: interviewPreparation.generationTimeMs,
            phonePreparation: phonePreparation.generationTimeMs,
            recruiterSummary: recruiterSummary.generationTimeMs
          },
          interviewNotes,
          interviewPreparation: reviewedInterviewPreparation,
          phoneNotes,
          phonePreparation: reviewedPhonePreparation,
          promptVersions: {
            interviewPreparation: interviewPreparation.promptVersion,
            phonePreparation: phonePreparation.promptVersion,
            recruiterSummary: recruiterSummary.promptVersion
          },
          recruiterSummary: reviewedRecruiterSummary,
          workflowId: recruiterSummary.workflowId
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      setSavedWorkflow(workflow);
      setSuccessMessage("Recruit Together workflow 已保存。");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setBusyStep(null);
    }
  }, [
    formValues,
    interviewNotes,
    interviewPreparation,
    phoneNotes,
    phonePreparation,
    recruiterSummary,
    reviewedInterviewPreparation,
    reviewedPhonePreparation,
    reviewedRecruiterSummary
  ]);

  const cancelWorkflow = useCallback((): void => {
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
    setPhonePreparation(null);
    setReviewedPhonePreparation(null);
    setPhoneNotes(initialPhoneNotes);
    setInterviewPreparation(null);
    setReviewedInterviewPreparation(null);
    setInterviewNotes(initialInterviewNotes);
    setRecruiterSummary(null);
    setReviewedRecruiterSummary(null);
    setSavedWorkflow(null);
  }

  return {
    busyStep,
    candidateInsights,
    cancelWorkflow,
    consumeSuccessMessage,
    dismissError,
    errorMessage,
    filteredCandidateInsights,
    formValues,
    generateInterviewPreparation,
    generatePhonePreparation,
    generateRecruiterSummary,
    interviewNotes,
    interviewPreparation,
    isLoading,
    jobProfiles,
    phoneNotes,
    phonePreparation,
    recruiterSummary,
    reviewedInterviewPreparation,
    reviewedPhonePreparation,
    reviewedRecruiterSummary,
    saveWorkflow,
    savedWorkflow,
    successMessage,
    updateField,
    updateInterviewNotes,
    updateInterviewPreparation,
    updatePhoneNotes,
    updatePhonePreparation,
    updateRecruiterSummary
  };
}

function resolveInitialFormValues(data: RecruitTogetherPageData): RecruitTogetherFormValues {
  const firstInsight = data.candidateInsights[0];
  const firstJobProfileId = firstInsight?.jobProfileId ?? data.jobProfiles[0]?.id ?? "";

  return {
    candidateInsightId:
      firstInsight?.id ??
      data.candidateInsights.find((insight) => insight.jobProfileId === firstJobProfileId)?.id ??
      "",
    jobProfileId: firstJobProfileId
  };
}

function validateSelection(values: RecruitTogetherFormValues): string | null {
  if (values.jobProfileId.trim().length === 0) {
    return "请选择已确认的岗位画像。";
  }

  if (values.candidateInsightId.trim().length === 0) {
    return "请选择已确认的候选人洞察。";
  }

  return null;
}

function copyPhonePreparation(result: PhonePreparationResult): PhoneScreenPreparationOutput {
  return {
    conversationChecklist: result.conversationChecklist,
    conversationGoals: result.conversationGoals,
    informationToConfirm: result.informationToConfirm,
    keyVerificationQuestions: result.keyVerificationQuestions,
    riskVerificationQuestions: result.riskVerificationQuestions,
    suggestedOpening: result.suggestedOpening,
    thingsToAvoid: result.thingsToAvoid
  };
}

function copyInterviewPreparation(result: InterviewPreparationResult): InterviewPreparationOutput {
  return {
    evidenceToVerify: result.evidenceToVerify,
    highPriorityTopics: result.highPriorityTopics,
    interviewFocus: result.interviewFocus,
    missingInformation: result.missingInformation,
    possibleFollowUpQuestions: result.possibleFollowUpQuestions,
    suggestedQuestions: result.suggestedQuestions
  };
}

function copyRecruiterSummary(result: RecruiterSummaryResult): RecruiterSummaryOutput {
  return {
    candidateTimeline: result.candidateTimeline,
    confirmedFacts: result.confirmedFacts,
    openQuestions: result.openQuestions,
    recruiterNotesSummary: result.recruiterNotesSummary,
    suggestedNextRecruiterActions: result.suggestedNextRecruiterActions,
    unconfirmedFacts: result.unconfirmedFacts
  };
}

async function requestJson<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as ApiResponse<TData>;

  if (!payload.success) {
    throw new RecruitTogetherRequestError(payload.error.code, payload.error.message);
  }

  return payload.data;
}

class RecruitTogetherRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RecruitTogetherRequestError";
    this.code = code;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败。";
}
