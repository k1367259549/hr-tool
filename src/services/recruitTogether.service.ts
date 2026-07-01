import { randomUUID } from "node:crypto";
import {
  validateInterviewPreparationOutput,
  validatePhoneScreenPreparationOutput,
  validateRecruiterSummaryOutput
} from "@/ai/schemas/recruitTogether.schema";
import { aiService } from "@/ai/ai.service";
import { candidateInsightRepository } from "@/repositories/candidateInsight.repository";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import { recruitTogetherRepository } from "@/repositories/recruitTogether.repository";
import { jobProfileService } from "@/services/jobProfile.service";
import type { CandidateInsight } from "@/types/candidateUnderstanding";
import type { JobProfile } from "@/types/jobProfile";
import type { JsonObject, JsonValue } from "@/types/ai";
import type {
  CandidateInsightOption,
  InterviewPreparationInput,
  InterviewPreparationResult,
  PhonePreparationResult,
  RecruiterSummaryInput,
  RecruiterSummaryResult,
  RecruitTogetherContextInput,
  RecruitTogetherCreateInput,
  RecruitTogetherPageData,
  RecruitTogetherPromptInput,
  RecruitTogetherWorkflow,
  RecruitTogetherWorkflowDto
} from "@/types/recruitTogether";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";
import { AppError } from "@/utils/errors";
import {
  normalizeInterviewPreparation,
  normalizePhonePreparation,
  normalizeRecruiterSummary
} from "@/utils/recruitTogetherValidation";

export class RecruitTogetherServiceError extends Error {
  readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND";

  constructor(
    code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "RecruitTogetherServiceError";
    this.code = code;
  }
}

export const recruitTogetherService = {
  async getPageData(): Promise<RecruitTogetherPageData> {
    const [jobProfiles, candidateInsights] = await Promise.all([
      jobProfileService.listReviewedJobProfiles(),
      listCandidateInsightOptions()
    ]);

    return {
      candidateInsights,
      jobProfiles
    };
  },

  async generatePhonePreparation(input: RecruitTogetherContextInput): Promise<PhonePreparationResult> {
    const workflowId = input.workflowId ?? randomUUID();
    const context = await loadContext(input.jobProfileId, input.candidateInsightId);

    try {
      const aiResult = await aiService.generateValidatedJsonFromPrompt({
        feature: "recruit-together-phone-preparation",
        promptFile: "phone-screen-preparation.md",
        validate: (value) =>
          normalizePhonePreparation(validatePhoneScreenPreparationOutput(value)),
        variables: {
          INPUT: createPromptInput(context)
        },
        workflow: "Workflow-03 Recruit Together"
      });

      return {
        ...aiResult.output,
        aiModel: aiResult.model,
        aiProvider: aiResult.provider,
        generatedAt: new Date().toISOString(),
        generationTimeMs: aiResult.generationTimeMs,
        promptFile: aiResult.prompt.fileName,
        promptVersion: aiResult.prompt.version,
        workflowId
      };
    } catch (error) {
      throw toRecruitTogetherAiError(error, "电话初筛准备生成失败。");
    }
  },

  async generateInterviewPreparation(
    input: InterviewPreparationInput
  ): Promise<InterviewPreparationResult> {
    const workflowId = input.workflowId ?? randomUUID();
    const context = await loadContext(input.jobProfileId, input.candidateInsightId);

    try {
      const aiResult = await aiService.generateValidatedJsonFromPrompt({
        feature: "recruit-together-interview-preparation",
        promptFile: "interview-preparation.md",
        validate: (value) =>
          normalizeInterviewPreparation(validateInterviewPreparationOutput(value)),
        variables: {
          INPUT: {
            ...createPromptInput(context),
            phoneNotes: input.phoneNotes as unknown as JsonObject,
            phonePreparation: input.phonePreparation as unknown as JsonObject
          }
        },
        workflow: "Workflow-03 Recruit Together"
      });

      return {
        ...aiResult.output,
        aiModel: aiResult.model,
        aiProvider: aiResult.provider,
        generatedAt: new Date().toISOString(),
        generationTimeMs: aiResult.generationTimeMs,
        promptFile: aiResult.prompt.fileName,
        promptVersion: aiResult.prompt.version,
        workflowId
      };
    } catch (error) {
      throw toRecruitTogetherAiError(error, "面试准备生成失败。");
    }
  },

  async generateRecruiterSummary(input: RecruiterSummaryInput): Promise<RecruiterSummaryResult> {
    const workflowId = input.workflowId ?? randomUUID();
    const context = await loadContext(input.jobProfileId, input.candidateInsightId);

    try {
      const aiResult = await aiService.generateValidatedJsonFromPrompt({
        feature: "recruit-together-summary",
        promptFile: "recruiter-summary.md",
        validate: (value) => normalizeRecruiterSummary(validateRecruiterSummaryOutput(value)),
        variables: {
          INPUT: {
            ...createPromptInput(context),
            interviewNotes: input.interviewNotes as unknown as JsonObject,
            interviewPreparation: input.interviewPreparation as unknown as JsonObject,
            phoneNotes: input.phoneNotes as unknown as JsonObject,
            phonePreparation: input.phonePreparation as unknown as JsonObject
          }
        },
        workflow: "Workflow-03 Recruit Together"
      });

      return {
        ...aiResult.output,
        aiModel: aiResult.model,
        aiProvider: aiResult.provider,
        generatedAt: new Date().toISOString(),
        generationTimeMs: aiResult.generationTimeMs,
        promptFile: aiResult.prompt.fileName,
        promptVersion: aiResult.prompt.version,
        workflowId
      };
    } catch (error) {
      throw toRecruitTogetherAiError(error, "招聘协作总结生成失败。");
    }
  },

  async saveWorkflow(input: RecruitTogetherCreateInput): Promise<RecruitTogetherWorkflowDto> {
    const workflowId = input.workflowId ?? randomUUID();
    await loadContext(input.jobProfileId, input.candidateInsightId);

    try {
      const workflow = await recruitTogetherRepository.create({
        ...input,
        workflowId
      });

      return toRecruitTogetherWorkflowDto(workflow);
    } catch (error) {
      if (error instanceof RecruitTogetherServiceError) {
        throw error;
      }

      throw new RecruitTogetherServiceError("DATABASE_ERROR", "保存招聘协作 workflow 失败。");
    }
  }
};

