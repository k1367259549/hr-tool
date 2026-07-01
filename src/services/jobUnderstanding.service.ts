import { randomUUID } from "node:crypto";
import { validateJobUnderstandingAiOutput } from "@/ai/schemas/jobUnderstanding.schema";
import { aiService } from "@/ai/ai.service";
import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type {
  JobProfile,
  JobProfileCreateInput,
  JobUnderstandingInput,
  JobUnderstandingResult
} from "@/types/jobProfile";
import type { JsonObject } from "@/types/ai";
import { getSafeAiErrorMessage } from "@/utils/aiErrorMessage";
import { AppError } from "@/utils/errors";
import { normalizeJobUnderstandingOutput } from "@/utils/jobUnderstandingValidation";

const promptFile = "job-understanding.md";

export class JobUnderstandingServiceError extends Error {
  readonly code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR";

  constructor(code: "AI_ERROR" | "VALIDATION_ERROR" | "DATABASE_ERROR", message: string) {
    super(message);
    this.name = "JobUnderstandingServiceError";
    this.code = code;
  }
}

export const jobUnderstandingService = {
  async generateJobUnderstanding(input: JobUnderstandingInput): Promise<JobUnderstandingResult> {
    try {
      const aiResult = await aiService.generateValidatedJsonFromPrompt({
        feature: "job-understanding",
        promptFile,
        validate: (value) => normalizeJobUnderstandingOutput(validateJobUnderstandingAiOutput(value)),
        variables: {
          INPUT: createPromptInput(input)
        },
        workflow: "Workflow-01 Job Understanding"
      });

      return {
        ...aiResult.output,
        aiModel: aiResult.model,
        aiProvider: aiResult.provider,
        generatedAt: new Date().toISOString(),
        generationTimeMs: aiResult.generationTimeMs,
        promptFile: aiResult.prompt.fileName,
        promptVersion: aiResult.prompt.version,
        workflowId: randomUUID()
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw new JobUnderstandingServiceError(
          "AI_ERROR",
          getSafeAiErrorMessage(error, "岗位理解生成失败。")
        );
      }

      throw new JobUnderstandingServiceError("AI_ERROR", "AI 岗位理解输出无效。");
    }
  },

  async saveReviewedJobProfile(input: JobProfileCreateInput): Promise<JobProfile> {
    try {
      return await jobProfileRepository.create(input);
    } catch {
      throw new JobUnderstandingServiceError("DATABASE_ERROR", "保存岗位画像失败。");
    }
  }
};

function createPromptInput(input: JobUnderstandingInput): JsonObject {
  return {
    hiringGoal: input.hiringGoal ?? "",
    jd: input.jd,
    jobTitle: input.jobTitle,
    leaderRequirements: input.leaderRequirements ?? "",
    teamBackground: input.teamBackground ?? ""
  };
}