async function listCandidateInsightOptions(): Promise<CandidateInsightOption[]> {
  const insights = await candidateInsightRepository.findMany();

  return insights.map((insight) => ({
    candidateSource: insight.candidateSource,
    createdAt: insight.createdAt.toISOString(),
    id: insight.id,
    jobProfileId: insight.jobProfileId,
    summary: insight.summary as unknown as CandidateInsightOption["summary"],
    title: createCandidateInsightTitle(insight)
  }));
}

async function loadContext(
  jobProfileId: string,
  candidateInsightId: string
): Promise<{ jobProfile: JobProfile; candidateInsight: CandidateInsight }> {
  const [jobProfile, candidateInsight] = await Promise.all([
    jobProfileRepository.findById(jobProfileId),
    candidateInsightRepository.findById(candidateInsightId)
  ]);

  if (!jobProfile) {
    throw new RecruitTogetherServiceError("NOT_FOUND", "未找到已确认的岗位画像。");
  }

  if (!candidateInsight) {
    throw new RecruitTogetherServiceError("NOT_FOUND", "未找到已确认的候选人洞察。");
  }

  if (candidateInsight.jobProfileId !== jobProfile.id) {
    throw new RecruitTogetherServiceError("VALIDATION_ERROR", "候选人洞察与岗位画像不匹配。");
  }

  return {
    candidateInsight,
    jobProfile
  };
}

function createPromptInput({
  candidateInsight,
  jobProfile
}: {
  jobProfile: JobProfile;
  candidateInsight: CandidateInsight;
}): RecruitTogetherPromptInput {
  return {
    candidateInsight: {
      evidence: candidateInsight.evidence as unknown as JsonValue,
      insights: candidateInsight.insights as unknown as JsonValue,
      missingInformation: candidateInsight.missingInformation,
      potentialRisks: candidateInsight.potentialRisks,
      strengths: candidateInsight.strengths,
      suggestedInterviewQuestions: candidateInsight.suggestedInterviewQuestions,
      suggestedNextActions: candidateInsight.suggestedNextActions,
      suggestedPhoneScreenQuestions: candidateInsight.suggestedPhoneScreenQuestions,
      summary: candidateInsight.summary as unknown as JsonValue
    },
    jobProfile: {
      hiringFocus: jobProfile.hiringFocus,
      interviewFocus: jobProfile.interviewFocus,
      jobSummary: jobProfile.jobSummary,
      jobTitle: jobProfile.jobTitle,
      potentialRisks: jobProfile.potentialRisks,
      requiredCompetencies: jobProfile.requiredCompetencies
    }
  };
}

function createCandidateInsightTitle(insight: CandidateInsight): string {
  const summary = insight.summary as unknown as { candidateOverview?: string };
  const overview = summary.candidateOverview?.trim();

  return overview ? overview.slice(0, 60) : `Candidate Insight ${insight.id.slice(0, 8)}`;
}

function toRecruitTogetherWorkflowDto(
  workflow: RecruitTogetherWorkflow
): RecruitTogetherWorkflowDto {
  return {
    ...workflow,
    createdAt: workflow.createdAt.toISOString(),
    generationTimes: workflow.generationTimes as RecruitTogetherWorkflowDto["generationTimes"],
    humanReview: workflow.humanReview as RecruitTogetherWorkflowDto["humanReview"],
    interviewNotes: workflow.interviewNotes as RecruitTogetherWorkflowDto["interviewNotes"],
    interviewPreparation:
      workflow.interviewPreparation as RecruitTogetherWorkflowDto["interviewPreparation"],
    phoneNotes: workflow.phoneNotes as RecruitTogetherWorkflowDto["phoneNotes"],
    phonePreparation: workflow.phonePreparation as RecruitTogetherWorkflowDto["phonePreparation"],
    promptVersions: workflow.promptVersions as RecruitTogetherWorkflowDto["promptVersions"],
    recruiterSummary: workflow.recruiterSummary as RecruitTogetherWorkflowDto["recruiterSummary"],
    updatedAt: workflow.updatedAt.toISOString()
  };
}

function toRecruitTogetherAiError(error: unknown, fallbackMessage: string): RecruitTogetherServiceError {
  if (error instanceof RecruitTogetherServiceError) {
    return error;
  }

  if (error instanceof AppError) {
    return new RecruitTogetherServiceError("AI_ERROR", getSafeAiErrorMessage(error, fallbackMessage));
  }

  return new RecruitTogetherServiceError("AI_ERROR", "AI 招聘协作输出无效。");
}
